from django import template
from decimal import Decimal

register = template.Library()

@register.filter
def format_price(value):
    """Format price to display with exactly one decimal place and thousands separators"""
    if value is None:
        return '0.0'
    try:
        from decimal import ROUND_HALF_UP
        # Convert to string first to handle both string and numeric inputs
        str_value = str(value).strip()
        if not str_value:
            return '0.0'
        # Remove any currency symbols or commas
        str_value = str_value.replace('PKR', '').replace(',', '').strip()
        decimal_value = Decimal(str_value).quantize(Decimal('0.0'), rounding=ROUND_HALF_UP)
        # Format with one decimal place and add thousands separator
        formatted_value = '{:,.1f}'.format(float(decimal_value))
        return formatted_value
    except (ValueError, TypeError, InvalidOperation):
        # Return a safe default value for invalid inputs
        return '0.0'

        
@register.filter
def multiply(value, arg):
    """Multiplies the value by the argument"""
    try:
        from decimal import Decimal
        return Decimal(str(value)) * Decimal(str(arg))
    except (ValueError, TypeError):
        return ''

@register.filter
def add(value, arg):
    """Adds the arg to the value."""
    try:
        from decimal import Decimal
        return Decimal(str(value)) + Decimal(str(arg))
    except (ValueError, TypeError):
        return ''

@register.filter
def subtract(value, arg):
    """Subtracts the arg from the value."""
    try:
        from decimal import Decimal
        return Decimal(str(value)) - Decimal(str(arg))
    except (ValueError, TypeError):
        return ''