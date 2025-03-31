from decimal import Decimal
from django.conf import settings
from shop.models import Product

class SessionCart:
    def __init__(self, request):
        self.session = request.session
        cart = self.session.get(settings.CART_SESSION_ID)
        if not cart:
            cart = self.session[settings.CART_SESSION_ID] = {}
        self.cart = cart

    def add(self, product, quantity=1):
        product_id = str(product.id)
        
        # For guest users, check if cart already contains a different product
        # Automatically clear the cart and add the new product
        if len(self.cart) > 0 and product_id not in self.cart:
            # Clear the cart first
            self.cart.clear()
            
        if product_id not in self.cart:
            # Use sale_price if product is on sale, otherwise use regular price
            price = product.sale_price if product.on_sale else product.price
            self.cart[product_id] = {
                'quantity': 0,
                'price': str(price),
                'selected': False  # Set selected to False by default so user must explicitly select items
            }
        
        # Calculate total quantity (existing + new)
        total_quantity = self.cart[product_id]['quantity'] + quantity
        
        # Check if total quantity exceeds inventory
        if total_quantity > product.inventory:
            total_quantity = product.inventory  # Limit total quantity to available inventory
            
        # Set the new quantity
        self.cart[product_id]['quantity'] = total_quantity
        self.save()
        return {'needs_confirmation': False}

    def save(self):
        self.session.modified = True

    def remove(self, product):
        product_id = str(product.id)
        if product_id in self.cart:
            del self.cart[product_id]
            self.save()

    def clear(self):
        del self.session[settings.CART_SESSION_ID]
        self.save()

    def update(self, product, quantity):
        product_id = str(product.id)
        if product_id in self.cart:
            self.cart[product_id]['quantity'] = quantity
            self.save()

    def get_total_price(self):
        total = Decimal('0.00')
        for item in self.cart.values():
            # Only include items that are explicitly selected
            # Handle case where selected might be stored as a string
            selected = item.get('selected', False)
            if isinstance(selected, str):
                selected = selected.lower() == 'true'
            
            if selected:
                # Ensure price is always a Decimal object
                price = item['price'] if isinstance(item['price'], Decimal) else Decimal(str(item['price']))
                # Convert quantity to Decimal
                quantity = Decimal(str(item['quantity']))
                total += price * quantity
        return total.quantize(Decimal('0.01'))

    def get_total_items(self):
        return sum(item['quantity'] for item in self.cart.values())

    def __iter__(self):
        product_ids = self.cart.keys()
        products = Product.objects.filter(id__in=product_ids)
        cart = self.cart.copy()

        for product in products:
            cart[str(product.id)]['product'] = product

        for item in cart.values():
            # Ensure price is always a Decimal object
            if not isinstance(item['price'], Decimal):
                item['price'] = Decimal(str(item['price']))
            item['total_price'] = item['price'] * item['quantity']
            
            # Ensure selected status is always a boolean value
            # Convert to boolean if it's a string representation
            if 'selected' in item:
                if isinstance(item['selected'], str):
                    item['selected'] = item['selected'].lower() == 'true'
                # Ensure it's a proper boolean even if it's another type
                item['selected'] = bool(item['selected'])
            else:
                item['selected'] = False
                
            yield item

    def __len__(self):
        return sum(item['quantity'] for item in self.cart.values())
        
    def update_selection(self, product_id, selected):
        product_id = str(product_id)
        if product_id in self.cart:
            # Ensure selected is always stored as a boolean value
            if isinstance(selected, str):
                selected = selected.lower() == 'true'
            self.cart[product_id]['selected'] = bool(selected)
            self.save()