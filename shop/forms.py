from django import forms
from django.forms import inlineformset_factory
from django.forms.widgets import ClearableFileInput
from .models import Product, ProductImage

# Create a formset for managing multiple product images
ProductImageFormSet = inlineformset_factory(
    Product,
    ProductImage,
    fields=['image', 'is_primary', 'alt_text', 'order'],
    extra=3,  # Number of empty forms to display
    can_delete=True,
    max_num=10,  # Maximum number of forms/images
    widgets={
        'image': forms.FileInput(attrs={
            'class': 'form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm',
            'accept': 'image/*',
        }),
        'is_primary': forms.CheckboxInput(attrs={
            'class': 'h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500',
        }),
        'alt_text': forms.TextInput(attrs={
            'class': 'form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm',
            'placeholder': 'Image description for accessibility',
        }),
        'order': forms.NumberInput(attrs={
            'class': 'form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm',
            'min': '1',
        }),
    }
)

class MultipleFileInput(ClearableFileInput):
    """Custom widget that extends ClearableFileInput to properly handle multiple file uploads"""
    allow_multiple_selected = True
    
    def __init__(self, attrs=None):
        if attrs is None:
            attrs = {}
        attrs['multiple'] = 'multiple'
        super().__init__(attrs)
    
    def value_from_datadict(self, data, files, name):
        """Get a list of files instead of a single file"""
        if files and name in files:
            return files.getlist(name)
        return super().value_from_datadict(data, files, name)
        
    def use_required_attribute(self, initial):
        return False
        
    def get_context(self, name, value, attrs):
        context = super().get_context(name, value, attrs)
        context['widget']['attrs']['multiple'] = 'multiple'
        return context

class MultipleImageUploadForm(forms.Form):
    """Form for uploading multiple images at once"""
    images = forms.FileField(
        widget=MultipleFileInput(attrs={
            'class': 'form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm',
            'accept': 'image/*',
        }),
        help_text='Select multiple images to upload (hold Ctrl/Cmd to select multiple files)'
    )
    
    def clean_images(self):
        images = self.cleaned_data.get('images')
        if images:
            for image in images:
                # Validate file type
                if not image.content_type.startswith('image'):
                    raise forms.ValidationError('File type not supported. Please upload images only.')
                # Validate file size (limit to 5MB)
                if image.size > 5 * 1024 * 1024:  # 5MB in bytes
                    raise forms.ValidationError('Image file too large. Size should not exceed 5MB.')
        return images