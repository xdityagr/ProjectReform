from django.urls import path
from . import views

urlpatterns = [
    path('',views.index,name = "index"),
    path('api/somedata',views.some_data,name="api")
]