let versao_iDB = 2

export function salvar_base_no_indexedDB(nome_bd,versao,obj,nome_base,indexes) {
  const request = indexedDB.open(nome_bd,versao)

  request.onerror = e => {
    console.error("Erro ao salvar no indexedDB")
    console.error(e)
  }

  request.onupgradeneeded = () => {
    const db = request.result
    const store = db.createObjectStore(nome_base,{keyPath:"id",autoIncrement:true})
    for (let [nome_index, cols_index] of indexes) {
      store.createIndex(nome_index,cols_index)
    }
  }

  request.onsuccess = () => {
    const db = request.result
    const tx = db.transaction(nome_base, "readwrite")
    const store = tx.objectStore(nome_base)

    for (let row of obj) {
      store.add(row)
    }

    tx.oncomplete = () => {
      db.close()
    }

    tx.onerror = () => {
      console.error(`Erro ao salvar registros da base ${nome_base}.`)
    }
  }

}


export function salvar_ou_adicionar_no_indexedDB(nome_bd, versao, obj, nome_base, indexes) {
  const request = indexedDB.open(nome_bd, versao);

  request.onerror = e => {
    console.error("Erro ao salvar no indexedDB");
    console.error(e);
  };

  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(nome_base)) {
      const store = db.createObjectStore(nome_base, { keyPath: "id", autoIncrement: true });
      for (let [nome_index, cols_index] of indexes) {
        store.createIndex(nome_index, cols_index);
      }
    }
  };

  request.onsuccess = () => {
    const db = request.result;
    const tx = db.transaction(nome_base, "readwrite");
    const store = tx.objectStore(nome_base);

    for (let row of obj) {
      store.add(row);
    }

    tx.oncomplete = () => db.close();

    tx.onerror = e => {
      console.error(`Erro ao salvar registros da base ${nome_base}.`, e);
    };
  };
}



/**
 * 
 * @param {String} nome_db 
 * @param {String} nome_base 
 * @param {String} nome_index 
 * @param {Array} valores_index 
 * @returns 
 */
export function buscar_no_indexedDB(nome_db,nome_base,nome_index,valores_index,colunas) {
  return new Promise((resolve, reject) => {

    const request = indexedDB.open(nome_db)

    request.onerror = () => reject(
      `buscar_no_indexedDB: Erro em request.onerror da base ${nome_base}, index ${nome_index}.`
    )

    request.onsuccess = () => {
      try {

        const db = request.result
        const tx = db.transaction(nome_base,"readonly")
        const store = tx.objectStore(nome_base)
        let index
        if (nome_index !== undefined) {
          index = store.index(nome_index)
        } else {
          index = "all"
          valores_index = ["all"]
        }
  
        const promises = valores_index.map(val_index => {
          return new Promise((res,rej) => {
            let getRequest
            if (index === "all") {
              getRequest = store.getAll()
            } else {
              getRequest = index.getAll(val_index)
            }
  
            getRequest.onerror = () => rej(
              `buscar_no_indexedDB: Erro em getRequest index ${nome_index}, valor ${val_index}.`
            )
  
            getRequest.onsuccess = () => {
              if (colunas === undefined) {
                res(getRequest.result)
              } else {
                const r = getRequest.result.reduce((acc, row) => {
                  const row_cols = {}
                  for (const col of Object.keys(row)) {
                    if (colunas.includes(col)) row_cols[col] = row[col]
                  }
                  acc.push(row_cols)
                  return acc
                },[])
                res(r)
              }
            }
  
          })
        })
  
        Promise.all(promises)
          .then(resultados => {
            const resultado = resultados.flat()
            resolve(resultado)
          })
          .catch(() => reject(
            `Erro em Promise.all nome_base ${nome_base}, nome_index ${nome_index}`
          ))

      } catch (e) {
        console.error("Erro ao buscar no indexedDB:", e)
        reject(`Erro ao buscar no indexedDB: ${e.message}`)
      }

    }

  })
}


export function pegar_versao_iDB(subir_nivel) {
  const versao = versao_iDB
  if (subir_nivel) versao_iDB++
  return versao
}


export function exportar_base_para_excel(base, nome) {
  // eslint-disable-next-line no-undef
  const worksheet = XLSX.utils.json_to_sheet(base)
  // eslint-disable-next-line no-undef
  const workbook = XLSX.utils.book_new()
  // eslint-disable-next-line no-undef
  XLSX.utils.book_append_sheet(workbook, worksheet, nome)
  // eslint-disable-next-line no-undef
  XLSX.writeFile(workbook, `${nome}.xlsx`)
}

/**
 * 
 * @param {String} nome_db - nome do banco, ex "scorecard"
 * @param {*} nome_base - nome da base, ex "arm98" ou "Prancha_iap"
 * @param {*} nome_index - nome do index, ex "mes" ou "semana" ou "cod_semana"
 * @param {*} valor_index - valor do index, ex "25-w17" ou ["MEX1808","25-w17"]
 * @param {*} valores_salvar - objeto => key: val ==>
 * key é o nome da coluna, val é o valor para salvar no indexedDB
 */
export function alterar_registro_no_indexedDB(nome_db, nome_base, nome_index, valor_index, valores_salvar) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(nome_db)

    request.onerror = () => reject(`Erro ao abrir o indexedDB ${nome_db}: ${request.error}`)

    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction(nome_base, "readwrite")
      const store = tx.objectStore(nome_base)
      const index = store.index(nome_index)

      const getAll = index.getAll(valor_index)

      getAll.onerror = () => reject(`Erro em index.getAll index ${nome_index}, valor_index ${valor_index}`)

      getAll.onsuccess = () => {
        
        const registros = getAll.result
        
        if (!registros.length) reject(`Nenhum registro encontrado no index ${nome_index}, valor_index ${valor_index}`)

        registros.forEach(reg => {
          for (let [coluna, info] of Object.entries(valores_salvar)) {
            reg[coluna] = info
          }
          store.put(reg)
        })

        tx.oncomplete = () => resolve()

      }

    }
  })
}


/**
 * 
 * @param {String} nome_db 
 * @param {String} nome_base 
 * @param {String} nome_index 
 * @returns 
 */
export function buscar_index_keys(nome_db, nome_base, nome_index) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(nome_db)

    request.onerror = () => reject(`Erro em indexedDB.open(${nome_db}): ${request.error}`)

    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction(nome_base,"readonly")
      const store = tx.objectStore(nome_base)
      const index = store.index(nome_index)

      const keys = new Set()
      const cursor_request = index.openKeyCursor()

      cursor_request.onerror = () => reject(`Erro em index.openKeyCursor(): ${cursor_request.error}`)

      cursor_request.onsuccess = () => {
        const cursor = cursor_request.result
        if (cursor) {
          keys.add(cursor.key)
          cursor.continue()
        } else {
          resolve([...keys])
        }
      }

    }

  })  
}


/**
 * 
 * @param {String} nome_db exemplo: "scorecard"
 * @param {String} nome_tb exemplo: "planac_arm98" ou "arm98"
 * @param {Object} info exemplo: {"codigo": "MEX1808", "semana": "25-w17"}
 * @returns 
 */
export function salvar_info_no_indexedDB(nome_db, nome_tb, info) {
  
  const request = indexedDB.open(nome_db)

  request.onerror = () => {throw new Error(request.error)}

  request.onsuccess = () => {
    const db = request.result
    const tx = db.transaction(nome_tb,"readwrite")
    const store = tx.objectStore(nome_tb)
    store.add(info)
  }

}


export function existe_tabela(nome_bd, nome_tb) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(nome_bd);

    req.onsuccess = () => {
      const db = req.result;
      const existe = db.objectStoreNames.contains(nome_tb);
      db.close();
      resolve(existe);
    };

    req.onerror = () => reject(req.error);
  });
}
