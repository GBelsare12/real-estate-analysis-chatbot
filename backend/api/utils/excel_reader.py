import pandas as pd
from pathlib import Path
import warnings
from datetime import datetime
import os 

# Suppress openpyxl warnings related to merged cells/data validation
warnings.filterwarnings("ignore", category=UserWarning, module="openpyxl")

# Define rate columns for filtering/aggregation consistency
RATE_COLS = [
    'flat - weighted average rate',
    'office - weighted average rate',
    'shop - weighted average rate',
    'others - weighted average rate'
]

# Base path structure
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = BASE_DIR / "data"

# File paths for preloaded and uploaded data
PRELOADED_PATH = DATA_DIR / "dataset.xlsx"
UPLOADED_PATH = DATA_DIR / "uploaded_dataset.xlsx" # DYNAMIC FILE PATH

def _normalize_cols(df: pd.DataFrame) -> pd.DataFrame:
    """Normalizes column names to lowercase, stripped, and replaces hyphens/underscores with spaces."""
    df = df.copy()
    # Replace non-alphanumeric characters with spaces and then clean up
    df.columns = [str(c).strip().lower().replace('-', ' ').replace('_', ' ') for c in df.columns]
    return df

def load_dataset() -> pd.DataFrame:
    """
    Loads dataset. Returns empty DataFrame on failure.
    PRIORITIZES the UPLOADED file, then falls back to the PRELOADED file.
    """
    df = pd.DataFrame()
    
    # 1. Try UPLOADED file first
    if UPLOADED_PATH.exists():
        path_to_load = UPLOADED_PATH
    else:
        path_to_load = PRELOADED_PATH

    print(f"Attempting to load data from: {path_to_load.name}")
    
    # Try .xlsx
    if path_to_load.exists() and path_to_load.suffix in ['.xlsx', '.xls']:
        try:
            df = pd.read_excel(path_to_load, engine="openpyxl")
        except Exception as e:
            print(f"Error reading XLSX dataset {path_to_load.name}: {e}")
            
    # Fallback to CSV (assuming similar naming convention if CSV was used)
    csv_path = path_to_load.with_name(path_to_load.stem + " - Sheet1.csv") 
    if df.empty and csv_path.exists():
        try:
            df = pd.read_csv(csv_path)
        except Exception as e:
            print(f"Error reading CSV dataset {csv_path.name}: {e}")
            
    if df.empty:
        print(f"Error: No valid dataset found in the 'data' directory.")
        return pd.DataFrame()

    df = _normalize_cols(df)
    return df

def filter_area_data(
    area_name: str, 
    min_rate: float = None, 
    max_rate: float = None,
    min_year: int = None,
    max_year: int = None
) -> pd.DataFrame:
    """
    Filters dataset by area name (case-insensitive) and optionally by rate and year range.
    Returns a copy of the filtered DataFrame.
    """
    df = load_dataset()
    if df.empty:
        return df

    # --- 1. Filter by Area ---
    area_col_norm = "final location"
    area_col = next((c for c in df.columns if c == area_col_norm), None)

    if area_col is None:
        raise KeyError("Dataset missing 'final location' column (after normalization)")

    df[area_col] = df[area_col].astype(str).str.strip()
    filtered = df[df[area_col].str.lower() == str(area_name).lower()].copy()
    
    if filtered.empty:
        return filtered

    # --- 2. Normalize and Filter by Year ---
    year_col = next((c for c in filtered.columns if c == "year"), None)
    if year_col:
        try:
            # Convert year to nullable integer for filtering
            filtered[year_col] = pd.to_numeric(filtered[year_col], errors="coerce").astype('Int64')
        except Exception:
            pass
        
        # Apply minimum year filter
        if min_year is not None:
            filtered = filtered[filtered[year_col] >= min_year]
        
        # Apply maximum year filter
        if max_year is not None:
            filtered = filtered[filtered[year_col] <= max_year]
            
        if filtered.empty:
            print(f"Warning: No data for {area_name} found in years {min_year}-{max_year}.")
            return filtered


    # --- 3. Filter by Price/Rate (Targeting the main 'flat' rate) ---
    if min_rate is not None or max_rate is not None:
        rate_col_norm = "flat - weighted average rate"
        rate_col = next((c for c in filtered.columns if c == rate_col_norm), None)
        
        if rate_col:
            # Convert rate column to numeric, coercing errors
            filtered[rate_col] = pd.to_numeric(filtered[rate_col], errors='coerce')
            
            # Apply minimum rate filter
            if min_rate is not None and min_rate > 0:
                filtered = filtered[filtered[rate_col] >= min_rate]
            
            # Apply maximum rate filter
            if max_rate is not None and max_rate > 0:
                filtered = filtered[filtered[rate_col] <= max_rate]
        else:
            print("Warning: Cannot filter by rate. Rate column not found.")
            
    return filtered