import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import string
from django.db.models.signals import post_init
from shop.models import Category, Product, ProductImage


class Command(BaseCommand):
    help = 'Generate dummy products, categories, and product images for testing purposes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--categories',
            type=int,
            default=5,
            help='Number of categories to create (default: 5)'
        )
        parser.add_argument(
            '--products',
            type=int,
            default=20,
            help='Number of products to create (default: 20)'
        )
        parser.add_argument(
            '--images-per-product',
            type=int,
            default=3,
            help='Number of images per product (default: 3)'
        )
        parser.add_argument(
            '--clear-existing',
            action='store_true',
            help='Clear existing data before generating new data'
        )

    def handle(self, *args, **options):
        categories_count = options['categories']
        products_count = options['products']
        images_per_product = options['images_per_product']
        clear_existing = options['clear_existing']

        if clear_existing:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            ProductImage.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Existing data cleared.'))

        self.stdout.write(
            self.style.SUCCESS(
                f'Generating {categories_count} categories, {products_count} products, '
                f'and {products_count * images_per_product} product images...'
            )
        )

        # Temporarily disconnect the post_init signal to avoid the save issue
        from shop.models import check_product_sale_status
        post_init.disconnect(check_product_sale_status, sender=Product)
        
        try:
            # Generate categories
            categories = self.create_categories(categories_count)
            
            # Generate products
            products = self.create_products(products_count, categories)
            
            # Generate product images
            self.create_product_images(products, images_per_product)
        finally:
            # Reconnect the signal
            post_init.connect(check_product_sale_status, sender=Product)

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully generated {len(categories)} categories, '
                f'{len(products)} products, and {len(products) * images_per_product} images'
            )
        )

    def create_categories(self, count):
        """Create realistic product categories"""
        category_data = [
            {'name': 'Electronics', 'cat_moto': 'Cutting-edge technology'},
            {'name': 'Clothing', 'cat_moto': 'Fashion for everyone'},
            {'name': 'Home & Garden', 'cat_moto': 'Make your space beautiful'},
            {'name': 'Books', 'cat_moto': 'Knowledge and adventure'},
            {'name': 'Sports', 'cat_moto': 'Stay active and fit'},
            {'name': 'Beauty', 'cat_moto': 'Look and feel your best'},
            {'name': 'Toys', 'cat_moto': 'Fun for all ages'},
            {'name': 'Food', 'cat_moto': 'Delicious and fresh'},
            {'name': 'Automotive', 'cat_moto': 'Drive in style'},
            {'name': 'Health', 'cat_moto': 'Your wellness matters'},
        ]

        categories = []
        for i in range(min(count, len(category_data))):
            data = category_data[i]
            category, created = Category.objects.get_or_create(
                name=data['name'],
                defaults={
                    'cat_moto': data['cat_moto'],
                    'photo': 'products_category/default_category.jpg'
                }
            )
            if created:
                categories.append(category)
                self.stdout.write(self.style.SUCCESS(f'Created category: {category.name}'))

        # If we need more categories than predefined ones, create random ones
        while len(categories) < count:
            name = f"Category {len(categories) + 1}"
            category, created = Category.objects.get_or_create(
                name=name,
                defaults={
                    'cat_moto': f'Description for {name}',
                    'photo': 'products_category/default_category.jpg'
                }
            )
            if created:
                categories.append(category)
                self.stdout.write(self.style.SUCCESS(f'Created category: {category.name}'))

        return categories

    def create_products(self, count, categories):
        """Generate products with randomized attributes"""
        products = []
        
        # Sample product names and descriptions for realism
        product_templates = [
            {'base_name': 'Premium Wireless Headphones', 'details': 'High-quality wireless headphones with noise cancellation and premium sound quality.'},
            {'base_name': 'Organic Cotton T-Shirt', 'details': 'Comfortable and sustainable cotton t-shirt available in various colors and sizes.'},
            {'base_name': 'Smart Home Speaker', 'details': 'Voice-controlled smart speaker with integrated AI assistant and premium audio.'},
            {'base_name': 'Professional Yoga Mat', 'details': 'Non-slip, eco-friendly yoga mat perfect for all skill levels and yoga styles.'},
            {'base_name': 'Gourmet Coffee Beans', 'details': 'Artisan roasted coffee beans from premium sources around the world.'},
            {'base_name': 'Wireless Charging Pad', 'details': 'Fast wireless charging pad compatible with all Qi-enabled devices.'},
            {'base_name': 'Stainless Steel Water Bottle', 'details': 'Insulated water bottle that keeps drinks cold for 24 hours or hot for 12 hours.'},
            {'base_name': 'Bluetooth Fitness Tracker', 'details': 'Advanced fitness tracker with heart rate monitoring and GPS functionality.'},
            {'base_name': 'Organic Face Moisturizer', 'details': 'Natural and organic face moisturizer suitable for all skin types.'},
            {'base_name': 'LED Desk Lamp', 'details': 'Adjustable LED desk lamp with multiple brightness levels and color temperatures.'},
        ]

        for i in range(count):
            template = random.choice(product_templates)
            
            # Generate unique product name
            product_name = f"{template['base_name']} {random.randint(100, 9999)}"
            
            # Random price between $10 and $500
            price = Decimal(str(round(random.uniform(10.0, 500.0), 2)))
            
            # Random stock quantity between 1 and 100
            inventory = random.randint(1, 100)
            
            # Random category
            category = random.choice(categories)
            
            # Random boolean flags
            is_draft = random.choice([True, False])
            on_sale = random.choice([True, False])
            is_new = random.choice([True, False])
            trending = random.choice([True, False])
            
            # Sale percentage if on sale
            sale_percentage = 0
            sale_start_date = None
            sale_end_date = None
            
            if on_sale:
                sale_percentage = Decimal(str(random.randint(5, 50)))
                sale_start_date = timezone.now() - timedelta(days=random.randint(1, 30))
                sale_end_date = sale_start_date + timedelta(days=random.randint(7, 60))
            
            # Random rating between 1 and 5
            rating = random.randint(1, 5)
            
            product = Product(
                name=product_name,
                price=price,
                details=template['details'],
                category=category,
                is_draft=is_draft,
                inventory=inventory,
                on_sale=on_sale,
                is_new=is_new,
                trending=trending,
                sale_percentage=sale_percentage,
                sale_start_date=sale_start_date,
                sale_end_date=sale_end_date,
                rating=rating,
                photo='placeholder_product_image.jpg'  # Placeholder image
            )
            
            # Save without triggering the problematic check_sale_status
            product.save()
            
            products.append(product)
            self.stdout.write(self.style.SUCCESS(f'Created product: {product.name}'))

        return products

    def create_product_images(self, products, images_per_product):
        """Generate product images with placeholder URLs"""
        image_urls = [
            'https://www.iaei.org/global_graphics/default-store-350x350.jpg',
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrn_80I-lMAa0pVBNmFmQ7VI6l4rr74JW-eQ&s',
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrn_80I-lMAa0pVBNmFmQ7VI6l4rr74JW-eQ&s',
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrn_80I-lMAa0pVBNmFmQ7VI6l4rr74JW-eQ&s',
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrn_80I-lMAa0pVBNmFmQ7VI6l4rr74JW-eQ&s',
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQ7Qxrt-N84w5LdE2FqICCxzkQ-z3O8L84jw&s',
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQ7Qxrt-N84w5LdE2FqICCxzkQ-z3O8L84jw&s',
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQ7Qxrt-N84w5LdE2FqICCxzkQ-z3O8L84jw&s',
        ]

        for product in products:
            for i in range(images_per_product):
                # Use placeholder URLs for CloudinaryField
                image_url = random.choice(image_urls)
                
                ProductImage.objects.create(
                    product=product,
                    image=image_url,
                    is_primary=(i == 0),  # First image is primary
                    alt_text=f"{product.name} - Image {i + 1}",
                    order=i + 1
                )
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Created image {i + 1} for product: {product.name}'
                    )
                )