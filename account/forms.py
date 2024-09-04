from typing import Any
from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User

class UserRegForm(UserCreationForm):
    class Meta:
        model = User
        fields = ['email', 'username', 'first_name']

        widgets = {
            'email': forms.EmailInput(attrs={'class': 'form-control', 'required': True}),
            'username': forms.TextInput(attrs={'class': 'form-control'}),
            'first_name': forms.TextInput(attrs={'class': 'form-control', 'required': True}),
        }

    # def clean_first_name(self):
    #     data = self.cleaned_data.get("first_name")
    #     if len(data) < 5:
    #         raise forms.ValidationError("First name must be greater than 5 characters.")
    #     return data
    
    def clean(self):
        clean_data = super().clean()
        firstName = self.cleaned_data.get("first_name")
        username = self.cleaned_data.get("username")
        errors = []
        
        if len(firstName) < 5:
            errors.append('First name must be greater than 5 characters.')
            
        if any (char.isdigit() for char in firstName):
            errors.append('First name should not contain numeric values.')

        if len(username) < 5:
            errors.append('User name must be greater than 5 characters.')
            
        if any(char in '!@#$%^&*()+-=[]{}|;:,.<>?/`~' for char in username):
            errors.append('User name only contain characters, numbers or underscore( _ ).')
        if  any(char.isupper() for char in username):
            errors.append('User name should not contain uppercase letters.')
        if not any(char.isdigit() for char in username):
            errors.append('User name must contain at least one numeric value or underscore( _ ).')
            
        if errors:
            raise forms.ValidationError(errors)
