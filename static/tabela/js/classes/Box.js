import { div } from "../global_functions.js"

export class Pelicula {
  /**
   * 
   * @param {HTMLElement | undefined} box 
   * @param {object | undefined} style 
   * @param {"claro"|"escuro"} tipo 
   */
  constructor(box, style, tipo="claro") {

    let cor_pelicula = "rgba(255,255,255,0.3)"
    if (tipo === "escuro") {
      cor_pelicula = "rgba(0,0,0,0.5)"
    }
    const style_padrao = {
      position: "fixed",
      width: "100vw",
      height: "100vh",
      top: "0",
      left:"0",
      background: cor_pelicula,
      zIndex: "100"
    }

    let style_pelicula
    if (style) {
      style_pelicula = Object.assign(style_padrao, style)
    } else {
      style_pelicula = style_padrao
    }

    if (!box) box = document.body
    this.box = box

    this.overflow_anterior = getComputedStyle(box).overflow
    box.style.overflow = "hidden"

    const pelicula = div(box,style_pelicula,"pelicula")
    this.el = pelicula
    if (this.el.style.position === "absolute") {
      this.el.style.top = box.scrollTop + "px"
    }

    div(this.el,{display:"none",},undefined,"",undefined,undefined,"btn_fechar_pelicula").addEventListener("click", () => {
      this.#remove_me()
    })

  }

  #remove_me() {
    this.box.style.overflow = this.overflow_anterior
    this.el.remove()
  }

}


export class Box {
  /**
   * 
   * @param {"msg_sucesso"|"msg_erro"|"msg_info"|
   * "temp_erro"|"temp_info"|"temp_sucesso"|"detalhe_fechamento"} tipo_box
   * @param {HTMLElement} append_el - Elemento para appendar a div que será criada.
   * @param {Partial<CSSStyleDeclaration>} styles
   * @param {Array | String | undefined} class_add
   * @param {String | undefined} text - é o que vai no innerText
   * @param {"beforebegin" | "afterbegin" | "beforeend" | "afterend"} tipo_insercao
   */
  constructor(tipo_box, append_el, styles, class_add, text, tipo_insercao="beforeend", id, name) {

    if (!tipo_box) throw new Error("Informe o tipo da Box que deseja criar")
    if (!append_el) append_el = document.body

    let style_da_box
    if (tipo_box === "msg_sucesso") {
      style_da_box = this.#style_mensagem_sucesso()
    } else if (tipo_box === "msg_erro") {
      style_da_box = this.#style_mensagem_erro()
    } else if (tipo_box === "msg_info") {
      style_da_box = this.#style_mensagem_info()
    } else if (tipo_box === "temp_erro") {
      style_da_box = this.#style_temp_erro()
    } else if (tipo_box === "temp_info") {
      style_da_box = this.#style_temp_info()
    } else if (tipo_box === "temp_sucesso") {
      style_da_box = this.#style_temp_sucesso()
    } else if (tipo_box === "detalhe_fechamento") {
      style_da_box = this.#style_detalhe_fechamento()
    }

    if (styles && Object.keys(styles).length > 0) {
      style_da_box = Object.assign(style_da_box,styles)
    }
    this.el = div(append_el, style_da_box, class_add, text, tipo_insercao, id, name)
    if (!("color" in style_da_box)) {
      style(this.el,{
        color: isColorLight(this.el) ? "black" : "white",
      })
    }

    this.el.tabIndex = "0"
    this.el.addEventListener("keyup", (ev) => {
      ev.stopPropagation()
      if (ev.key === "Escape") {
        const tmp_btn = this.botao_fechar()
        if (tmp_btn) {
          tmp_btn.click()
        } else {
          this.el.remove()
        }
      }
    })
    
  }

  #style_detalhe_fechamento() {
    return {
      position: "absolute",
      minWidth: "30rem",
      width:"80vw",
      height:"auto",
      borderRadius: "20px",
      background: "antiquewhite",
      color: "white",
      display: "flex",
      flexFlow: "column",
      padding: "3rem 1rem",
      boxSizing: "border-box",
      textAlign: "center",
      placeSelf: "anchor-center",
      height: "80vh",
      border: "2px ridge white",
    }
  }

  #style_temp_sucesso() {
    return {
      position: "fixed",
      minWidth: "30rem",
      width:"fit-content",
      justifySelf: "center",
      top: "2rem",
      height:"auto",
      borderRadius: "20px",
      background: "rgba(50, 205, 50, 0.9)",
      color: "white",
      display: "flex",
      flexFlow: "column",
      padding: "3rem 1rem",
      boxSizing: "border-box",
      textAlign: "center",
      fontSize: "medium",
    }
  }
  
  add_botao(texto, funcao, style, class_add="hover-color-vermelho") {
    if (!this.div_botoes) this.div_botoes = div(this.el,{
      position: "absolute",
      width: "fit-content",
      display: "flex",
      flexFlow: "row",
      justifySelf: "center",
      bottom: "0.2rem",
      gap: "1rem",
    })

    let style_padrao = {

    }
    if (style) {
      style_padrao = Object.assign(style_padrao,style)
    }


    const botao = div(this.div_botoes,style_padrao,class_add, texto)
    botao.addEventListener("click", funcao)

  }

  #style_temp_info() {
    return {
      position: "fixed",
      minWidth: "30rem",
      width:"fit-content",
      justifySelf: "center",
      top: "2rem",
      height:"auto",
      borderRadius: "20px",
      background: "rgba(95, 158, 160, 0.9)",
      color: "white",
      display: "flex",
      flexFlow: "column",
      padding: "3rem 1rem",
      boxSizing: "border-box",
      textAlign: "center",
      fontSize: "medium",
    }
  }

  #style_temp_erro() {
    return {
      position: "fixed",
      minWidth: "30rem",
      width:"fit-content",
      justifySelf: "center",
      top: "2rem",
      height:"auto",
      borderRadius: "20px",
      background: "rgba(220, 20, 60, 0.9)",
      color: "white",
      display: "flex",
      flexFlow: "column",
      padding: "3rem 1rem",
      boxSizing: "border-box",
      textAlign: "center",
      fontSize: "medium",
    }
  }

  #style_mensagem_info() {
    return {
      position: "fixed",
      width:"fit-content",
      height:"auto",
      borderRadius: "20px",
      background: "floralwhite",
      color: "indigo",
      placeSelf: "anchor-center",
      display: "flex",
      flexFlow: "column",
      justifyContent: "center",
      // padding: "5rem",
      boxSizing: "border-box",
      textAlign: "center",
      fontSize: "medium",
      minWidth: "35rem",
      minHeight: "15rem",
      border: "3px darkcyan",
      borderStyle: "ridge",
    }
  }

  #style_mensagem_erro() {
    return {
      position: "fixed",
      width:"60%",
      height:"auto",
      borderRadius: "20px",
      background: "brown",
      color: "white",
      placeSelf: "anchor-center",
      display: "flex",
      flexFlow: "column",
      justifyContent: "center",
      padding: "5rem",
      boxSizing: "border-box",
      textAlign: "center",
      fontSize: "medium",
    }
  }

  #style_mensagem_sucesso() {
    return {
      position: "fixed",
      width:"60%",
      height:"auto",
      borderRadius: "20px",
      background: "rgb(190, 190, 190)",
      color: "rgb(23, 121, 44)",
      placeSelf: "anchor-center",
      display: "flex",
      flexFlow: "column",
      justifyContent: "center",
      padding: "5rem",
      boxSizing: "border-box",
      textAlign: "center",
      fontSize: "medium",
    }
  }

  botao_fechar(class_add="hover-color-vermelho", el_para_fechar, funcao_onclick, style_botao_fechar={}) {
    
    if (this.botao_fechar_el) return this.botao_fechar_el
    
    const style_padrao = {
      position:"absolute",
      right:"1rem",
      top:"0",
      fontWeight: "bold",
      padding: "1rem",
    }
    
    const btn = div(this.el, Object.assign(style_padrao, style_botao_fechar), class_add, "X")
    btn.setAttribute("name","botao-fechar")

    btn.onclick = () => {
      if (el_para_fechar) {
        el_para_fechar.remove()
      } else {
        const pai = this.el.parentElement
        if (pai.classList.contains("pelicula")){
          pai.querySelector("[name='btn_fechar_pelicula']").click()
        } else {
          this.el.remove()
        }
      }
      if (document.querySelectorAll(".pelicula").length === 0) {
        document.body.style.overflowY = "auto"
      }

      if (funcao_onclick) funcao_onclick()

    }

    this.botao_fechar_el = btn
    return btn

  }
  
  titulo(texto, style, class_add) {
    
    const cor_fundo_box = getComputedStyle(this.el).backgroundColor
    
    const style_padrao = {
      position:"absolute",
      padding: "1rem",
      top:"0",
      left:"0",
      fontSize: "smaller",
      borderRadius: this.el.style.borderRadius ? this.el.style.borderRadius : "10px",
      background: cor_fundo_box,
      transition: "all 200ms ease-in-out",
    }
    let style_titulo = style_padrao

    if (style) {
      style_titulo = Object.assign(style_padrao, style)
    }

    const titulo = div(this.el, style_titulo, class_add, texto)

    if (texto.length === 5) {
      titulo.innerText = trata_titulo_mes_scorecard(texto)
    } else {
      titulo.innerText = texto
    }
    titulo.classList.add("titulo-box-seg-qua")
    titulo.classList.add(texto.replace(/ /g,"_"))

    this.el.append(titulo)
    this.el.style.paddingTop = "6rem"
    this.el.style.paddingBottom = "4rem"

    // simularSticky(this.el, titulo)
    
    return titulo
  }

  inserir_pelicula(tipo="clara") {

    if (this.pelicula_da_box) return this.pelicula_da_box

    const cor = (tipo==="clara") ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"
    this.pelicula_da_box = div(this.el,{
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      background: cor,
      borderRadius: "inherit",
    })
    return this.pelicula_da_box

  }

  remover_pelicula_da_box() {
    if (this.pelicula_da_box) this.pelicula_da_box.remove()
    this.pelicula_da_box = undefined
  }

}