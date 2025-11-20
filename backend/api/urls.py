import os # Need to add this import if it's not present for the upload path logic
from django.urls import path
from .views import query_view, list_areas_view, upload_dataset_view

urlpatterns = [
    path('query/', query_view, name='api-query'),
    path('areas/', list_areas_view, name='api-areas'),  # optional helper endpoint
    path('upload/', upload_dataset_view, name='api-upload'), # NEW FILE UPLOAD ENDPOINT
]