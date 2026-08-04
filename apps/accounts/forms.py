from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import User

class UserRegisterForm(UserCreationForm):
    login = forms.CharField(max_length=100, label="Login / Taxalluz")
    ism = forms.CharField(max_length=100, label="Ism")
    familiya = forms.CharField(max_length=100, required=False, label="Familiya")

    class Meta:
        model = User
        fields = ['login', 'ism', 'familiya', 'email']

class UserLoginForm(AuthenticationForm):
    username = forms.CharField(label="Login / Taxalluz")
    password = forms.CharField(widget=forms.PasswordInput, label="Parol")

class UserProfileForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['ism', 'familiya', 'email', 'avatar_file']
