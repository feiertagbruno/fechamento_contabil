import { Box, Pelicula } from "./classes/Box.js"
import { Mensagem_Temporaria } from "./classes/Mensagem_Temp.js"
import { Tabela } from "./classes/Tabela.js"
import { div, funcao_fetch, getAnoMesAtual, getMesNome, 
  input_element, inserir_tres_pontinhos, label, 
  mesAnterior, style, validacao_dados_do_fetch
} from "./global_functions.js"
import { pegar_versao_iDB, salvar_ou_adicionar_no_indexedDB } from "./indexedDB_funcs.js"

const valid = {}
const funcoes_chamadas = {}
const valores_final = {}
const colunas = [
  "SEQ", "TIPO","INICIAL","ENTRADAS","DEVOLUÇÕES","REQUISIÇÕES","CPI","CPV","AJUSTES","FINAL","DIFERENÇA"
]

// constrói a faixa superior de título, chama com timeout para criar o efeito da tela inicial
setTimeout(() => {

  document.querySelector("#logo").style.opacity = "1"
  const faixa_titulo = document.querySelector(".faixa-titulo")
  faixa_titulo.style.height = "9vh"

  // consrói o formulário do período, timeout para aparecer com transição, opacity 0 para 1
  setTimeout(() => {
    const div_pai = div(faixa_titulo,{},"div-pai",undefined,"afterend","div-pai-id")

    const div_periodo = div(div_pai,{},"div-periodo",undefined,"beforeend","div-periodo-id")

    const label_periodo = label(div_periodo,{},"Período:", "periodo")
    label_periodo.classList.add("label-padrao-1")
    const input_periodo = input_element(div_periodo,{},"input-periodo",undefined,undefined,"month","periodo")
    input_periodo.value = getAnoMesAtual()
    // input_periodo.setAttribute("lang","pt-BR")

    const botao_buscar = document.createElement("button")
    botao_buscar.classList.add("botao-padrao")
    botao_buscar.classList.add("botao-buscar-fechamento")
    botao_buscar.innerText = "Buscar"
    div_pai.insertAdjacentElement("beforeend",botao_buscar)

    setTimeout(() => {
      div_pai.style.opacity = "1"
    },100)

    botao_buscar.addEventListener("click", buscar_fechamento)
    
  }, 750)
  
}, 600)

// FUNÇÃO QUE BUSCA O FECHAMENTO NO CLIQUE DO BOTÃO
async function buscar_fechamento() {
  const periodo = document.querySelector("#periodo")

  // VALIDAÇÕES
  if (!periodo.value) {
    alert("Informe um período válido.")
    return
  }

  if (periodo.value > getAnoMesAtual()) {
    alert("O periodo não pode ser maior do que o período atual.")
    return
  }

  // FUNÇÃO QUE CONSTRÓI A ESTRUTURA DA TABELA
  if (construir_tabela(periodo.value)) {
    
    trazer_inicial(periodo.value)
    trazer_inicial_GGF(periodo.value)
    trazer_entradas(periodo.value)
    trazer_devolucoes(periodo.value)
    trazer_CPI(periodo.value)
    trazer_CPV(periodo.value)
    trazer_final(periodo.value)
    trazer_requisicoes(periodo.value)
    trazer_ajustes(periodo.value)
    
  }

  
}

function construir_tabela(per) {

  // VALIDAÇÕES
  const tabela_ja_existe = document.querySelector(`#table-${per}`)
  if (tabela_ja_existe) return false
  
  const [ano, mes] = (String(per || "").includes("-") ? String(per).split("-") : ["", ""]);
  if (!ano | !mes) return false

  try {

    const div_pai = document.querySelector("#div-pai-id")
    const div_table = div(div_pai,{},"div-table",undefined,"afterend",`table-${per}`,"div-table")

    const div_faixa_sup = div(div_table,{},"faixa-sup")
    const titulo_faixa_sup = div(div_faixa_sup,{},"titulo-faixa-sup","Resumo do Fechamento")
    const per_faixa_sup = div(div_faixa_sup,{},"titulo-faixa-sup", getMesNome(mes) + "/" + String(ano))

    const table = document.createElement("table")
    div_table.append(table)

    const thead = document.createElement("thead")
    table.append(thead)
    
    colunas.map((col) => {
      const th = document.createElement("th")
      th.innerText = col
      thead.append(th)
    })

    const seq_tipo = [
      ["01","AL"],["02","MP"],["03","MI"],
      ["04","PI"],["05","PA"],["","TTL-MP"],
      ["06","PI-GGF"],["07","PA-GGF"],["","TTL-GGF"]
    ]

    const tbody = document.createElement("tbody")
    table.append(tbody)
    
    seq_tipo.map(([seq, tipo]) => {

      const tr = document.createElement("tr")
      tr.setAttribute("name", String(per) + "|" + String(tipo))
      tbody.append(tr)

      colunas.map((col) => {
        const td = document.createElement("td")
        td.setAttribute("name", String(per) + "|" + String(tipo) + "|" + String(col))
        if (tipo.includes("TTL")) {
          style(td,undefined,"linha-de-subtotal")
        }

        tr.append(td)
        td.innerText = "-"
        
      })
    })

    seq_tipo.map(([seq,tipo]) => {
      const seq_el = document.querySelector(`td[name='${per}|${tipo}|SEQ']`)
      seq_el.classList.add("main-col")
      seq_el.innerText = seq
      const tipo_el = document.querySelector(`td[name='${per}|${tipo}|TIPO']`)
      tipo_el.classList.add("main-col")
      tipo_el.innerText = tipo
    })

    div(
      div_table,undefined,["botao-x","hover-color-vermelho"],"X"
    ).addEventListener("click",() => {

      delete valid[per]
      
      delete funcoes_chamadas[per]["trazer_inicial"]
      delete funcoes_chamadas[per]["trazer_entradas"]
      delete funcoes_chamadas[per]["trazer_inicial_GGF"]
      delete funcoes_chamadas[per]["trazer_devolucoes"]
      delete funcoes_chamadas[per]["trazer_CPI"]
      delete funcoes_chamadas[per]["trazer_CPV"]
      delete funcoes_chamadas[per]["trazer_final"]
      delete funcoes_chamadas[per]["trazer_requisicoes"]
      delete funcoes_chamadas[per]["trazer_ajustes"]

      delete valores_final[per]
      
      div_table.remove()

    })

    return true

  } catch (e) {
    console.error(e)
    return false
  }
  
}

async function trazer_inicial(per) {

  try {
    
    const tipos = ["AL","MP","MI","PI","PA"]

    tipos.map((tp) => {
      const td = document.querySelector(`td[name='${per}|${tp}|INICIAL']`)
      inserir_tres_pontinhos(td)
    })
    
    const per_atual = per
    per = mesAnterior(per)
    
    const response = await funcao_fetch("trazer_inicial",{
      periodo:per,
      per_atual:per_atual
    })
    const dados = await response.json()

    validacao_dados_do_fetch(dados,"Erro ao trazer coluna Inicial.")

    if (dados.vazio) {
      new Mensagem_Temporaria("temp_info", "A consulta (Inicial) retornou vazia.")
      return
    }
    console.log(dados.iniciais)
    salvar_ou_adicionar_no_indexedDB(
      "fechamento",pegar_versao_iDB(true),
      dados.iniciais,
      "iniciais",[
        ["per_tipo",["per_atual","Tipo"]]
      ]
    )
    
    tipos.map(async (tp) => {
      const base_tp = dados.iniciais
      
      if (base_tp && base_tp.length > 0) {
        const custo_soma = base_tp.reduce((acc,row) => {
          if (row.Tipo === tp) {
            acc = acc + (row.Valor || 0)
          }
          return acc
        },0)

        // COL DIFERENÇA
        if (!valid[per_atual]){
          valid[per_atual] = {}
        }
        if (!valid[per_atual][tp]){
          valid[per_atual][tp] = 0
        }
        valid[per_atual][tp] += custo_soma
        document.querySelector(`td[name='${per_atual}|${tp}|DIFERENÇA']`).innerText = 
          valid[per_atual][tp].toLocaleString("pt-BR",{style:"currency",currency:"BRL"})

        // LIN TTL
        

        const td = document.querySelector(`td[name='${per_atual}|${tp}|INICIAL']`)

        td.innerText = custo_soma.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

        if (td) {
          
          td.classList.add("hover-background-vermelho")

          td.addEventListener("dblclick", () => abre_detalhe_base(base_tp,per,tp,"Saldos Iniciais"))
          
        }

      }

    })

    const evento = new CustomEvent("fechamento_funcao", {detail: {periodo: per_atual}})
    if (!funcoes_chamadas[per_atual]) funcoes_chamadas[per_atual] = {}
    funcoes_chamadas[per_atual]["trazer_inicial"] = true
    document.dispatchEvent(evento)
    
  } catch (e) {
    new Mensagem_Temporaria("temp_erro",String(e))
    console.error(e)
  }
  
}


function formata_mes_e_ano(per) {
  const [ano, mes] = (String(per || "").includes("-") ? String(per).split("-") : ["", ""]);
  return getMesNome(mes) + "/" + String(ano)
}

async function trazer_entradas(per) {

  try {
    
    const tipos = ["AL","MP","MI"]
    tipos.map((tp) => {
      const td = document.querySelector(`td[name='${per}|${tp}|ENTRADAS']`)
      inserir_tres_pontinhos(td)
    })
    
    const response = await funcao_fetch("trazer_entradas",{
      periodo:per
    })
    const dados = await response.json()

    validacao_dados_do_fetch(dados,"Erro ao trazer entradas.")

    if (dados.vazio) {
      // new Mensagem_Temporaria("temp_info", "A consulta retornou vazia.")
      // return
    }
    
    // if (dados.entradas && dados.entradas.length > 0) {
    //   if (await existe_tabela("fechamento","entradas_itens")) {
    //     dados.entradas.forEach((row) => {
    //       salvar_info_no_indexedDB("fechamento","entradas_itens",row)
    //     })
    //   } else {
    //     salvar_base_no_indexedDB("fechamento",pegar_versao_iDB(true),dados.entradas,"entradas_itens",[
    //       ["periodo_tipo",["periodo","Tipo"]]
    //     ])
    //   }
    // }

    tipos.map(async (tp) => {
      
      let base_tp
      
      if (dados.entradas) {
        base_tp = dados.entradas
        // await buscar_no_indexedDB("fechamento","entradas_itens","periodo_tipo",[[String(per).replace("-",""),tp]])
      }
      const td = document.querySelector(`td[name='${per}|${tp}|ENTRADAS']`)
      
      if (base_tp && base_tp.length > 0) {
        const custo_soma = base_tp.reduce((acc,row) => {
          if (row.Tipo === tp) {
            acc = acc + (row.Custo || 0)
          }
          return acc
        },0)

        // COL DIFERENÇA
        if (!valid[per]){
          valid[per] = {}
        }
        if (!valid[per][tp]){
          valid[per][tp] = 0
        }
        valid[per][tp] += custo_soma
        document.querySelector(`td[name='${per}|${tp}|DIFERENÇA']`).innerText = 
          valid[per][tp].toLocaleString("pt-BR",{style:"currency",currency:"BRL"})


        td.innerText = custo_soma.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

        if (td) {
          
          td.classList.add("hover-background-vermelho")

          td.addEventListener("dblclick", () => abre_detalhe_base(base_tp,per,tp,"Entradas"))
          
        }

      } else {
        td.innerText = 0.0.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      }

    })

    const evento = new CustomEvent("fechamento_funcao", {detail: {periodo: per}})
    if (!funcoes_chamadas[per]) funcoes_chamadas[per] = {}
    funcoes_chamadas[per]["trazer_entradas"] = true
    document.dispatchEvent(evento)
    
  } catch (e) {
    new Mensagem_Temporaria("temp_erro",String(e))
    console.error(e)
  }
  
}

async function trazer_inicial_GGF(per) {

  try {
    
    const tipos = ["PI-GGF","PA-GGF"]

    tipos.map((tp) => {
      const td = document.querySelector(`td[name='${per}|${tp}|INICIAL']`)
      inserir_tres_pontinhos(td)
    })
    
    const per_atual = per
    per = mesAnterior(per)
    
    const response = await funcao_fetch("trazer_inicial_GGF",{
      periodo:per
    })
    const dados = await response.json()

    validacao_dados_do_fetch(dados,"Erro ao trazer coluna Inicial GGF.")

    if (dados.vazio) {
      new Mensagem_Temporaria("temp_info", "A consulta (Inicial GGF) retornou vazia.")
      return
    }
    
    // if (dados.iniciais_GGF && dados.iniciais_GGF.length > 0) {
    //   if (await existe_tabela("fechamento","iniciais_GGF_itens")) {
    //     dados.iniciais_GGF.forEach((row) => {
    //       salvar_info_no_indexedDB("fechamento","iniciais_GGF_itens",row)
    //     })
    //   } else {
    //     salvar_base_no_indexedDB("fechamento",pegar_versao_iDB(true),dados.iniciais_GGF,"iniciais_GGF_itens",[
    //       ["periodo_tipo",["periodo","Tipo"]]
    //     ])
    //   }
    // }

    
    tipos.map(async (tp) => {
      const base_tp = dados.iniciais_GGF
      // await buscar_no_indexedDB("fechamento","iniciais_GGF_itens","periodo_tipo",[[String(per).replace("-",""),tp]])
      
      if (base_tp && base_tp.length > 0) {
        const custo_soma = base_tp.reduce((acc,row) => {
          if (row.Tipo === tp) {
            acc = acc + (row.ValorGGF || 0)
          }
          return acc
        },0)


        // COL DIFERENÇA
        if (!valid[per_atual]){
          valid[per_atual] = {}
        }
        if (!valid[per_atual][tp]){
          valid[per_atual][tp] = 0
        }
        valid[per_atual][tp] += custo_soma
        document.querySelector(`td[name='${per_atual}|${tp}|DIFERENÇA']`).innerText = 
          valid[per_atual][tp].toLocaleString("pt-BR",{style:"currency",currency:"BRL"})
        

        const td = document.querySelector(`td[name='${per_atual}|${tp}|INICIAL']`)

        td.innerText = custo_soma.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

        if (td) {
          
          td.classList.add("hover-background-vermelho")

          td.addEventListener("dblclick", () => abre_detalhe_base(base_tp,per,tp,"Saldos Iniciais_GGF"))
          
        }

      }

    })

    const evento = new CustomEvent("fechamento_funcao", {detail: {periodo: per_atual}})
    if (!funcoes_chamadas[per_atual]) funcoes_chamadas[per_atual] = {}
    funcoes_chamadas[per_atual]["trazer_inicial_GGF"] = true
    document.dispatchEvent(evento)
    
  } catch (e) {
    new Mensagem_Temporaria("temp_erro",String(e))
    console.error(e)
  }
  
}


async function trazer_devolucoes(per) {

  try {
    
    const tipos = ["AL","MP","MI"]

    tipos.map((tp) => {
      const td = document.querySelector(`td[name='${per}|${tp}|DEVOLUÇÕES']`)
      inserir_tres_pontinhos(td)
    })
    
    const response = await funcao_fetch("trazer_devolucoes",{
      periodo:per
    })
    const dados = await response.json()

    validacao_dados_do_fetch(dados,"Erro ao trazer coluna Devoluções.")

    if (dados.vazio) {
      // new Mensagem_Temporaria("temp_info", "A consulta (Devoluções) retornou vazia.")
      
    }
    
    // if (dados.devolucoes && dados.devolucoes.length > 0) {
    //   if (await existe_tabela("fechamento","devolucoes_itens")) {
    //     dados.devolucoes.forEach((row) => {
    //       salvar_info_no_indexedDB("fechamento","devolucoes_itens",row)
    //     })
    //   } else {
    //     salvar_base_no_indexedDB("fechamento",pegar_versao_iDB(true),dados.devolucoes,"devolucoes_itens",[
    //       ["periodo_tipo",["periodo","Tipo"]]
    //     ])
    //   }
    // }
    
    tipos.map(async (tp) => {
      let base_tp

      if (dados.devolucoes) {
        base_tp = dados.devolucoes
        // await buscar_no_indexedDB("fechamento","devolucoes_itens","periodo_tipo",[[String(per).replace("-",""),tp]])
      }
      
      if (base_tp && base_tp.length > 0) {
        const custo_soma = base_tp.reduce((acc,row) => {
          if (row.Tipo === tp) {
            acc = acc + (row.Custo || 0)
          }
          return acc
        },0)


        // COL DIFERENÇA
        if (!valid[per]){
          valid[per] = {}
        }
        if (!valid[per][tp]){
          valid[per][tp] = 0
        }
        valid[per][tp] += custo_soma
        document.querySelector(`td[name='${per}|${tp}|DIFERENÇA']`).innerText = 
          valid[per][tp].toLocaleString("pt-BR",{style:"currency",currency:"BRL"})
        

        const td = document.querySelector(`td[name='${per}|${tp}|DEVOLUÇÕES']`)

        td.innerText = custo_soma.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

        if (td) {
          td.classList.add("hover-background-vermelho")
          td.addEventListener("dblclick", () => abre_detalhe_base(base_tp,per,tp,"Devoluções"))
        }

      } else {
        const td = document.querySelector(`td[name='${per}|${tp}|DEVOLUÇÕES']`)
        td.innerText = 0.0.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      }

    })

    const evento = new CustomEvent("fechamento_funcao", {detail: {periodo: per}})
    if (!funcoes_chamadas[per]) funcoes_chamadas[per] = {}
    funcoes_chamadas[per]["trazer_devolucoes"] = true
    document.dispatchEvent(evento)
    
  } catch (e) {
    new Mensagem_Temporaria("temp_erro",String(e))
    console.error(e)
  }
  
}

async function trazer_CPI(per) {

  try {
    
    const tipos = ["PI","PA","PI-GGF","PA-GGF"]
    tipos.map((tp) => {
      const td = document.querySelector(`td[name='${per}|${tp}|CPI']`)
      inserir_tres_pontinhos(td)
    })
    
    const response = await funcao_fetch("trazer_CPI",{
      periodo:per
    })
    const dados = await response.json()

    validacao_dados_do_fetch(dados,"Erro ao trazer dados CPI.")

    if (dados.vazio) {
      // new Mensagem_Temporaria("temp_info", "A consulta retornou vazia.")
      // return
    }
    
    // if (dados.CPI && dados.CPI.length > 0) {
    //   if (await existe_tabela("fechamento","CPI_itens")) {
    //     dados.CPI.forEach((row) => {
    //       salvar_info_no_indexedDB("fechamento","CPI_itens",row)
    //     })
    //   } else {
    //     salvar_base_no_indexedDB("fechamento",pegar_versao_iDB(true),dados.CPI,"CPI_itens",[
    //       ["periodo_tipo",["periodo","Tipo"]]
    //     ])
    //   }
    // }

    
    ["PA","PI"].map(async (tp) => {
      
      let base_tp
      if (dados.CPI) {
        base_tp = dados.CPI
        // await buscar_no_indexedDB("fechamento","CPI_itens","periodo_tipo",[[String(per).replace("-",""),tp]])
      }

      const td = document.querySelector(`td[name='${per}|${tp}|CPI']`)
      const tdGGF = document.querySelector(`td[name='${per}|${tp}-GGF|CPI']`)
      
      if (base_tp && base_tp.length > 0) {
        const custo_soma = base_tp.reduce((acc,row) => {
          if (row.Tipo === tp) {
            acc["Custo"] += (row.Custo || 0)
            acc["CustoGGF"] += (row.CustoGGF || 0)
          }
          return acc
        },{"Custo":0,"CustoGGF":0})


        // COL DIFERENÇA
        if (!valid[per]){
          valid[per] = {}
        }
        if (!valid[per][tp]){
          valid[per][tp] = 0
        }
        valid[per][tp] += custo_soma["Custo"]
        document.querySelector(`td[name='${per}|${tp}|DIFERENÇA']`).innerText = 
          valid[per][tp].toLocaleString("pt-BR",{style:"currency",currency:"BRL"})

        if (!valid[per][`${tp}-GGF`]){
          valid[per][`${tp}-GGF`] = 0
        }
        valid[per][`${tp}-GGF`] += custo_soma["CustoGGF"]
        document.querySelector(`td[name='${per}|${tp}-GGF|DIFERENÇA']`).innerText = 
          valid[per][`${tp}-GGF`].toLocaleString("pt-BR",{style:"currency",currency:"BRL"})


        td.innerText = custo_soma["Custo"].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        tdGGF.innerText = custo_soma["CustoGGF"].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

        if (td) {
          
          td.classList.add("hover-background-vermelho")
          td.addEventListener("dblclick", () => abre_detalhe_base(base_tp,per,tp,"CPI"))

          tdGGF.classList.add("hover-background-vermelho")
          tdGGF.addEventListener("dblclick", () => abre_detalhe_base(base_tp,per,tp,"CPI"))
          
        }

      } else {
        td.innerText = 0.0.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        tdGGF.innerText = 0.0.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      }

    })
    
    const evento = new CustomEvent("fechamento_funcao", {detail: {periodo: per}})
    if (!funcoes_chamadas[per]) funcoes_chamadas[per] = {}
    funcoes_chamadas[per]["trazer_CPI"] = true
    document.dispatchEvent(evento)

  } catch (e) {
    new Mensagem_Temporaria("temp_erro",String(e))
    console.error(e)
  }
  
}

async function trazer_CPV(per) {

  try {
    
    const tipos = ["PI","PA","PI-GGF","PA-GGF"]
    tipos.map((tp) => {
      const td = document.querySelector(`td[name='${per}|${tp}|CPV']`)
      inserir_tres_pontinhos(td)
    })
    
    const response = await funcao_fetch("trazer_CPV",{
      periodo:per
    })
    const dados = await response.json()

    validacao_dados_do_fetch(dados,"Erro ao trazer dados CPV.")

    if (dados.vazio) {
      // new Mensagem_Temporaria("temp_info", "A consulta retornou vazia.")
      // return
    }
    
    // if (dados.CPV && dados.CPV.length > 0) {
    //   if (await existe_tabela("fechamento","CPV_itens")) {
    //     dados.CPV.forEach((row) => {
    //       salvar_info_no_indexedDB("fechamento","CPV_itens",row)
    //     })
    //   } else {
    //     salvar_base_no_indexedDB("fechamento",pegar_versao_iDB(true),dados.CPV,"CPV_itens",[
    //       ["periodo_tipo",["periodo","Tipo"]]
    //     ])
    //   }
    // }

    
    ["PA","PI"].map(async (tp) => {
      
      let base_tp
      if (dados.CPV) {
        base_tp = dados.CPV
        // await buscar_no_indexedDB("fechamento","CPV_itens","periodo_tipo",[[String(per).replace("-",""),tp]])
      }

      const td = document.querySelector(`td[name='${per}|${tp}|CPV']`)
      const tdGGF = document.querySelector(`td[name='${per}|${tp}-GGF|CPV']`)
      
      if (base_tp && base_tp.length > 0) {
        const custo_soma = base_tp.reduce((acc,row) => {
          if (row.Tipo === tp) {
            acc["Custo"] += (row.Custo || 0)
            acc["CustoGGF"] += (row.CustoGGF || 0)
          }
          return acc
        },{"Custo":0,"CustoGGF":0})


        // COL DIFERENÇA
        if (!valid[per]){
          valid[per] = {}
        }
        if (!valid[per][tp]){
          valid[per][tp] = 0
        }
        valid[per][tp] += custo_soma["Custo"]
        document.querySelector(`td[name='${per}|${tp}|DIFERENÇA']`).innerText = 
          valid[per][tp].toLocaleString("pt-BR",{style:"currency",currency:"BRL"})

        if (!valid[per][`${tp}-GGF`]){
          valid[per][`${tp}-GGF`] = 0
        }
        valid[per][`${tp}-GGF`] += custo_soma["CustoGGF"]
        document.querySelector(`td[name='${per}|${tp}-GGF|DIFERENÇA']`).innerText = 
          valid[per][`${tp}-GGF`].toLocaleString("pt-BR",{style:"currency",currency:"BRL"})


        td.innerText = custo_soma["Custo"].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        tdGGF.innerText = custo_soma["CustoGGF"].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

        if (td) {
          
          td.classList.add("hover-background-vermelho")
          td.addEventListener("dblclick", () => abre_detalhe_base(base_tp,per,tp,"CPV"))

          tdGGF.classList.add("hover-background-vermelho")
          tdGGF.addEventListener("dblclick", () => abre_detalhe_base(base_tp,per,tp,"CPV"))
          
        }

      } else {
        td.innerText = 0.0.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        tdGGF.innerText = 0.0.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      }

    })

    const evento = new CustomEvent("fechamento_funcao", {detail: {periodo: per}})
    if (!funcoes_chamadas[per]) funcoes_chamadas[per] = {}
    funcoes_chamadas[per]["trazer_CPV"] = true
    document.dispatchEvent(evento)
    
  } catch (e) {
    new Mensagem_Temporaria("temp_erro",String(e))
    console.error(e)
  }
  
}

async function trazer_final(per) {

  try {
    
    const tipos = ["AL","MP","MI","PI","PA","PI-GGF","PA-GGF"]

    tipos.map((tp) => {
      const td = document.querySelector(`td[name='${per}|${tp}|FINAL']`)
      inserir_tres_pontinhos(td)
    })
    
    const response = await funcao_fetch("trazer_final",{
      periodo:per
    })
    const dados = await response.json()

    validacao_dados_do_fetch(dados,"Erro ao trazer coluna Final.")

    if (dados.vazio) {
      new Mensagem_Temporaria("temp_info", "A consulta (Final) retornou vazia.")
      return
    }
    
    // if (dados.final && dados.final.length > 0) {
    //   if (await existe_tabela("fechamento","final_itens")) {
    //     dados.final.forEach((row) => {
    //       salvar_info_no_indexedDB("fechamento","final_itens",row)
    //     })
    //   } else {
    //     salvar_base_no_indexedDB("fechamento",pegar_versao_iDB(true),dados.final,"final_itens",[
    //       ["periodo_tipo",["periodo","Tipo"]]
    //     ])
    //   }
    // }

    
    tipos.map(async (tp) => {
      const base_tp = dados.final
      // await buscar_no_indexedDB("fechamento","final_itens","periodo_tipo",[
      //   [String(per).replace("-",""),tp.replace("-GGF","")]
      // ])
      const td = document.querySelector(`td[name='${per}|${tp}|FINAL']`)
      
      if (base_tp && base_tp.length > 0) {
        const custo_soma = base_tp.reduce((acc,row) => {
          if (row.Tipo === tp.replace("-GGF","")) {
            acc = acc + ((["PI-GGF","PA-GGF"].includes(tp) ? row.ValorGGF : row.Valor) || 0)
          }
          return acc
        },0)

        // ALIMENTA valores_final PARA CALCULAR A DIFERENÇA
        valores_final[per] ??= {}
        valores_final[per][tp] = custo_soma

        td.innerText = custo_soma.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

        if (td) {
          td.classList.add("hover-background-vermelho")
          td.addEventListener("dblclick", () => abre_detalhe_base(base_tp,per,tp.replace("-GGF",""),"Saldos Finais"))
        }

      } else {
        td.innerText = 0.0.toLocaleString("pt-BR",{style:"currency", currency:"BRL"})
      }

    })

    const evento = new CustomEvent("fechamento_funcao", {detail: {periodo: per}})
    if (!funcoes_chamadas[per]) funcoes_chamadas[per] = {}
    funcoes_chamadas[per]["trazer_final"] = true
    document.dispatchEvent(evento)
    
  } catch (e) {
    new Mensagem_Temporaria("temp_erro",String(e))
    console.error(e)
  }
  
}

async function trazer_requisicoes(per) {

  try {
    
    const tipos = ["AL","MP","MI","PI","PI-GGF"]
    tipos.map((tp) => {
      const td = document.querySelector(`td[name='${per}|${tp}|REQUISIÇÕES']`)
      inserir_tres_pontinhos(td)
    })
    
    const response = await funcao_fetch("trazer_requisicoes",{
      periodo:per
    })
    const dados = await response.json()

    validacao_dados_do_fetch(dados,"Erro ao trazer dados Requisições.")

    tipos.map(async (tp) => {
      
      let base_tp
      if (dados.requisicoes) {
        base_tp = dados.requisicoes
        // await buscar_no_indexedDB("fechamento","requisicoes_itens","periodo_tipo",[[String(per).replace("-",""),tp]])
      }

      const td = document.querySelector(`td[name='${per}|${tp}|REQUISIÇÕES']`)
      const tdGGF = document.querySelector(`td[name='${per}|${tp}-GGF|REQUISIÇÕES']`)
      const nome_col = tp === "PI-GGF" ? "ValorGGF" : "Valor"
      
      if (base_tp && base_tp.length > 0) {
        const custo_soma = base_tp.reduce((acc,row) => {
          if (row.Tipo === tp.replace("-GGF","")) {
            acc += row[nome_col]
          }
          return acc
        },0)


        // COL DIFERENÇA
        if (!valid[per]){
          valid[per] = {}
        }
        if (!valid[per][tp]){
          valid[per][tp] = 0
        }
        valid[per][tp] += custo_soma
        document.querySelector(`td[name='${per}|${tp}|DIFERENÇA']`).innerText = 
          valid[per][tp].toLocaleString("pt-BR",{style:"currency",currency:"BRL"})


        td.innerText = custo_soma.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

        if (td) {
          
          td.classList.add("hover-background-vermelho")
          td.addEventListener("dblclick", () => abre_detalhe_base(base_tp,per,tp,"Requisições"))
          
        }

      } else {
        td.innerText = 0.0.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        tdGGF.innerText = 0.0.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      }

    })

    const evento = new CustomEvent("fechamento_funcao", {detail: {periodo: per}})
    if (!funcoes_chamadas[per]) funcoes_chamadas[per] = {}
    funcoes_chamadas[per]["trazer_requisicoes"] = true
    document.dispatchEvent(evento)
    
  } catch (e) {
    new Mensagem_Temporaria("temp_erro",String(e))
    console.error(e)
  }
  
}

function abre_detalhe_base(base_tp,per,tp,titulo) {
  
  if (!titulo) titulo = ""

  const pelicula = new Pelicula(undefined, undefined, "escuro").el
  const box_detalhe = new Box("detalhe_fechamento",pelicula,{})
  
  box_detalhe.titulo(`${titulo} - Detalhes de ${formata_mes_e_ano(per)} em ${tp}`,{},"color-black")
  box_detalhe.botao_fechar(["hover-color-vermelho","color-black"])

  per = per.replace("-","")
  const base = base_tp.filter((row) => row.periodo === per && row.Tipo === tp)
  new Tabela(base,box_detalhe.el,undefined,{
    botao_fechar:false,
    excel:true,
    style_div_externa: {paddingBottom: "2rem"}
  },undefined,{
    cols: {
      "Valor": (td, row) => {
        td.innerText = row.Valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      },
      "ValorGGF": (td, row) => {
        td.innerText = row.ValorGGF.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      },
      "Custo": (td, row) => {
        td.innerText = row.Custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      },
      "CustoGGF": (td, row) => {
        td.innerText = row.CustoGGF.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      },
      "Total": (td, row) => {
        td.innerText = row.Total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      },
      "Quantidade": (td, row) => {
        td.innerText = row.Quantidade.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 5 })
      },
      "Qini": (td, row) => {
        td.innerText = row.Qini.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 5 })
      },
      "Qfim": (td, row) => {
        td.innerText = row.Qfim.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 5 })
      },
    }
  })
  
}

async function trazer_ajustes(per) {

  try {
    
    const tipos = ["AL","MP","MI","PI","PA","PI-GGF","PA-GGF"]
    tipos.map((tp) => {
      const td = document.querySelector(`td[name='${per}|${tp}|AJUSTES']`)
      inserir_tres_pontinhos(td)
    })
    
    const response = await funcao_fetch("trazer_ajustes",{
      periodo:per
    })
    const dados = await response.json()

    validacao_dados_do_fetch(dados,"Erro ao trazer dados de Ajustes.")

    tipos.map(async (tp) => {
      
      let base_tp
      if (dados.ajustes) {
        base_tp = dados.ajustes
        // await buscar_no_indexedDB("fechamento","requisicoes_itens","periodo_tipo",[[String(per).replace("-",""),tp]])
      }

      const td = document.querySelector(`td[name='${per}|${tp}|AJUSTES']`)
      
      if (base_tp && base_tp.length > 0) {
        const custo_soma = base_tp.reduce((acc,row) => {
          if (row.Tipo === tp.replace("-GGF","")) {
            acc = acc + ((["PI-GGF","PA-GGF"].includes(tp) ? row.ValorGGF : row.Valor) || 0)
          }
          return acc
        },0)


        // COL DIFERENÇA
        if (!valid[per]){
          valid[per] = {}
        }
        if (!valid[per][tp]){
          valid[per][tp] = 0
        }
        valid[per][tp] += custo_soma
        document.querySelector(`td[name='${per}|${tp}|DIFERENÇA']`).innerText = 
          valid[per][tp].toLocaleString("pt-BR",{style:"currency",currency:"BRL"})


        td.innerText = custo_soma.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

        if (td) {
          
          td.classList.add("hover-background-vermelho")
          td.addEventListener("dblclick", () => abre_detalhe_base(
            base_tp.sort((a,b) => a.Valor - b.Valor),
            per,tp.replace("-GGF",""),"Ajustes"
          ))
          
        }

      } else {
        td.innerText = 0.0.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      }

    })

    const evento = new CustomEvent("fechamento_funcao", {detail: {periodo: per}})
    if (!funcoes_chamadas[per]) funcoes_chamadas[per] = {}
    funcoes_chamadas[per]["trazer_ajustes"] = true
    document.dispatchEvent(evento)
    
  } catch (e) {
    new Mensagem_Temporaria("temp_erro",String(e))
    console.error(e)
  }
  
}

document.addEventListener("fechamento_funcao", (e) => {

  const per = e.detail.periodo
  
  if (
    funcoes_chamadas[per]["trazer_inicial"] &&
    funcoes_chamadas[per]["trazer_entradas"] &&
    funcoes_chamadas[per]["trazer_inicial_GGF"] &&
    funcoes_chamadas[per]["trazer_devolucoes"] &&
    funcoes_chamadas[per]["trazer_CPI"] &&
    funcoes_chamadas[per]["trazer_CPV"] &&
    funcoes_chamadas[per]["trazer_final"] &&
    funcoes_chamadas[per]["trazer_requisicoes"] &&
    funcoes_chamadas[per]["trazer_ajustes"]
  ) {
    edita_coluna_diferenca(per)
  }
})

function edita_coluna_diferenca(per) {

  const tipos = ["AL","MP","MI","PI","PA","PI-GGF","PA-GGF"]
  
  tipos.map((tp) => {
    const td = document.querySelector(`td[name='${per}|${tp}|DIFERENÇA']`)
    const dif = (valid[per][tp] - valores_final[per][tp])
    td.innerText = 
      dif.toLocaleString("pt-BR", {style:"currency",currency: "BRL"})
    
    style(td,{
      opacity: "0",
      transition: "all 300ms ease-in-out",
    })

    setTimeout(() => {
      style(td,{
        opacity: "1",
        fontWeight: "bold",
        color: (dif > 10 | dif < -10) ? "lightcoral" : "forestgreen"
      })
    },100)

    
  })
  
  const celulas = [] // para abrir (animação)
  const totais = {"MP":{},"GGF":{}}
  const tbody = document.querySelector(`#table-${per}`).querySelector("tbody")
  const tr = document.createElement("tr")
  tr.setAttribute("name",`${per}|TOTAL`)
  tbody.append(tr)

  const td_seq = document.createElement("td")
  td_seq.setAttribute("name",`${per}|TOTAL|SEQ`)
  td_seq.classList.add("linha-total")
  tr.append(td_seq)
  celulas.push(td_seq)

  const td_tipo = document.createElement("td")
  td_tipo.setAttribute("name",`${per}|TOTAL|TIPO`)
  td_tipo.classList.add("linha-total")
  tr.append(td_tipo)
  celulas.push(td_tipo)
  td_tipo.innerText = "TOTAL"

  colunas.map((col) => {
    
    if (["SEQ","TIPO"].includes(col)) return

    tipos.map((tp) => {
      
      let numero = 0.0
      const td_total = document.querySelector(`td[name='${per}|${tp}|${col}']`)
      
      if (td_total && td_total.innerText !== "-") {
        const texto_num = td_total.innerText
        numero = parseFloat(texto_num.replace(/[^\d,-]/g, '').replace('.', '').replace(',', '.'))// * (texto_num.includes('-') ? -1 : 1)
      }
      
      const mp_ou_ggf = (tp.includes("GGF")) ? "GGF" : "MP"
      totais[mp_ou_ggf][col] = (totais[mp_ou_ggf][col] || 0) + numero
      
    })
    

    const td_total = document.createElement("td")
    td_total.setAttribute("name",`${per}|TOTAL|${col}`)
    td_total.classList.add("linha-total")
    td_total.innerText = (
      (totais["MP"][col] || 0) + (totais["GGF"][col] || 0)
    ).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})
    tr.append(td_total)
    celulas.push(td_total)

    const td_ttl_mp = tbody.querySelector(`td[name='${per}|TTL-MP|${col}']`)
    td_ttl_mp.innerText = totais["MP"][col].toLocaleString("pt-BR", {style:"currency",currency:"BRL"})

    const td_ttl_ggf = tbody.querySelector(`td[name='${per}|TTL-GGF|${col}']`)
    td_ttl_ggf.innerText = totais["GGF"][col].toLocaleString("pt-BR", {style:"currency",currency:"BRL"})
    
  })
  
  esconder_ou_mostrar_ggf(tbody, per)
  
  setTimeout(() => {
    celulas.map((cel) => {
      cel.style.opacity = "1"
    })
  }, 200)
  
}

function esconder_ou_mostrar_ggf(tbody, per) {

    const todas_linhas = tbody.querySelectorAll("tr")
    const linhas_ggf = []
    let lin_ttl_ggf
    todas_linhas.forEach((linha) => {
      const name = linha.getAttribute("name")
      if (name.includes("GGF")) {
        linhas_ggf.push(linha)
        linha.classList.add("texto-claro")
      }
      if (name.includes("TTL")) lin_ttl_ggf = linha
    })
    
    style(lin_ttl_ggf,{position: "relative"})
    const btn_mostrar = div(lin_ttl_ggf, undefined, ["botao-mostrar","hover-color-vermelho"],"Mostrar GGF")
  
    btn_mostrar.addEventListener("click", () => {
      btn_mostrar.remove()
      linhas_ggf.forEach(lin => {
        lin.classList.remove("texto-claro")
      })
    })
    
}