def query_entradas_itens():
    return """
    SELECT
        cast(D1_DTDIGIT as date)  [Data],
        TRIM(D1_DOC) Documento,
        TRIM(D1_COD) Item,
        TRIM(B1_DESC) Descricao,
        TRIM(B1_TIPO) Tipo,
        D1_LOCAL Armz,
        D1_QUANT Quantidade,
        D1_TOTAL Total,
        SUM(D1_CP0101 + D1_CP0201 + D1_CP0301
            + D1_CP0401 + D1_CP0501 + D1_CP0601
            + D1_CP0701 + D1_CP0801 + D1_CP0901
        ) AS Custo,
        D1_TES Tes,
        F4_TEXTO Texto
    FROM SD1010 SD1 WITH (NOLOCK)
    INNER JOIN SB1010 SB1 WITH (NOLOCK)
        ON SB1.B1_COD = SD1.D1_COD AND SB1.D_E_L_E_T_ = ''
    INNER JOIN SF4010 SF4 WITH (NOLOCK)
        ON SF4.F4_CODIGO = D1_TES
        AND SF4.D_E_L_E_T_=''
        AND D1_FILIAL=F4_FILIAL
    WHERE
        SUBSTRING(D1_DTDIGIT, 1, 6) = :periodo
        AND SD1.D_E_L_E_T_ = ''
        AND D1_LOCAL BETWEEN '01' AND '50'
        --AND D1_CP0101 + D1_CP0201 + D1_CP0301 <> 0
        AND B1_TIPO IN ('AL','MP','MI')
    GROUP BY B1_TIPO, SUBSTRING(D1_DTDIGIT, 1, 6),
        D1_DOC,D1_COD,B1_DESC,D1_QUANT,D1_TOTAL,
        D1_DTDIGIT,
        D1_TES,
        D1_LOCAL,
        F4_TEXTO
"""


def query_iniciais_SB9():
    return """
SELECT
    CAST(B9_DATA AS DATE) Data,
    TRIM(B9_LOCAL) Armz,
    TRIM(B9.B9_COD) Item,
    TRIM(B1.B1_DESC) Descricao,
    B1.B1_TIPO AS Tipo,
    B9.B9_QINI AS Qini,
    ISNULL(B9.B9_CP0101,0) + ISNULL(B9.B9_CP0201,0) + ISNULL(B9.B9_CP0301,0) Valor,
    --B9.B9_VINI1 - (B9.B9_CP0401 + B9.B9_CP0501 + B9.B9_CP0601 + B9.B9_CP0701 + B9.B9_CP0801 + B9.B9_CP0901) AS Valor,
    B9.B9_CP0401 + B9.B9_CP0501 + B9.B9_CP0601 + B9.B9_CP0701 + B9.B9_CP0801+B9.B9_CP0901 AS ValorGGF

FROM
    SB9010 B9
INNER JOIN
    SB1010 B1 ON B1.B1_COD = B9.B9_COD AND B1.D_E_L_E_T_ = '' AND B1.B1_FILIAL = B9.B9_FILIAL
    AND  B1_TIPO IN ('AL','MP','PI','PA','MI')
WHERE
    LEFT(B9.B9_DATA,6) = :periodo
    AND B9.B9_FILIAL = '01'
    AND B9.B9_LOCAL BETWEEN '01' AND '50'
    AND (B9.B9_CP0101 + B9.B9_CP0201 + B9.B9_CP0301 +
        B9.B9_CP0401 + B9.B9_CP0501 + B9.B9_CP0601 +
        B9.B9_CP0701 + B9.B9_CP0801+B9.B9_CP0901) <> 0
    --AND B9.B9_QINI <> 0
"""


def query_parametro_maior_fechamento():
    return """
SELECT X6_CONTEUD data_fech
FROM SX6010 (NOLOCK) X6
WHERE X6.D_E_L_E_T_ = ''
    AND X6_FIL = '01'
    AND X6_VAR = 'MV_ULMES'
"""


def query_iniciais_SB9_GGF():
    return """
SELECT
    CAST(B9_DATA AS DATE) Data,
    TRIM(B9_LOCAL) Armz,
    TRIM(B9_COD) Item,
    TRIM(B1_DESC) Descricao,
    CASE
        WHEN B1_TIPO = 'PI' THEN 'PI-GGF'
        WHEN B1_TIPO = 'PA' THEN 'PA-GGF'
    END AS Tipo,
    B9_QINI Qini,
    B9.B9_CP0101 + B9.B9_CP0201 + B9.B9_CP0301 Valor,
    B9.B9_CP0401 + B9.B9_CP0501 + B9.B9_CP0601 + B9.B9_CP0701 + B9.B9_CP0801+B9.B9_CP0901 AS ValorGGF


FROM  SB9010 B9
INNER JOIN
    SB1010 B1 ON B1.B1_COD = B9.B9_COD AND B1.D_E_L_E_T_ = '' AND B1.B1_FILIAL = B9.B9_FILIAL
    AND  B1_TIPO IN ('PA','PI')
WHERE
    LEFT(B9.B9_DATA,6) = :periodo
    AND B9.B9_FILIAL = '01'
    AND B9.B9_LOCAL BETWEEN '01' AND '50'
    AND (B9.B9_CP0101 + B9.B9_CP0201 + B9.B9_CP0301 +
        B9.B9_CP0401 + B9.B9_CP0501 + B9.B9_CP0601 +
        B9.B9_CP0701 + B9.B9_CP0801+B9.B9_CP0901) <> 0
    --AND B9.B9_QINI <> 0

"""


def query_devolucoes_itens():
    return """
SELECT
    cast(D2_EMISSAO as date)  [Data],
    D2_DOC Documento,
    D2_COD Item,
    D2_LOCAL Armz,
    TRIM(D2_CF) CFOP,
    -D2_QUANT Quantidade,
    D2_TOTAL Total,
    D2_TES Tes,
    F4_TEXTO Texto,
    SB1.B1_TIPO AS Tipo,
    -CASE B1_TIPO
        WHEN 'PI' THEN D2_CP0101 + D2_CP0201 + D2_CP0301
        WHEN 'PA' THEN D2_CP0101 + D2_CP0201 + D2_CP0301
        ELSE isnull(D2_CP0101,0) + isnull(D2_CP0201,0) + isnull(D2_CP0301,0)
    END AS Custo

    FROM SD2010 SD2 WITH (NOLOCK)
    INNER JOIN SB1010 SB1 WITH (NOLOCK) ON B1_COD = D2_COD AND SB1.D_E_L_E_T_ = ''
    INNER JOIN SF4010 SF4 WITH (NOLOCK) ON D2_TES = F4_CODIGO AND F4_FILIAL=D2_FILIAL
        AND SF4.D_E_L_E_T_='' AND F4_ESTOQUE='S'
    WHERE
        LEFT(D2_EMISSAO, 6) = :periodo
        AND SD2.D_E_L_E_T_ = ''
        AND D2_LOCAL BETWEEN '01' AND '50'
        AND RIGHT(TRIM(D2_CF),3) IN ('201','949')
        AND B1_TIPO IN ('AL','MP','MI')
"""


def query_CPI():
    return """
DECLARE @PER VARCHAR(6) = :periodo ;

WITH PRODUCAO AS (
    SELECT
        D3.D3_COD,
        SUM(D3_QUANT) D3_QUANT,
        SUM(D3_CP0101 + D3_CP0201 + D3_CP0301) CUSTO,
        SUM(
            D3_CP0401 + D3_CP0501 + D3_CP0601 +
            D3_CP0701 + D3_CP0801 + D3_CP0901
        ) CUSTOGGF
    FROM SD3010 (NOLOCK) D3
    WHERE D3.D_E_L_E_T_ = ''
        AND D3.D3_ESTORNO <> 'S'
        AND D3.D3_FILIAL = '01'
        AND LEFT(D3.D3_EMISSAO,6) = @PER
        AND D3.D3_OP <> ''
        AND D3.D3_CF = 'PR0'
    GROUP BY D3.D3_COD
),
CONSUMO AS (
    SELECT
        D3_COD,
        SUM(D3_QUANT) D3_QUANT,
        SUM( D3_CP0101 + D3_CP0201 + D3_CP0301 ) CUSTO,
        SUM(
            D3_CP0401 + D3_CP0501 + D3_CP0601 +
            D3_CP0701 + D3_CP0801 + D3_CP0901
        ) CUSTOGGF
    FROM SD3010 (NOLOCK) D3B
    WHERE D3B.D_E_L_E_T_ = ''
        AND D3B.D3_ESTORNO <> 'S'
        AND LEFT(D3B.D3_EMISSAO,6) = @PER
        AND D3B.D3_FILIAL = '01'
        AND (
            (D3B.D3_OP <> '' AND D3B.D3_TM = '999') OR
            (LEFT(D3B.D3_DOC,3) = 'DMI')
        )
        AND D3_TIPO IN ('PI','PA')
    GROUP BY D3_COD
),
SOMATORIA AS (
    SELECT
        ISNULL(P.D3_COD,C.D3_COD) Item,
        ISNULL(P.D3_QUANT,0) - ISNULL(C.D3_QUANT,0) Quantidade,
        ISNULL(P.CUSTO, 0) - ISNULL(C.CUSTO, 0) Custo,
        ISNULL(P.CUSTOGGF, 0) - ISNULL(C.CUSTOGGF, 0) CustoGGF
    FROM PRODUCAO P
    FULL OUTER JOIN CONSUMO C
        ON P.D3_COD = C.D3_COD
)
SELECT
    TRIM(Item) Item,
    TRIM(B1_DESC) Descricao,
    TRIM(B1_TIPO) Tipo,
    Quantidade,
    Custo,
    CustoGGF
FROM SOMATORIA
INNER JOIN SB1010 (NOLOCK) B1
    ON B1.D_E_L_E_T_ = ''
    AND B1_COD = Item
"""


def query_CPV():
    return """
SELECT
    CAST(D2_EMISSAO AS DATE) Data,
    TRIM(D2_DOC) Doc,
    TRIM(A1_NOME) Cliente,
    TRIM(D2_COD) Item,
    TRIM(B1_DESC) Descricao,
    SB1.B1_TIPO AS Tipo,
    -(ISNULL(D2_CP0101,0) + ISNULL(D2_CP0201,0) + ISNULL(D2_CP0301,0)) Custo,
    -( ISNULL(D2_CP0401,0) + ISNULL(D2_CP0501,0) + ISNULL(D2_CP0601,0) +
    ISNULL(D2_CP0701,0) + ISNULL(D2_CP0801,0) + ISNULL(D2_CP0901,0) ) CustoGGF

FROM SD2010 SD2 WITH (NOLOCK)
INNER JOIN SB1010 SB1 WITH (NOLOCK)
    ON B1_COD = D2_COD
    AND SB1.D_E_L_E_T_ = ''
    AND B1_FILIAL=D2_FILIAL
INNER JOIN SA1010 (NOLOCK) A1
    ON A1.D_E_L_E_T_ = ''
    AND A1_COD = D2_CLIENTE
    AND A1_LOJA = D2_LOJA
WHERE
    SD2.D_E_L_E_T_ = ''
    AND D2_FILIAL = '01'
    AND LEFT(D2_EMISSAO, 6) = :periodo
    AND D2_LOCAL BETWEEN '01' AND '50'
    AND D2_CUSTO1 > 0
    AND RIGHT(TRIM(D2_CF),3) <> '201' -- DEVOLUÇÕES
"""




def query_final_SB2():
    return """
SELECT
    CAST(GETDATE() AS DATE) Data,
    TRIM(B2_LOCAL) Armz,
    TRIM(B2.B2_COD) Item,
    TRIM(B1.B1_DESC) Descricao,
    B1.B1_TIPO AS Tipo,
    B2_QFIM AS Qfim,
    ISNULL(B2_CPF0101,0) + ISNULL(B2_CPF0201,0) + ISNULL(B2_CPF0301,0) AS Valor,
    --B2_VFIM1 - (ISNULL(B2_CPF0401,0) + ISNULL(B2_CPF0501,0) + ISNULL(B2_CPF0601,0) +
    --    ISNULL(B2_CPF0701,0) + ISNULL(B2_CPF0801,0) + ISNULL(B2_CPF0901,0)) AS Valor,
    ISNULL(B2_CPF0401,0) + ISNULL(B2_CPF0501,0) + ISNULL(B2_CPF0601,0) +
        ISNULL(B2_CPF0701,0) + ISNULL(B2_CPF0801,0) + ISNULL(B2_CPF0901,0) AS ValorGGF

FROM
    SB2010 B2
INNER JOIN
    SB1010 B1 ON B1.B1_COD = B2_COD AND B1.D_E_L_E_T_ = '' AND B1.B1_FILIAL = B2_FILIAL
    AND  B1_TIPO IN ('AL','MP','PI','PA','MI')
WHERE
    B2.D_E_L_E_T_ = ''
    AND B2_FILIAL = '01'
    AND B2_LOCAL BETWEEN '01' AND '50'
    AND ROUND((
        ISNULL(B2_CPF0101,0) + ISNULL(B2_CPF0201,0) + ISNULL(B2_CPF0301,0) +
        ISNULL(B2_CPF0401,0) + ISNULL(B2_CPF0501,0) + ISNULL(B2_CPF0601,0) +
        ISNULL(B2_CPF0701,0) + ISNULL(B2_CPF0801,0) + ISNULL(B2_CPF0901,0)
    ),0) <> 0
"""




def query_requisicoes():
    return """
SELECT TRIM(D3_COD) Item,
    TRIM(B1_DESC) Descricao,
    TRIM(B1_TIPO) Tipo,
    TRIM(D3_LOCAL) Armz,
    TRIM(
        CASE
            WHEN LEFT(D3_DOC,3) = 'DMI' THEN 'DMI'
            WHEN D3_DOC = 'INVENT' THEN 'INVENT'
            WHEN UPPER(LEFT(D3_DOC,1)) = 'X' THEN 'X'
            WHEN UPPER(LEFT(D3_DOC,2)) = 'AP' THEN 'AP'
            WHEN UPPER(LEFT(D3_DOC,2)) = 'CQ' THEN 'CQ'
            ELSE D3_DOC
        END
    ) Documento,
    SUM(
        CASE
            WHEN D3_TM > 500 THEN -D3_QUANT
            WHEN D3_TM < 500 THEN D3_QUANT
            ELSE 'ERRO'
        END
    ) Quantidade,
    SUM(CASE
        WHEN D3_TM > 500 THEN
            -(ISNULL(D3_CP0101,0) + ISNULL(D3_CP0201,0) + ISNULL(D3_CP0301,0))
        WHEN D3_TM < 500 THEN
            ISNULL(D3_CP0101,0) + ISNULL(D3_CP0201,0) + ISNULL(D3_CP0301,0)
    END) Valor,
    SUM(CASE
        WHEN B1_TIPO = 'PI' AND D3_TM > 500 THEN
            -(ISNULL(D3_CP0401,0) + ISNULL(D3_CP0501,0) + ISNULL(D3_CP0601,0) +
            ISNULL(D3_CP0701,0) + ISNULL(D3_CP0801,0) + ISNULL(D3_CP0901,0))
        WHEN B1_TIPO = 'PI' AND D3_TM < 500 THEN
            (ISNULL(D3_CP0401,0) + ISNULL(D3_CP0501,0) + ISNULL(D3_CP0601,0) +
            ISNULL(D3_CP0701,0) + ISNULL(D3_CP0801,0) + ISNULL(D3_CP0901,0))
        ELSE 0
    END) ValorGGF
FROM SD3010 (NOLOCK) D3
INNER JOIN SB1010 (NOLOCK) B1
    ON B1.D_E_L_E_T_ = ''
    AND D3_FILIAL = B1_FILIAL
    AND D3_COD = B1_COD
WHERE D3.D_E_L_E_T_ = ''
    AND D3_ESTORNO <> 'S'
    AND LEFT(D3_EMISSAO,6) = :periodo
    AND (D3_CF NOT IN ('RE3','DE3','RE0','DE0')
        OR (
            D3_CF IN ('RE0','DE0') AND (
                LEFT(D3_DOC,3) = 'DMI' OR (D3_DOC = 'INVENT' AND D3_LOCAL = '14')
            )
        )
    )
    AND (
        B1_TIPO IN ('AL','MP','MI')
        OR (B1_TIPO = 'PI' AND D3_DOC = 'INVENT')
    )
    AND D3_LOCAL BETWEEN '01' AND '50'
GROUP BY D3_COD, B1_DESC, B1_TIPO, D3_LOCAL,
    CASE
        WHEN LEFT(D3_DOC,3) = 'DMI' THEN 'DMI'
        WHEN D3_DOC = 'INVENT' THEN 'INVENT'
        WHEN UPPER(LEFT(D3_DOC,1)) = 'X' THEN 'X'
        WHEN UPPER(LEFT(D3_DOC,2)) = 'AP' THEN 'AP'
        WHEN UPPER(LEFT(D3_DOC,2)) = 'CQ' THEN 'CQ'
        ELSE D3_DOC
    END
"""


def query_ajustes():
    return """
SELECT TRIM(D3_COD) Item,
    TRIM(B1_DESC) Descricao,
    TRIM(B1_TIPO) Tipo,
    TRIM(D3_TM) TM,
    TRIM(D3_CF) CF,
    TRIM(D3_DOC) Documento,
    SUM(
        CASE
            WHEN D3_TM > 500 THEN -D3_QUANT
            WHEN D3_TM < 500 THEN D3_QUANT
            ELSE 'ERRO'
        END
    ) Quantidade,
    SUM(CASE
        WHEN D3_TM > 500 THEN
            -(ISNULL(D3_CP0101,0) + ISNULL(D3_CP0201,0) + ISNULL(D3_CP0301,0))
        WHEN D3_TM < 500 THEN
            ISNULL(D3_CP0101,0) + ISNULL(D3_CP0201,0) + ISNULL(D3_CP0301,0)
    END) Valor,
    SUM(
        CASE
            WHEN D3_TM > 500 THEN -(
                    ISNULL(D3_CP0401,0) + ISNULL(D3_CP0501,0) + ISNULL(D3_CP0601,0) +
                    ISNULL(D3_CP0701,0) + ISNULL(D3_CP0801,0) + ISNULL(D3_CP0901,0)
                )
            WHEN D3_TM < 500 THEN (
                    ISNULL(D3_CP0401,0) + ISNULL(D3_CP0501,0) + ISNULL(D3_CP0601,0) +
                    ISNULL(D3_CP0701,0) + ISNULL(D3_CP0801,0) + ISNULL(D3_CP0901,0)
                )
        END
    ) ValorGGF
FROM SD3010 (NOLOCK) D3
INNER JOIN SB1010 (NOLOCK) B1
    ON B1.D_E_L_E_T_ = ''
    AND D3_FILIAL = B1_FILIAL
    AND D3_COD = B1_COD
WHERE D3.D_E_L_E_T_ = ''
    AND D3_ESTORNO <> 'S'
    AND LEFT(D3_EMISSAO,6) = :periodo
    AND D3_CF IN ('RE0','DE0')
    AND B1_TIPO IN ('AL','MP','MI','PI','PA')
    AND D3_LOCAL BETWEEN '01' AND '50'
    AND LEFT(D3_DOC,3) <> 'DMI'
    AND NOT (D3_DOC = 'INVENT' AND D3_LOCAL = '14')
GROUP BY D3_DOC, B1_DESC, B1_TIPO, D3_COD, D3_TM, D3_CF
"""
