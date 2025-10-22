//Plantilla de confirmacion de cita medica via WhatsApp usando la API de Meta
//entradas: datosCita(paciente_nombre, especialidad_snap, fecha_hora, numero_telefono)

process.loadEnvFile('../.env');

const TOKEN = process.env.WSP_TOKEN || 'EAAPcFHLFxk4BPgbS4RKu4Qy5AUSlRDC2kAKDPb3mrcOvZC7Qr8RUTUvjPdHna9ZBxfUTiA0ZADed3ZBjDFAeltxHAZA0WWBO5luwqklQ4lZBV2h7c3uphYQtsrOTqsC27v1ckZBgnKnZC3kZAT3tJx1fohhqsPcsx1IkEbCyuZBhaZBFy5JE97UlY7QWIVI12soUMbleAZDZD';
const GRAPH_BASE = process.env.GRAPH_BASE || 'https://graph.facebook.com/v23.0/733696073164766';
//Por alguna razon, al importar estas variables de entorno en este archivo, no funcionan correctamente en tiempo de ejecución, por lo que se definen valores por defecto arriba.
//console.log('GRAPH BASE EN confirmTemplate.js:', GRAPH_BASE);
//console.log('TOKEN EN confirmTemplate.js:', TOKEN);

function rellenadoDatos (nombrePaciente, especialidad, fechaCita, horaCita, numeroPaciente) {
    const payload = {
        messaging_product: "whatsapp",
        to: numeroPaciente, //número destino  #Numero vicho: 56966484260  ,Numero Ale: 56955333737
        type: "template",
        template: {
            name: "confirmacion_cita_medica", // nombre EXACTO como aparece en Business Manager
            language: { code: "es" },       // o "es" según como la aprobaste
            components: [
            {
                type: "body",
                parameters: [
                { type: "text", text: nombrePaciente },
                { type: "text", text: especialidad },
                { type: "text", text: fechaCita },
                { type: "text", text: horaCita },
                { type: "text", text: "Hospital Gustavo Fricke - Endoscopia" }
                ]
            }
            ]
        }
        };
    return JSON.stringify(payload)
}


export async function sendConfirmation(datosCitas) {
   
 /*
 console.log('Datos para enviar confirmacion:', datosCitas[0])
 console.log('Numero paciente:', datosCitas[0].paciente_telefono)
 console.log('Nombre paciente:', datosCitas[0].paciente_nombre)
 console.log('Nombre medico:', datosCitas[0].especialidad_snap)
 console.log('Fecha y hora cita:', datosCitas[0].fecha_hora[0], datosCitas[0].fecha_hora[1])
 */
  try {
    
    datosCitas.forEach(async cita => {  //Aca se itera por cada cita en el array de citas para enviar el mensaje individualmente
      const response = await fetch(`${GRAPH_BASE}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: rellenadoDatos(cita.paciente_nombre, cita.especialidad_snap, cita.fecha_hora[0], cita.fecha_hora[1], cita.paciente_telefono)
      
  
      });
    
      const data = await response.json();

    });
     
    
    //console.log("Respuesta de Meta:", data);
  } catch (error) {
    console.error("Error enviando plantilla:", error);
  }
}