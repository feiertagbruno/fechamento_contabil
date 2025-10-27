import { Box, Pelicula } from "./classes/Box.js"
import { Mensagem_Temporaria } from "./classes/Mensagem_Temp.js"
import { Tabela } from "./classes/Tabela.js"
import { div, funcao_fetch, getAnoMesAtual, getMesNome, input_element, inserir_tres_pontinhos, label, mesAnterior, validacao_dados_do_fetch } from "./global_functions.js"
import { buscar_no_indexedDB, existe_tabela, pegar_versao_iDB, salvar_base_no_indexedDB, salvar_info_no_indexedDB, salvar_ou_adicionar_no_indexedDB } from "./indexedDB_funcs.js"

indexedDB.deleteDatabase("fechamento")

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

    const colunas = [
      "SEQ", "TIPO","INICIAL","ENTRADAS","DEVOLUÇÕES","REQUISIÇÕES","CPI","CPV","AJUSTES","FINAL"
    ]

    const thead = document.createElement("thead")
    table.append(thead)
    
    colunas.map((col) => {
      const th = document.createElement("th")
      th.innerText = col
      thead.append(th)
    })

    const seq_tipo = [
      ["01","AL"],["02","MP"],["03","MI"],
      ["04","PI"],["05","PA"],
      ["06","PI-GGF"],["07","PA-GGF"]
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
      periodo:per
    })
    const dados = await response.json()

    validacao_dados_do_fetch(dados,"Erro ao trazer coluna Inicial.")

    if (dados.vazio) {
      new Mensagem_Temporaria("temp_info", "A consulta (Inicial) retornou vazia.")
      return
    }
    
    // if (dados.iniciais && dados.iniciais.length > 0) {
    //   if (await existe_tabela("fechamento","iniciais_itens")) {
    //     dados.iniciais.forEach((row) => {
    //       salvar_info_no_indexedDB("fechamento","iniciais_itens",row)
    //     })
    //   } else {
    //     salvar_ou_adicionar_no_indexedDB("fechamento",pegar_versao_iDB(true),dados.iniciais,"iniciais_itens",[
    //       ["periodo_tipo",["periodo","Tipo"]]
    //     ])
    //   }
    // }

    
    tipos.map(async (tp) => {
      const base_tp = dados.iniciais
      // await buscar_no_indexedDB("fechamento","iniciais_itens","periodo_tipo",[[String(per).replace("-",""),tp]])
      
      if (base_tp && base_tp.length > 0) {
        const custo_soma = base_tp.reduce((acc,row) => {
          if (row.Tipo === tp) {
            acc = acc + (row.Valor || 0)
          }
          return acc
        },0)

        const td = document.querySelector(`td[name='${per_atual}|${tp}|INICIAL']`)

        td.innerText = custo_soma.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

        if (td) {
          
          td.classList.add("hover-background-vermelho")

          td.addEventListener("click", () => abre_detalhe_base(base_tp,per,tp,"Saldos Iniciais"))
          
        }

      }

    })
    
  } catch (e) {
    new Mensagem_Temporaria("temp_erro",String(e))
    console.error(e)
  }
  
}

async function abre_detalhe(nome_tabela, per, tp, titulo) {

  if (!titulo) titulo = ""
  
  const pelicula = new Pelicula(undefined, undefined, "escuro").el
  const box_detalhe = new Box("detalhe_fechamento",pelicula,{})
  
  box_detalhe.titulo(`${titulo} - Detalhes de ${formata_mes_e_ano(per)} em ${tp}`,{},"color-black")
  box_detalhe.botao_fechar(["hover-color-vermelho","color-black"])

  const base = await buscar_no_indexedDB("fechamento",nome_tabela,"periodo_tipo",[[per.replace("-",""),tp]])
  
  new Tabela(base,box_detalhe.el,undefined,{
    botao_fechar:false,
    excel:true,
  },undefined,{
    cols: {
      "Valor": (td, row) => {
        td.innerText = row.Valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      },
      "Custo": (td, row) => {
        td.innerText = row.Custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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
    }
  })
  
  
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


        td.innerText = custo_soma.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

        if (td) {
          
          td.classList.add("hover-background-vermelho")

          td.addEventListener("click", () => abre_detalhe_base(base_tp,per,tp,"Entradas"))
          
        }

      } else {
        td.innerText = 0.0.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      }

    })
    
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

        const td = document.querySelector(`td[name='${per_atual}|${tp}|INICIAL']`)

        td.innerText = custo_soma.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

        if (td) {
          
          td.classList.add("hover-background-vermelho")

          td.addEventListener("click", () => abre_detalhe_base(base_tp,per,tp,"Saldos Iniciais_GGF"))
          
        }

      }

    })
    
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

        const td = document.querySelector(`td[name='${per}|${tp}|DEVOLUÇÕES']`)

        td.innerText = custo_soma.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

        if (td) {
          td.classList.add("hover-background-vermelho")
          td.addEventListener("click", () => abre_detalhe_base(base_tp,per,tp,"Devoluções"))
        }

      } else {
        const td = document.querySelector(`td[name='${per}|${tp}|DEVOLUÇÕES']`)
        td.innerText = 0.0.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      }

    })
    
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


        td.innerText = custo_soma["Custo"].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        tdGGF.innerText = custo_soma["CustoGGF"].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

        if (td) {
          
          td.classList.add("hover-background-vermelho")
          td.addEventListener("click", () => abre_detalhe_base(base_tp,per,tp,"CPI"))

          tdGGF.classList.add("hover-background-vermelho")
          tdGGF.addEventListener("click", () => abre_detalhe_base(base_tp,per,tp,"CPI"))
          
        }

      } else {
        td.innerText = 0.0.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        tdGGF.innerText = 0.0.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      }

    })
    
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


        td.innerText = custo_soma["Custo"].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        tdGGF.innerText = custo_soma["CustoGGF"].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

        if (td) {
          
          td.classList.add("hover-background-vermelho")
          td.addEventListener("click", () => abre_detalhe_base(base_tp,per,tp,"CPV"))

          tdGGF.classList.add("hover-background-vermelho")
          tdGGF.addEventListener("click", () => abre_detalhe_base(base_tp,per,tp,"CPV"))
          
        }

      } else {
        td.innerText = 0.0.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        tdGGF.innerText = 0.0.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      }

    })
    
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

        td.innerText = custo_soma.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

        if (td) {
          td.classList.add("hover-background-vermelho")
          td.addEventListener("click", () => abre_detalhe_base(base_tp,per,tp.replace("-GGF",""),"Saldos Finais"))
        }

      } else {
        td.innerText = 0.0.toLocaleString("pt-BR",{style:"currency", currency:"BRL"})
      }

    })
    
  } catch (e) {
    new Mensagem_Temporaria("temp_erro",String(e))
    console.error(e)
  }
  
}

async function trazer_requisicoes(per) {

  try {
    
    const tipos = ["AL","MP","MI"]
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
      
      if (base_tp && base_tp.length > 0) {
        const custo_soma = base_tp.reduce((acc,row) => {
          if (row.Tipo === tp) {
            acc += row.Valor
          }
          return acc
        },0)


        td.innerText = custo_soma.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

        if (td) {
          
          td.classList.add("hover-background-vermelho")
          td.addEventListener("click", () => abre_detalhe_base(base_tp,per,tp,"Requisições"))
          
        }

      } else {
        td.innerText = 0.0.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        tdGGF.innerText = 0.0.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      }

    })
    
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


        td.innerText = custo_soma.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

        if (td) {
          
          td.classList.add("hover-background-vermelho")
          td.addEventListener("click", () => abre_detalhe_base(
            base_tp.sort((a,b) => a.Valor - b.Valor),
            per,tp.replace("-GGF",""),"Ajustes"
          ))
          
        }

      } else {
        td.innerText = 0.0.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      }

    })
    
  } catch (e) {
    new Mensagem_Temporaria("temp_erro",String(e))
    console.error(e)
  }
  
}
