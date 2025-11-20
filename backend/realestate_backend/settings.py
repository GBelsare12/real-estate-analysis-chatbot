import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env if present
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'dev-secret-key')
DEBUG = os.getenv('DEBUG', 'True').lower() in ('1', 'true', 'yes')

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # New: Add CSP (required for react-chartjs-2)
    'csp',

    # Third party
    'rest_framework',
    'corsheaders',

    # Local
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    # New: Add CSP Middleware right after Security/Cors
    'csp.middleware.CSPMiddleware', 
    'whitenoise.middleware.WhiteNoiseMiddleware',  # for serving static files in production
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'realestate_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {'context_processors': [
            'django.template.context_processors.debug',
            'django.template.context_processors.request',
            'django.contrib.auth.context_processors.auth',
            'django.contrib.messages.context_processors.messages',
        ]},
    },
]

WSGI_APPLICATION = 'realestate_backend.wsgi.application'
ASGI_APPLICATION = 'realestate_backend.asgi.application'

# DB - use sqlite for dev
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation (defaults)
AUTH_PASSWORD_VALIDATORS = []

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = []

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS - allow frontend during development
CORS_ALLOW_ALL_ORIGINS = True

# REST Framework (basic)
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

# OpenAI key (optional)
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')

# --- Content Security Policy (CSP) Configuration ---
# Fixes the white screen/unsafe-eval error caused by Chart.js.
CONTENT_SECURITY_POLICY = {
    'DIRECTIVES': {
        # Allows Chart.js to work in development
        'script-src': ("'self'", "'unsafe-eval'", "http://127.0.0.1:8000"),
        
        # Allows API calls and potential WebSocket connections
        'connect-src': ("'self'", "http://127.0.0.1:8000", "ws://127.0.0.1:8000"),
        
        # Default policy
        'default-src': ("'self'",),
        
        # Allows data: URIs for chart image download
        'img-src': ("'self'", "data:"),
    }
}