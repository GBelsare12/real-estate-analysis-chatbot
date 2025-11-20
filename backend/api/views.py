import re
from difflib import get_close_matches
from datetime import datetime
import pandas as pd
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.core.files.storage import FileSystemStorage

from .utils.excel_reader import load_dataset, filter_area_data, UPLOADED_PATH
from .utils.chart_utils import build_chart_json
from .utils.summary_generator import generate_summary

def _extract_time_filter(query_text: str):
    """Parses query for time constraints (e.g., 'last 3 years')."""
    current_year = datetime.now().year
    min_year = None
    max_year = current_year 

    # 1. Simple check for 'last X years'
    match = re.search(r'last\s+(\d+)\s+years', query_text)
    if match:
        num_years = int(match.group(1))
        min_year = current_year - num_years
        return min_year, max_year

    # 2. Simple check for 'since X year' (e.g., since 2020)
    match = re.search(r'since\s+(\d{4})', query_text)
    if match:
        min_year = int(match.group(1))
        return min_year, max_year
    
    return min_year, max_year


def _extract_matched_areas(query_text: str, df: pd.DataFrame, area_col: str) -> list:
    """Extracts unique areas from the query text using fuzzy matching."""
    all_areas = [str(a).strip().lower() for a in df[area_col].unique() if pd.notna(a)]
    matched_areas = []

    # Simple check for direct presence
    for known_area in all_areas:
        if known_area in query_text:
            matched_areas.append(known_area)

    # Fallback to fuzzy matching on non-common tokens
    if len(matched_areas) < 2: 
        common_words = ['analyze', 'analysis', 'compare', 'demand', 'trends', 'show', 'price', 'growth', 'over', 'the', 'last', 'years']
        tokens = [t for t in query_text.split() if len(t) > 2 and t not in common_words]
        
        for t in tokens:
            matches = get_close_matches(t, all_areas, n=1, cutoff=0.8)
            if matches and matches[0] not in matched_areas:
                 matched_areas.append(matches[0])
    
    # Clean and prioritize unique areas
    return list(dict.fromkeys(matched_areas))


@api_view(['POST'])
def query_view(request):
    """
    Handles queries for single area analysis, comparison, and time filtering.
    """
    data = request.data
    query_text = (data.get("query") or "").strip().lower()
    use_llm = bool(data.get("use_llm", False))

    if not query_text:
        return Response({"error": "query field is required."}, status=status.HTTP_400_BAD_REQUEST)

    df = load_dataset()
    if df is None or df.empty:
        return Response({"error": "Dataset not found or empty. Please upload a file first."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Area column check (assumed to be 'final location')
    area_col_norm = "final location"
    area_col = next((c for c in df.columns if c == area_col_norm), None)
    if area_col is None:
        return Response({"error": "Dataset missing 'final location' column."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # --- 1. PARSE QUERY ---
    matched_areas = _extract_matched_areas(query_text, df, area_col)
    min_year, max_year = _extract_time_filter(query_text)
    
    # Fallback to default area if nothing is matched
    if not matched_areas:
         matched_areas.append("Wakad") 

    # --- 2. SINGLE AREA ANALYSIS (Default path) ---
    if len(matched_areas) <= 1:
        matched_area = matched_areas[0]

        # Apply Area AND Time filtering
        filtered_df = filter_area_data(
            matched_area, 
            min_year=min_year, 
            max_year=max_year
        )
        
        if filtered_df.empty:
            return Response({"error": f"No data found for {matched_area.title()} within the specified time range."}, status=status.HTTP_404_NOT_FOUND)

        # Original single-output JSON structure
        chart_data = build_chart_json(filtered_df)
        summary = generate_summary(matched_area, filtered_df, use_llm=use_llm)
        table = filtered_df.fillna("").to_dict(orient="records")
        
        return Response({
            "area": matched_area.title(), 
            "summary": summary, 
            "chart": chart_data, 
            "table": table
        }, status=status.HTTP_200_OK)

    # --- 3. MULTI-AREA COMPARISON LOGIC ---
    
    multi_chart_data = []
    
    for area in matched_areas:
        # Apply Area AND Time filtering to each area
        filtered_df = filter_area_data(
            area, 
            min_year=min_year, 
            max_year=max_year
        )
        
        # Only include areas that actually have data
        if not filtered_df.empty:
            chart = build_chart_json(filtered_df)
            multi_chart_data.append({
                "area": area.title(),
                "chart": chart,
            })
        
    if not multi_chart_data:
        return Response({"error": "No data found for the areas specified in the comparison query."}, status=status.HTTP_404_NOT_FOUND)

    # Return comparison structure (Frontend uses 'multi_chart_data')
    return Response({
        "comparison_areas": [d['area'] for d in multi_chart_data],
        "summary": f"Comparison analysis for: {', '.join([d['area'] for d in multi_chart_data])}",
        "multi_chart_data": multi_chart_data,
        "table": [], # Comparison usually omits the detailed table
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def upload_dataset_view(request):
    """Handles dataset file upload and saves it to the /data directory."""
    if 'file' not in request.FILES:
        return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)
    
    uploaded_file = request.FILES['file']
    
    if not uploaded_file.name.endswith(('.xlsx', '.xls', '.csv')):
        return Response({"error": "Invalid file type. Only Excel (.xlsx, .xls) and CSV are supported."}, status=status.HTTP_400_BAD_REQUEST)
    
    # Use FileSystemStorage to save the file, renaming it to UPLOADED_PATH
    fs = FileSystemStorage(location=UPLOADED_PATH.parent)
    
    # Save the file with the standard uploaded filename, overwriting any previous upload
    filename = fs.save(UPLOADED_PATH.name, uploaded_file)
    
    return Response({"message": f"Dataset uploaded successfully: {filename}. Please submit a query to analyze the new data."}, status=status.HTTP_200_OK)

@api_view(['GET'])
def list_areas_view(request):
    df = load_dataset()
    if df is None or df.empty:
        return Response({"error": "Dataset not found or empty."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    area_col = next((c for c in df.columns if c.strip().lower() == "final location"), None)
    if area_col is None:
        return Response({"error": "Dataset missing 'final location' column."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    areas = [str(a).strip() for a in df[area_col].unique() if pd.notna(a)]
    return Response({"areas": sorted(areas)}, status=status.HTTP_200_OK)