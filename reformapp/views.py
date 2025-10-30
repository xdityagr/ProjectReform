from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view


@api_view(['GET'])
def some_data(request):
    return Response({"message": "Hello from django"})
    
def index(request):

    return render(request,'reformapp/index.html')

