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
    orders = Order.objects.using(db_alias).all()
    for order in orders:
        if not order.tracking_number:
            order.tracking_number = generate_tracking_number()
            order.save()

class Migration(migrations.Migration):
    dependencies = [
        ('order', '0008_alter_order_cart'),
    ]

    operations = [
        # First add the field without unique constraint
        migrations.AddField(
            model_name='order',
            name='tracking_number',
            field=models.CharField(max_length=20, blank=True, null=True),
        ),
        # Then populate existing orders with tracking numbers
        migrations.RunPython(populate_tracking_numbers),
        # Finally, add the unique constraint and remove null=True
        migrations.AlterField(
            model_name='order',
            name='tracking_number',
            field=models.CharField(max_length=20, unique=True, blank=True),
        ),
    ]