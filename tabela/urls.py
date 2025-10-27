from django.urls import path
from . import views

urlpatterns = [
    path("", views.index),
    path("trazer_entradas", views.trazer_entradas),
    path("trazer_inicial", views.trazer_inicial),
    path("trazer_inicial_GGF", views.trazer_inicial_GGF),
    path("trazer_devolucoes", views.trazer_devolucoes),
    path("trazer_CPI", views.trazer_CPI),
    path("trazer_CPV", views.trazer_CPV),
    path("trazer_final", views.trazer_final),
    path("trazer_requisicoes", views.trazer_requisicoes),
    path("trazer_ajustes", views.trazer_ajustes),
]
