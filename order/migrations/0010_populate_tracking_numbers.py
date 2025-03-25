from django.db import migrations, models
from datetime import datetime
import uuid

def generate_tracking_number():
    timestamp = datetime.now().strftime('%y%m%d')
    random_str = str(uuid.uuid4().hex)[:6].upper()
    return f'ORD{timestamp}{random_str}'

def populate_tracking_numbers(apps, schema_editor):
    Order = apps.get_model('order', 'Order')
    db_alias = schema_editor.connection.alias
    
    # Get all orders without tracking numbers
    orders = Order.objects.using(db_alias).filter(tracking_number__isnull=True)
    for order in orders:
        order.tracking_number = generate_tracking_number()
        order.save()

class Migration(migrations.Migration):
    dependencies = [
        ('order', '0009_order_tracking_number_with_data'),
    ]

    operations = [
        migrations.RunPython(populate_tracking_numbers),
    ]