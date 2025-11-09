//Plantilla de cancelacion por parte del paciente de cita medica via WhatsApp usando la API de Meta
//entradas: datosCita(numero_telefono)

process.loadEnvFile('../../../.env');
const TOKEN = process.env.WSP_TOKEN 
const GRAPH_BASE = process.env.GRAPH_BASE 
const TEMPLATE = process.env.CANCELADA_TEMPLATE_END
console.log('TEMPLATE EN confirmTemplate.js:', TEMPLATE);
//console.log('GRAPH BASE EN confirmTemplate.js:', GRAPH_BASE);
//console.log('TOKEN EN confirmTemplate.js:', TOKEN);
const numeroPaciente ='56973882698'
export function rellenadoDatosPacienteCancela (numeroPaciente) {
    
    const payload = {
        messaging_product: "whatsapp",
        to: numeroPaciente, 
        type: "template",
        template: {
            name: TEMPLATE, 
            language: { code: "es" },       
            components: [
            {
                type: "body",
                parameters: []
            }
            ]
        }
        };
    return JSON.stringify(payload)
}

async function sendCancelacion() {
   

 
  try {
    //Para no delegarle tanta responsabilidad a la template, deberia solo devovler la funcion de rellenadoDatos y hacer el fetch en otro lado, por ejemplo en el controller y service
    
      
      console.log("fetch graph_base",GRAPH_BASE);
      const response = await fetch(`${GRAPH_BASE}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: rellenadoDatosPacienteCancela(numeroPaciente)
      
  
      });
      
      const data = await response.json();
      console.log("Respuesta de Meta: al enviar plantilla", data);
      //Con la data se puede guardar el ID del mensaje enviado en la base de datos de las citas para asociar el id y el mensaje
      const wamid_envio = data.messages[0].id;
      const idCita = cita.id; //Aca se obtiene la id de la cita actual en la iteracion
      //Llamar a la funcion para guardar el ID del mensaje enviado en la DB
      //await asociarMensajeCita(wamid_envio, idCita);
      
      
      //To Do: Hacer que retorne o una lista o por ejemplo unir tanto el wamid con el id cita y retornar una lsita con todos y luego en otro lado separarlos y asociarlos
      
      //console.log("Wamid del mensaje enviado: ", wamid_envio);
      //console.log("ID de cita: ", idCita);

    //console.log("Respuesta de Meta:", data);
  } catch (error) {
    console.error("Error enviando plantilla:", error);
  }
}
sendCancelacion();