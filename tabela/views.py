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
# from .utils.funcs import get_engine,enviar_email


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
        tabela = "SB2"
        col_qtd = "Qfim"
    else:
        query = text(query_iniciais_SB9())
        consulta = pd.read_sql(query, engine, params={"periodo":periodo})
        tabela = "SB9"
        col_qtd = "Qini"

    if consulta.empty:
        return Response({"sucesso":True,"vazio":True})

    ##################################
    # VERIFICA QUANTIDADE ZERADA
    qtd_zero = consulta.loc[consulta[col_qtd] == 0]
    info = None
    if not qtd_zero.empty:
        consulta = consulta.loc[consulta["Qfim"] != 0]
        info = f"""Existem produtos com a quantidade zerada e o valor positivo no período {periodo}.
A função que gerou esta mensagem é trazer_final. A tabela que foi consultada é a {tabela}.
"""
#         enviar_email(
#             "ricky.moraes.cd@astemo.com;bruno.martini.gh@astemo.com",
#             "Quantidade zerada com valor dif zero",
#             f"""
# {info}
# {str(qtd_zero["Item"].to_list())}
# """
#         )

    ###################################

    ###################################
    # VERIFICA PRODUTOS NÃO 'PA' NO ARMAZEM 20

    nao_PA_no_20 = consulta.loc[((consulta["Tipo"] != "PA") & (consulta["Armz"] == "20"))]
    if not nao_PA_no_20.empty:
        texto_nao_PA = f"""
Existem itens que não são PA no armazém 20. Os itens são {nao_PA_no_20["Item"].to_list()}.
Da tabela {tabela}. Período {periodo}.
"""
        if not info:
            info = texto_nao_PA
        else:
            if isinstance(info,str):
                info = [info, texto_nao_PA]
            elif isinstance(info,list):
                list(info).append(texto_nao_PA)

    ###################################

    consulta["periodo"] = periodo
    consulta = consulta.to_dict("records")

    response = {"sucesso": True,"final":consulta}
    if info:
        response["info"] = info

    return Response(response)




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
