//Funcion que envia el mensaje a traves de la API de Meta
//Entradas: payload: objeto con el cuerpo del mensaje a enviar

process.loadEnvFile('../../.env');

const TOKEN = process.env.WSP_TOKEN
const GRAPH_BASE = process.env.GRAPH_BASE

export async function enviarMensaje(payload){
    try {
      console.log("fetch graph_base",GRAPH_BASE);
      const response = await fetch(`${GRAPH_BASE}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: payload
      
  
      });
      
      const data = await response.json();
      console.log("Respuesta de Meta: al enviar plantilla", data);
    } catch (error) {
        console.error("Error enviando plantilla:", error);
    }
}