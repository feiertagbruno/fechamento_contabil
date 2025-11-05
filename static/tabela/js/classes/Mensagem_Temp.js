
import { mouse_esta_sobre, style } from "../global_functions.js";
import { Box } from "./Box.js";


export class Mensagem_Temporaria {
  /**
   * 
   * @param {"temp_erro"|"temp_info"|"temp_sucesso"} tipo 
   * @param {string} texto 
   * @param {number} tempo - qtd de segundos para começar o fade-out
   */
  constructor(tipo, texto, segundos=3) {

    this.transition_sec = 2
    this.segundos = segundos

    // IDENTIFICAR OUTRAS MENSAGENS TEMPORARIAS PARA ADAPTAR A ALTURA
    const mensagens = document.querySelectorAll("[name='mensagem_temporaria']")
    let maior_mensagem = 0
    if (mensagens.length) {
      mensagens.forEach((mens) => {
        if ((mens.offsetTop + mens.offsetHeight) > maior_mensagem) {
          maior_mensagem = mens.offsetTop + mens.offsetHeight
        }
      })
    }

    let style_mens = {
      transition: `all ${this.transition_sec}s ease-in-out`,
      zIndex: "99999",
    }
    if (maior_mensagem) {
      style_mens = {
        ...style_mens,
        top: maior_mensagem + 10 + "px"
      }
    }
    
    const box_cls = new Box(
      tipo, document.body, style_mens, 
      undefined, texto, undefined, undefined, "mensagem_temporaria"
    )
    this.btn_fechar = box_cls.botao_fechar()
    this.box = box_cls.el

    box_cls.el.addEventListener("mouseleave", () => this.#evento_mouseleave())

    if (!mouse_esta_sobre(this.box)) this.#evento_mouseleave()

    box_cls.el.addEventListener("mouseenter", () => {
      if (this.gradual) clearTimeout(this.gradual)
      if (this.close) clearTimeout(this.close)
      style(this.box,{transition: ""})
      setTimeout(() => {
        style(this.box, {
          opacity: "1",
          transition: `all ${this.transition_sec}s ease-in-out`,
        })
      }, 100)
      this.box.style.opacity = "1"
    })
      
  }

  #evento_mouseleave() {
    this.gradual = setTimeout(() => {
      style(this.box,{opacity: "0"})
      this.close = setTimeout(() => {
        this.btn_fechar.click()
      },(this.transition_sec*1000) + 50 )
    },this.segundos * 1000)
  }

}