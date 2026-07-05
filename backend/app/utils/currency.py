def format_inr(amount: int) -> str:
    """
    Formats an integer rupee amount using Indian lakh/crore grouping (e.g., 1650000 -> "₹16,50,000").
    Supports negative numbers as well.
    """
    is_negative = amount < 0
    s = str(abs(amount))
    
    if len(s) <= 3:
        res = s
    else:
        last_three = s[-3:]
        remaining = s[:-3]
        groups = []
        while remaining:
            groups.append(remaining[-2:])
            remaining = remaining[:-2]
        groups.reverse()
        res = f"{','.join(groups)},{last_three}"
        
    return f"-₹{res}" if is_negative else f"₹{res}"
