from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('order', '0010_populate_tracking_numbers'),
    ]

    operations = [
        migrations.AlterField(
            model_name='order',
            name='tracking_number',
            field=models.CharField(max_length=50, unique=True),
        ),
    ]