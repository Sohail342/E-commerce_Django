from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('order', '0011_alter_tracking_number_unique'),
    ]

    operations = [
        migrations.AlterField(
            model_name='order',
            name='tracking_number',
            field=models.CharField(max_length=50, unique=True, null=True),
        ),
    ]