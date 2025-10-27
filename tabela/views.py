from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response

import re
from sqlalchemy import text
import pandas as pd

from .queries import (
    query_entradas_itens, query_iniciais_SB9, query_parametro_maior_fechamento,
    query_iniciais_SB9_GGF, query_devolucoes_itens, query_CPI, query_CPV, query_final_SB2,
    query_requisicoes, query_ajustes
)
from .utils.funcs import get_engine


def index(request):
    return render(request, "tabela/index.html")




@api_view(["POST"])
def trazer_entradas(request):
    periodo = request.data.get("periodo")

    if not periodo or not re.match(r"^20\d{2}-[01]\d$",periodo):
        return Response({"erro":f"Período {periodo} é inválido"})

    engine = get_engine()
    periodo = str(periodo).replace("-","")

    query = text(query_entradas_itens())
    consulta = pd.read_sql(query, engine, params={"periodo":periodo})

    if consulta.empty:
        return Response({"sucesso":True,"vazio":True})
    consulta["periodo"] = periodo
    consulta = consulta.to_dict("records")

    return Response({"sucesso": True,"entradas":consulta})




@api_view(["POST"])
def trazer_inicial(request):
    periodo = request.data.get("periodo")

    if not periodo or not re.match(r"^20\d{2}-[01]\d$",periodo):
        return Response({"erro":f"Período {periodo} é inválido"})

    engine = get_engine()
    periodo = str(periodo).replace("-","")

    query = text(query_iniciais_SB9())
    consulta = pd.read_sql(query, engine, params={"periodo":periodo})

    if consulta.empty:
        return Response({"sucesso":True,"vazio":True})
    consulta["periodo"] = periodo
    consulta = consulta.to_dict("records")

    return Response({"sucesso": True,"iniciais":consulta})




@api_view(["POST"])
def trazer_inicial_GGF(request):
    periodo = request.data.get("periodo")

    if not periodo or not re.match(r"^20\d{2}-[01]\d$",periodo):
        return Response({"erro":f"Período {periodo} é inválido"})

    engine = get_engine()
    periodo = str(periodo).replace("-","")

    query = text(query_iniciais_SB9_GGF())
    consulta = pd.read_sql(query, engine, params={"periodo":periodo})

    if consulta.empty:
        return Response({"sucesso":True,"vazio":True})
    consulta["periodo"] = periodo
    consulta = consulta.to_dict("records")

    return Response({"sucesso": True,"iniciais_GGF":consulta})




@api_view(["POST"])
def trazer_devolucoes(request):
    periodo = request.data.get("periodo")

    if not periodo or not re.match(r"^20\d{2}-[01]\d$",periodo):
        return Response({"erro":f"Período {periodo} é inválido"})

    engine = get_engine()
    periodo = str(periodo).replace("-","")

    query = text(query_devolucoes_itens())
    consulta = pd.read_sql(query, engine, params={"periodo":periodo})

    if consulta.empty:
        return Response({"sucesso":True,"vazio":True})
    consulta["periodo"] = periodo
    consulta = consulta.to_dict("records")

    return Response({"sucesso": True,"devolucoes":consulta})




@api_view(["POST"])
def trazer_CPI(request):
    periodo = request.data.get("periodo")

    if not periodo or not re.match(r"^20\d{2}-[01]\d$",periodo):
        return Response({"erro":f"Período {periodo} é inválido"})

    engine = get_engine()
    periodo = str(periodo).replace("-","")

    query = text(query_CPI())
    consulta = pd.read_sql(query, engine, params={"periodo":periodo})

    if consulta.empty:
        return Response({"sucesso":True,"vazio":True})
    consulta["periodo"] = periodo
    consulta = consulta.to_dict("records")

    return Response({"sucesso": True,"CPI":consulta})




@api_view(["POST"])
def trazer_CPV(request):
    periodo = request.data.get("periodo")

    if not periodo or not re.match(r"^20\d{2}-[01]\d$",periodo):
        return Response({"erro":f"Período {periodo} é inválido"})

    engine = get_engine()
    periodo = str(periodo).replace("-","")

    query = text(query_CPV())
    consulta = pd.read_sql(query, engine, params={"periodo":periodo})

    if consulta.empty:
        return Response({"sucesso":True,"vazio":True})
    consulta["periodo"] = periodo
    consulta = consulta.to_dict("records")

    return Response({"sucesso": True,"CPV":consulta})




@api_view(["POST"])
def trazer_final(request):
    periodo = request.data.get("periodo")

    if not periodo or not re.match(r"^20\d{2}-[01]\d$",periodo):
        return Response({"erro":f"Período {periodo} é inválido"})

    engine = get_engine()
    periodo = str(periodo).replace("-","")

    query_maior_fechamento = query_parametro_maior_fechamento()

    maior_fech = pd.read_sql(text(query_maior_fechamento), engine)
    if maior_fech.empty:
        return Response({"erro": "Erro ao consultar a última data de fechamento"})
    maior_fech = maior_fech.iloc[0]["data_fech"][:6]
    if periodo > maior_fech:
        query = text(query_final_SB2())
        consulta = pd.read_sql(query, engine)
    else:
        query = text(query_iniciais_SB9())
        consulta = pd.read_sql(query, engine, params={"periodo":periodo})


    if consulta.empty:
        return Response({"sucesso":True,"vazio":True})
    consulta["periodo"] = periodo
    consulta = consulta.to_dict("records")

    return Response({"sucesso": True,"final":consulta})




@api_view(["POST"])
def trazer_requisicoes(request):
    periodo = request.data.get("periodo")

    if not periodo or not re.match(r"^20\d{2}-[01]\d$",periodo):
        return Response({"erro":f"Período {periodo} é inválido"})

    engine = get_engine()
    periodo = str(periodo).replace("-","")

    query = text(query_requisicoes())
    consulta = pd.read_sql(query, engine, params={"periodo":periodo})

    if consulta.empty:
        return Response({"sucesso":True,"vazio":True})
    consulta["periodo"] = periodo
    consulta = consulta.to_dict("records")

    return Response({"sucesso": True,"requisicoes":consulta})




@api_view(["POST"])
def trazer_ajustes(request):
    periodo = request.data.get("periodo")

    if not periodo or not re.match(r"^20\d{2}-[01]\d$",periodo):
        return Response({"erro":f"Período {periodo} é inválido"})

    engine = get_engine()
    periodo = str(periodo).replace("-","")

    query = text(query_ajustes())
    consulta = pd.read_sql(query, engine, params={"periodo":periodo})

    if consulta.empty:
        return Response({"sucesso":True,"vazio":True})
    consulta["periodo"] = periodo
    consulta = consulta.to_dict("records")

    return Response({"sucesso": True,"ajustes":consulta})
