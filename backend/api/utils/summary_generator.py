import os
import pandas as pd
import unicodedata
from dotenv import load_dotenv
import math

# Load environment variables for API key (if used)
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# --- Helper Functions for Data Analysis ---

def _safe_mean(series):
    """Computes mean of a series, safely handling NaNs and non-numeric data."""
    try:
        s = pd.to_numeric(series.dropna(), errors="coerce")
        s = s[s.notna()]
        if len(s) == 0:
            return None
        return float(s.mean())
    except Exception:
        return None

def _find_demand_column(df: pd.DataFrame):
    """Identify the best demand column (matching chart_utils)."""
    candidates = ['total sold - igr', 'total_sales - igr', 'total units']
    for cand in candidates:
        found = next((c for c in df.columns if c.strip().lower() == cand), None)
        if found:
            nums = pd.to_numeric(df[found], errors='coerce').dropna()
            if len(nums) > 0 and nums.sum() > 0:
                return found
    return None

def _compute_price_trend(df: pd.DataFrame, year_col: str, rate_cols: list):
    """Computes the overall price trend (increasing, decreasing, or stable)."""
    if not rate_cols or not year_col or df.empty:
        return [], "stable"
    
    temp_df = df.copy()
    
    # Ensure rate columns are numeric
    for col in rate_cols:
        colname = next((c for c in temp_df.columns if c == col), None)
        if colname:
            temp_df[colname] = pd.to_numeric(temp_df[colname], errors='coerce')
        
    # Calculate overall average rate per row
    rate_columns = [c for c in rate_cols if c in temp_df.columns]
    if not rate_columns:
        return [], "stable"
        
    temp_df['OverallRate'] = temp_df[rate_columns].mean(axis=1)

    # Group by year and get mean rate
    yearly_rates = temp_df.groupby(year_col)['OverallRate'].mean().sort_index().dropna()
    
    if len(yearly_rates) < 2:
        return yearly_rates.tolist(), "stable"

    # Calculate trend: difference between last and first year mean rate
    start_rate = yearly_rates.iloc[0]
    end_rate = yearly_rates.iloc[-1]
    
    diff = end_rate - start_rate
    
    if diff > 0.05 * start_rate: # Increase threshold 
        trend = "increasing"
    elif diff < -0.05 * start_rate: # Decrease threshold
        trend = "decreasing"
    else:
        trend = "stable"
        
    return yearly_rates.tolist(), trend

def _build_ascii_summary(area, num_years, overall_avg, total_demand, price_trend, demand_trend, latest_year) -> str:
    """Creates a mock LLM output summary."""
    summary_lines = []

    # Format numbers nicely
    if overall_avg:
        overall_avg_str = f"INR {overall_avg:,.2f}"
    else:
        overall_avg_str = "N/A"
        
    total_demand_str = f"{total_demand:,}"

    summary_lines.append(f"Market Analysis Report for: {area.title()}")
    summary_lines.append(f"--------------------------------------------------")
    summary_lines.append(f"Period Covered: {num_years} years (up to {latest_year})")
    summary_lines.append(f"")
    summary_lines.append(f"1. Average Price Trend: The overall weighted average rate shows a **{price_trend}** trend.")
    summary_lines.append(f"   The long-term average rate in this area is approximately {overall_avg_str} per unit.")
    summary_lines.append(f"")
    summary_lines.append(f"2. Demand Trend: The annual demand (total units sold) has been **{demand_trend}**.")
    summary_lines.append(f"   Total units sold across the period is {total_demand_str}.")
    
    return "\n".join(summary_lines)


def _simple_summary(area: str, df: pd.DataFrame) -> str:
    """Generates the data points needed for the text summary."""
    if df.empty:
        return f"No data was found for the area: {area.title()}."

    year_col = next((c for c in df.columns if c == 'year'), None)
    demand_col = _find_demand_column(df)
    rate_cols = ['flat - weighted average rate', 'office - weighted average rate', 'shop - weighted average rate', 'others - weighted average rate']
    
    # 1. Period and Avg Price
    if year_col:
        years_present = df[year_col].dropna().unique()
        num_years = len(years_present)
        latest_year = int(years_present.max()) if len(years_present) > 0 else 'N/A'
    else:
        num_years = 0
        latest_year = 'N/A'
    
    rate_series = df[[c for c in rate_cols if c in df.columns]].stack()
    overall_avg = _safe_mean(rate_series)
    
    # 2. Demand
    total_demand = int(pd.to_numeric(df[demand_col], errors='coerce').fillna(0).sum()) if demand_col else 0

    # 3. Trends
    demand_trend = "stable"
    if year_col and demand_col:
        try:
            yearly_demand = df.groupby(year_col)[demand_col].sum().sort_index().dropna()
            if len(yearly_demand) >= 2:
                # Compare the first half average to the second half average
                mid_point = len(yearly_demand) // 2
                first_half_avg = yearly_demand.iloc[:mid_point].mean()
                second_half_avg = yearly_demand.iloc[mid_point:].mean()
                
                if second_half_avg > 1.1 * first_half_avg:
                    demand_trend = "increasing"
                elif second_half_avg < 0.9 * first_half_avg:
                    demand_trend = "decreasing"
                else:
                    demand_trend = "stable"
        except Exception:
            pass

    price_series, price_trend = _compute_price_trend(df, year_col, rate_cols)

    # Build ASCII summary
    final = _build_ascii_summary(area, num_years, overall_avg, total_demand, price_trend, demand_trend, latest_year)
    return final


def generate_summary(area: str, df: pd.DataFrame, use_llm: bool = False) -> str:
    """
    Primary function to generate the text summary. Mocks LLM if key is missing/not used.
    """
    base = _simple_summary(area, df)
    
    # Mock LLM usage as required by the assignment
    if not use_llm or not OPENAI_API_KEY:
        return base

    
    return base