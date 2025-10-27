import { div, input_element, style, trata_fuso_da_data } from "../global_functions.js"
import { exportar_base_para_excel } from "../indexedDB_funcs.js"


/**
 * @typedef {Object} OpcoesFucaoInserirTabela
 * @property {Object<string, string>} [style_div_externa] - CSS inline aplicado à div externa.
 * @property {Object<string, string>} [style_div_titulo] - CSS inline do título.
 * @property {string} [titulo_texto] - Texto exibido no título.
 * @property {boolean} [botao_fechar] - Se true, exibe botão de fechar.
 * @property {Object<string, string>} [style_botao_fechar] - CSS inline do botão de fechar.
 * @property {Object<string, string>} [style_div_tabela] - CSS inline aplicado à div da tabela.
 * @property {string} [class_tr_rows] - Classe CSS para as linhas (tr).
 * @property {boolean} [com_filtro] - Define se a tabela terá campo de filtros acima dela.
 * @property {Array} [cols_numericas] - Declara as colunas numéricas para a função de soma
 * @property {boolean} [excel] - se põe ou não o botão de baixar no excel
 */

/**
 * @typedef {Object} RenomearSelecionarOpcoes
 * @property {Record<string, string>} [cols]
 * @property {boolean} [filtrar] - Se true, filtra colunas com base em `cols`.
 */

/**
 * @typedef {Object} FuncoesTabela
 * @property {Object} [tr_rows] - Objeto para configuração das linhas (tr).
 *   Contém chaves como `"eventListeners"`, que são objetos com eventos e funções.
 *   Exemplo:
 *   {cols:{"data":(td) => {
 *      td.setAttribute("data-value", td.innerText)
 *      td.innerText = trata_fuso_da_data(td.innerText, "brasileiro")
 *    }},
 *    tr_rows: {
 *      cols_absorver:["bloqueado"],
 *      ponto_entrada: (tr) => {
 *        if (tr.getAttribute("data-bloqueado") === "1") {
 *          style(tr,{fontStyle:"italic",background:"lightgray"})
 *          tr.setAttribute("title","Fornecedor bloqueado")
 *        }
 *      },
 *      eventListeners: {
 *        click: [
 *          (ev) => { this.#detalhe3_lote_rejeitado(ev.target, box) },
 *          { once: false }
 *        ]
 *      }
 *    }
 *  }
 * @property {Record<string, function(HTMLElement): void>} [cols] - Mapeamento de coluna para função
 *   que será aplicada em cada célula dessa coluna.
 */

export class Tabela {
  /**
   * Cria uma tabela HTML dinâmica a partir de uma base de dados.
   *
   * @param {Array<Object>} base - Array de objetos representando os dados.
   * @param {Element} box - Elemento HTML onde a tabela será inserida.
   * @param {"beforebegin"|"beforeend"|"afterbegin"|"afterend"} tipo_insercao - Tipo de inserção no DOM.
   * @param {OpcoesFucaoInserirTabela} [opcoes] - Exemplo de uso: {
   * 
   *  botao_fechar: false,
   * 
   *  titulo_texto: "Lotes Rejeitados",
   * 
   *  class_tr_rows: "hover-color-vermelho"
   * 
   *}
   * @param {RenomearSelecionarOpcoes} [opcoes_renomear_selecionar] - Opções para renomear/filtrar colunas.
   * @param {FuncoesTabela} [funcoes] - Funções para manipulação de linhas e colunas.
   */
  constructor(base, box, tipo_insercao, opcoes={}, opcoes_renomear_selecionar={}, funcoes={}) {
    if (!base | base.length === 0) return

    const com_filtro = opcoes.com_filtro || true
    const div_externa = div(box,{...{
      flexFlow: "column",
      width:"60vw",
      placeSelf: "anchor-center",
      position: "relative",
      maxHeight: "100%",
    },...(opcoes["style_div_externa"] || {})},"tabela",undefined,tipo_insercao)
    this.div_externa = div_externa
    this.cols_numericas = opcoes.cols_numericas || []

    // TÍTULO
    div(
      div_externa, Object.assign({
        position: "absolute",
        top: "0",
        fontSize: "small",
        justifySelf: "anchor-center",
      },(opcoes["style_div_titulo"] || {})),
      undefined, opcoes["titulo_texto"] || ""
    )
    if (opcoes["titulo_texto"]) {
      style(div_externa,{paddingTop: "2.5rem"})
    }

    // BOTÃO FECHAR
    if (opcoes["botao_fechar"] === undefined) opcoes["botao_fechar"] = true
    if (opcoes["botao_fechar"]) {
      div(this.div_externa, Object.assign({
        position: "absolute",
        top: "0",
        right: "0",
        fontSize: 'x-large',
        transform: "translate(100%, -100%)"
      },(opcoes["style_botao_fechar"] || {})),"hover-color-vermelho","x").addEventListener("click",() => this.div_externa.remove())
    }

    const div_tabela = div(div_externa, Object.assign({
      background: "white",
      color: "black",
      overflow: "auto",
      maxHeight: "95vh",
      border: "3px solid gray",
      borderRadius: "10px",
    },(opcoes["style_div_tabela"] || {})),undefined, undefined, undefined, undefined, "div_tabela")

    this.div_tabela = div_tabela

    const table = document.createElement("table")
    this.table = table
    div_tabela.append(table)

    const thead = document.createElement("thead")
    this.thead = thead
    table.append(thead)

    let row0 = base[0]
    const tr = document.createElement("tr")
    thead.append(tr)

    let cols = opcoes_renomear_selecionar["cols"] || {}
    let filtrar = opcoes_renomear_selecionar["filtrar"] === undefined ? true : opcoes_renomear_selecionar["filtrar"]
    if (Object.keys(cols).length > 0 && filtrar) row0 = cols
    const base_excel = []

    // CABEÇALHOS
    for (let key of Object.keys(row0)) {
      const th = document.createElement("th")
      th.setAttribute("data-nome", key)
      th.innerText = cols[key] || key
      tr.append(th)
      if (com_filtro) {
        th.addEventListener("click",() => {
          if (/\bdata(\b|_)/.test(key)) {
            this.filtro(key,`Filtro ${cols[key] || key}`)  // fazer um especifico para data depois
          } else {
            this.filtro(key,`Filtro ${cols[key] || key}`)
          }
        })
      }
    }
      
    const tbody = document.createElement("tbody")
    this.tbody = tbody
    table.append(tbody)

    function funcao_do_td(key, trbody, row) {
      const td = document.createElement("td")
      td.setAttribute("data-nome", key)
      if (/\b[Dd]ata(\b|_)/.test(key)) {
        td.setAttribute("data-value",row[key])
        td.innerText = trata_fuso_da_data(row[key],"brasileiro")
      } else {
        td.innerText = row[key]
      }
      if (funcoes["cols"] && funcoes["cols"][key]) {
        funcoes["cols"][key](td, row)
      }
      trbody.append(td)
    }

    for (const row of base) {
      const trbody = document.createElement("tr")
      if (opcoes["class_tr_rows"]) trbody.classList.add(opcoes["class_tr_rows"])
      if (funcoes["tr_rows"]){
        if (funcoes["tr_rows"]["cols_absorver"]) {
          for (const col_absorver of funcoes["tr_rows"]["cols_absorver"]) {
            trbody.setAttribute(`data-${col_absorver}`,row[col_absorver])
            delete row[col_absorver]
          }
        }
        if (funcoes["tr_rows"]["ponto_entrada"]) {
          funcoes["tr_rows"]["ponto_entrada"](trbody,row)
        }
        if (funcoes["tr_rows"]["eventListeners"]) {
          for (const [func_event, func] of Object.entries(funcoes["tr_rows"]["eventListeners"])) {
            trbody.addEventListener(func_event, func[0], func[1])
          }
        }
      }
      tbody.append(trbody)

      const row_excel = {}
      for (const key of Object.keys(row0)) {
        funcao_do_td(key, trbody, row)
        row_excel[cols[key] || key] = row[key]
      }
      base_excel.push(row_excel)
    }

    if (opcoes["excel"]) {
      div(this.div_externa,{
        "textAlign": "center",
        "color": "black",
      },"hover-color-vermelho","Baixar em excel",undefined,undefined,"baixar_excel").addEventListener("click", () => {
        exportar_base_para_excel(base_excel,"Relatório")
      })
    }
    
  }

  filtro(key, texto_label) {

    if (this.div_filtro) this.div_filtro.remove()
    
    const div_filtro = div(this.div_externa,{
      padding: "0.5rem",
    },"flex-flow-column",undefined,"afterbegin")
    this.div_filtro = div_filtro
    const label = document.createElement("label")
    style(label,{display: "flex",color: "black"})
    label.innerText = texto_label
    label.setAttribute("for",`${key}-id`)
    div_filtro.append(label)
    const input_do_filtro = input_element(div_filtro,{
      // transition: "background 100ms ease-in-out"
    },undefined,undefined,undefined,undefined,`${key}-id`)
    input_do_filtro.addEventListener("input", (ev) => {

      if (this.func_input_filtro) clearTimeout(this.func_input_filtro)
      if (this.barra_progresso) clearTimeout(this.barra_progresso)
      if (ev.target.value === "") {
        style(ev.target,{background:"white"})
        return
      }

      this.progresso = 0
      this.barra_progresso = setInterval(() => {
        if (this.progresso > 100) {
          clearInterval(this.barra_progresso);
          style(ev.target,{background:"white"})
          this.#funcao_input_filtro(ev, key)
        } else {
          this.progresso++;
          this.#muda_progresso(ev.target, this.progresso)
        }
      },20)
      
      // this.func_input_filtro = setTimeout(() => {
      // },1010)

    })

    input_do_filtro.addEventListener("keyup", (ev) => {
      if (ev.key === "Escape") {
        this.div_filtro?.remove()
      }
    })

    this.#limpar_filtros(label, key)

  }

  #muda_progresso(input, p) {
    style(input,{
      background: `linear-gradient(to right, lightblue ${p}%, white ${p}%)`
    })
  }
  
  #funcao_input_filtro(ev, key) {
    const texto = ev.target.value
    const linhas = this.table.querySelector("tbody").querySelectorAll("tr")

    if (linhas.length === 0) return

    const somas = {}
    this.cols_numericas.forEach(cn => {
      somas[cn] = 0
    })

    linhas.forEach(lin => {
      const cel = lin.querySelector(`[data-nome='${key}']`)
      if (
        !String(cel.innerText).toUpperCase().includes(texto.toUpperCase()) &&
        !String(cel.getAttribute("data-value")).toUpperCase().includes(texto.toUpperCase())
      ) {
        lin.classList.toggle("hidden",true)
      } else {
        this.cols_numericas.forEach(cn => {
          const _cel = lin.querySelector(`[data-nome='${cn}']`)
          somas[cn] += Number(_cel.innerText)
        })
      }
    })
    
    // console.log(somas)
    // for (const key of this.cols_numericas) {

    //   const th = this.thead.querySelector(`th[data-nome='${key}']`)
    //   th.innerHTML = th.innerHTML.split("<br>")[0] + `<br>${somas[key]}`
      
    // }

    if (this.cols_numericas.length) {
      
      this.tbody.querySelector("tr[data-soma='true']")?.remove()
      
      const ths = this.thead.querySelectorAll("th")
      const tr = document.createElement("tr")
      tr.setAttribute("data-soma","true")
      this.tbody.append(tr)
      ths.forEach(th => {
        const key = th.getAttribute("data-nome")
        const td = document.createElement("td")

        td.setAttribute("data-nome", key)
        style(td,{
          background:"whitesmoke",
          border: "2px solid lightgray",
        })
        tr.append(td)

        if (this.cols_numericas.includes(key)) {
          td.innerText = somas[key]
        }
        
      })
    }
    
  }

  #limpar_filtros(label, key) {

    this.tbody.querySelector("tr[data-soma='true']")?.remove()
    
    const div_limpar = div(label,{
      fontSize: "large",
      padding: "0 0.5rem"
    },undefined,"🧹")
    div_limpar.addEventListener("click", () => {
      const linhas = this.table.querySelector("tbody").querySelectorAll("tr")
      linhas.forEach(lin => lin.classList.toggle("hidden", false))
      this.div_externa.querySelector(`#${key}-id`).value = ""
    })
  }

}
