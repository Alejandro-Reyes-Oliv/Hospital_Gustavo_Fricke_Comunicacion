//Plantilla con informacion para la cita medica (Una vez confirmada la asistencia) via WhatsApp usando la API de Meta
//entradas: datosCita(fecha_hora, numero_telefono)
process.loadEnvFile('../../.env');

const TOKEN = process.env.WSP_TOKEN 
const GRAPH_BASE = process.env.GRAPH_BASE 
const TEMPLATE = process.env.CONFIRMADA_TEMPLATE_END
//console.log('TEMPLATE EN informationTemplate.js:', TEMPLATE);
//console.log('GRAPH BASE EN informationTemplate.js:', GRAPH_BASE);
//console.log('TOKEN EN informationTemplate.js:', TOKEN);
const fechaCita ='25 de Diciembre de 2025'
const horaCita ='15:30'
const numeroPaciente ='56955333737'
export function rellenadoDatosInformacion (fechaCita, horaCita, numeroPaciente) {
    
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
                parameters: [
                { type: "text", text: fechaCita },
                { type: "text", text: horaCita },
                ]
            }
            ]
        }
        };
    return JSON.stringify(payload)
}


async function sendInformation() {
  try {
      console.log("fetch graph_base",GRAPH_BASE);
      const response = await fetch(`${GRAPH_BASE}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: rellenadoDatosInformacion(fechaCita, horaCita, numeroPaciente)
      
  
      });
      
      const data = await response.json();
      console.log("Respuesta de Meta: al enviar plantilla", data);
  } catch (error) {
    console.error("Error enviando plantilla:", error);
  }
}
//sendConfirmation();