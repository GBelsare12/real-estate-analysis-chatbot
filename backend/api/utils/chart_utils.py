import pandas as pd

# rate columns expected (normalized names)
RATE_COLS = [
    'flat - weighted average rate',
    'office - weighted average rate',
    'shop - weighted average rate',
    'others - weighted average rate'
]

def _find_column(df: pd.DataFrame, target_lower: str):
    """Finds the column name matching the target_lower (normalized, lowercase)."""
    for c in df.columns:
        if c == target_lower.strip().lower(): # Checks against normalized columns
            return c
    return None

def _find_demand_column(df: pd.DataFrame):
    """Identifies the best demand/sales column to use."""
    candidates = ['total sold - igr', 'total_sales - igr', 'total units']
    for cand in candidates:
        found = _find_column(df, cand)
        if found:
            # Check if the column actually contains valid numerical data
            nums = pd.to_numeric(df[found], errors='coerce').dropna()
            if len(nums) > 0 and nums.sum() > 0:
                return found
    return None

def build_chart_json(df: pd.DataFrame) -> dict:
    """
    Aggregates filtered data by year to create time series data for the frontend chart.
    
    Returns:
     {
       "years": [...],
       "rates": {"flat": [...], "overall": [...]},
       "demand": [...]
     }
    """
    if df is None or df.empty:
        return {"years": [], "rates": {}, "demand": []}

    year_col = _find_column(df, 'year')
    if year_col is None:
        return {"years": [], "rates": {}, "demand": []}

    tmp = df.copy()
    
    rates_output = {}
    present_rates = {}
    
    # 1. Prepare Rate Data
    for expected_rate in RATE_COLS:
        colname = _find_column(tmp, expected_rate)
        if colname:
            # Ensure the column is numeric 
            tmp[colname] = pd.to_numeric(tmp[colname], errors='coerce')
            
            # Map the clean rate type (e.g., 'flat') to the actual column name
            rate_type = expected_rate.split(' - ')[0]
            present_rates[rate_type] = colname

    # Aggregation requires that we have at least one rate column and the year column
    if present_rates and year_col:
        agg_dict = {colname: 'mean' for colname in present_rates.values()}
        
        try:
            # Group and aggregate rates
            grouped_rates = tmp.groupby(year_col).agg(agg_dict).reset_index().sort_values(year_col)
        except Exception:
            # Handle case where aggregation fails (e.g., non-numeric data)
            grouped_rates = pd.DataFrame() 
            
        if not grouped_rates.empty:
            years = grouped_rates[year_col].astype(str).tolist()

            for rate_type, colname in present_rates.items():
                series = [None if pd.isna(x) else round(float(x), 2) for x in grouped_rates[colname].tolist()]
                rates_output[rate_type] = series

            # Calculate overall average across all valid rate columns per year
            overall_series = []
            for _, row in grouped_rates.iterrows():
                vals = []
                for colname in present_rates.values():
                    v = row.get(colname)
                    if pd.notna(v):
                        vals.append(float(v))
                overall_series.append(round(sum(vals)/len(vals), 2) if vals else None)
            rates_output['overall'] = overall_series
        else:
            years = []
    else:
        years = []


    # 2. Prepare Demand Data
    demand_col = _find_demand_column(tmp)
    demand_series = []
    
    if demand_col and years:
        try:
            # Group and sum demand
            grouped_demand = tmp.groupby(year_col).agg({demand_col: 'sum'}).reset_index()
            
            # Use grouped_rates years to align demand data
            merged_df = pd.DataFrame({year_col: grouped_rates[year_col].unique()})
            merged_df = merged_df.merge(grouped_demand, on=year_col, how='left')
            
            demand_series = [int(x) if pd.notna(x) else 0 for x in merged_df[demand_col].tolist()]
        except Exception:
            demand_series = [0] * len(years) 
    elif years:
         demand_series = [0] * len(years) # Default to zero if demand column is missing but years exist

    return {
       "years": [str(y) for y in years], 
       "rates": rates_output,
       "demand": demand_series
    }