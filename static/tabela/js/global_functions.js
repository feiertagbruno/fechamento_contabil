/**
 * 
 * @param {HTMLElement} append_el - Elemento para appendar a div que será criada.
 * @param {Partial<CSSStyleDeclaration>} styles
 * @param {Array | String | undefined} class_add
 * @param {String | undefined} text - texto do innerText, 
 * se encontrar "<" e ">" vai para o innerHTML
 * @param {"beforebegin" | "afterbegin" | "beforeend" | "afterend"} tipo_insercao
 * @returns {HTMLElement}
 */

export function div(append_el, styles, class_add, text, tipo_insercao="beforeend", id, name) {
	const div_el = document.createElement("div")

	if (styles) {
		for (const [sty, sty_text] of Object.entries(styles)) {
			div_el.style[sty] = sty_text
		}
	}

	if (append_el) {
		append_el.insertAdjacentElement(tipo_insercao,div_el)
	}

	if (class_add) {
		if (Array.isArray(class_add)) {
			for (const cl of class_add) {
				div_el.classList.add(cl)
			}
		} else {
			div_el.classList.add(class_add)
		}
	}

	if (text) {
		if (String(text).includes("<") && String(text).includes(">")) {
			div_el.innerHTML = text
		} else {
			div_el.innerText = text
		}
	}

	if (id) {
		if (document.getElementById(id)) {
			console.info(`O id ${id} não foi inserido por já estar sendo usando por outro elemento.`)
		} else {
			div_el.id = id
		}
	}

	if (name) div_el.setAttribute("name", name)

	return div_el
}

/**
 * 
 * @param {HTMLElement} append_el - Elemento para appendar a div que será criada.
 * @param {Partial<CSSStyleDeclaration>} styles
 * @param {Array | String | undefined} class_add
 * @param {*} value - é o que vai no value
 * @param {"beforebegin" | "afterbegin" | "beforeend" | "afterend"} tipo_insercao
 * @returns {HTMLElement}
 */

export function input_element(append_el, styles, class_add, value, tipo_insercao="beforeend", type="text", id, name) {
	const div_el = document.createElement("input")
	div_el.type = type

	if (styles) {
		for (const [sty, sty_text] of Object.entries(styles)) {
			div_el.style[sty] = sty_text
		}
	}

	if (append_el) {
		append_el.insertAdjacentElement(tipo_insercao,div_el)
	}

	if (class_add) {
		if (Array.isArray(class_add)) {
			for (const cl of class_add) {
				div_el.classList.add(cl)
			}
		} else {
			div_el.classList.add(class_add)
		}
	}

	if (value) {
		if (type === "checkbox") {
			div_el.checked = value
		} else {
		div_el.value = value
		}
	}
	if (id) div_el.id = id
	if (name) div_el.name = name

	return div_el
}


/**
 * 
 * @param {HTMLElement} box - onde ele será inserido
 * @param {Partial<CSSStyleDeclaration>} estilo
 * @param {string} texto - texto para o label
 * @param {string} id_para_for - será colocado no atributo for, deve ser o id de um input
 * @param {"beforebegin" | "afterbegin" | "beforeend" | "afterend"} tipo_insercao
 * @returns 
 */
export function label(box, estilo, texto, id_para_for, tipo_insercao="beforeend") {
	const label = document.createElement("label")

	if (estilo && Object.keys(estilo).length > 0) {
		style(label,estilo)
	}

	if (texto) label.innerText = texto

	if (id_para_for) label.setAttribute("for",id_para_for)

	box.insertAdjacentElement(tipo_insercao,label)

	return label
}

export async function funcao_fetch(url, body) {

	const info_fetch = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCSRFToken()
    }
	}

	let body_ok = {...info_fetch}
	if (body) body_ok = Object.assign(body_ok,{
		body: JSON.stringify(body)
	})

	const response = await fetch(url,body_ok)

	return response
}


export function getCSRFToken() {
	const cookieValue = document.cookie
			.split('; ')
			.find(row => row.startsWith('csrftoken='));
	return cookieValue ? cookieValue.split('=')[1] : '';
}


export function getAnoMesAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  return `${ano}-${mes}`;
}


export function getMesNome(mes) {
  const nomes = [
    "janeiro","fevereiro","março","abril","maio","junho",
    "julho","agosto","setembro","outubro","novembro","dezembro"
  ];
  
  const nome = nomes[Number(mes) - 1] || "";
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

export function mouse_esta_sobre(element) {
  setTimeout(() => {
    const elNoTopo = document.elementFromPoint(mouseX, mouseY);
    return element.contains(elNoTopo);
  }, 200)
};

/**
 * 
 * @param {HTMLElement} el 
 * @param {Partial<CSSStyleDeclaration>} styles
 */
export function style(el, styles, class_add) {
	if (styles) {
		for (const [sty, sty_text] of Object.entries(styles)) {
			el.style[sty] = sty_text
		}
	}
	if (class_add) {
		if (Array.isArray(class_add)) {
			for (const cl of class_add) {
				el.classList.add(cl)
			}
		} else {
			el.classList.add(class_add)
		}
	}
}

export function validacao_dados_do_fetch(dados, texto_erro) {
  if (!dados.sucesso | dados.erro) {
    throw new Error(dados.erro || texto_erro)
  }

  if (dados.info) {
    new Mensagem_Temporaria("temp_info",dados.info)
  }

  if (dados.msg_sucesso) {
    new Mensagem_Temporaria("temp_sucesso", dados.msg_sucesso)
  }
}

/**
 * 
 * @param {"modo_curto"|"local"|"utc"|"completo"|"brasileiro"} tipo 
 */
export function trata_fuso_da_data(data, tipo) {
	
	if (!data | !String(data).trim()) return data
	data = String(data).trim()

	let data_tratada		

	if (data.includes("T")) {
		data_tratada = data.split("T")[0]
	} else if (data.includes(" ")) {
		data_tratada = data.split(" ")[0]
	} else {
		data_tratada = data
	}

	if (tipo === "utc") {
		const fuso = new Date().getTimezoneOffset()/60
		const texto_fuso = String(fuso).padStart(2,"0") + ":00:00.000Z"
		return data_tratada + "T" + texto_fuso
	} else if (tipo === "local") {
		return data_tratada + "T00:00:00"
	} else if (tipo === "modo_curto") {
		return data_tratada
	} else if (tipo === "completo") {
		let dia_semana = dia_da_semana(new Date(trata_fuso_da_data(data,"utc")).getDay(),"curto")
		return dia_semana + " - " + trata_fuso_da_data(data_tratada,"brasileiro")
	} else if (tipo === "brasileiro") {
		let data_modo_curto = data_tratada
		if (data_modo_curto.length > 10) {
			data_modo_curto = trata_fuso_da_data(data_modo_curto,"modo_curto")
		}
		const [ano, mes, dia] = data_modo_curto.split("-")
		return `${dia}/${mes}/${ano}`
	} else {
		throw new Error("Tipo de fuso inválido. Use 'modo_curto', 'fuso' ou 'utc'.")
	}
}

/**
 * 
 * @param {number} day - Número do dia da semana 0 a 6
 * @param {"curto"|"completo"} tipo 
 * @returns 
 */
export function dia_da_semana(day,tipo="completo") {
	let texto
	if (day === 0) {
		texto = "Domingo"
	} else if (day === 1) {
		texto = "Segunda-Feira"
	} else if (day === 2) {
		texto = "Terça-Feira"
	} else if (day === 3) {
		texto = "Quarta-Feira"
	} else if (day === 4) {
		texto = "Quinta-Feira"
	} else if (day === 5) {
		texto = "Sexta-Feira"
	} else if (day === 6) {
		texto = "Sábado"
	}

	if (tipo === "curto") {
		return texto.split("-")[0]
	} else {
		return texto
	}

}

export function mesAnterior(anoMes) {
  let [ano, mes] = anoMes.split("-").map(Number);
  mes--;
  if (mes === 0) {
    mes = 12;
    ano--;
  }
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

export function inserir_tres_pontinhos(box) {
	box.innerHTML = ""
	box.style.position = "relative"
	const main = div(box,undefined,"tres-pontinhos")
	div(main, undefined, ["pontinho", "pontinho1"], ".")
	div(main, undefined, ["pontinho", "pontinho2"], ".")
	div(main, undefined, ["pontinho", "pontinho3"], ".")
}