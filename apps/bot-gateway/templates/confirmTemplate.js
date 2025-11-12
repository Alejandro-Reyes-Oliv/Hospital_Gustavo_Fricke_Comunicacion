//Plantilla de confirmacion de cita medica via WhatsApp usando la API de Meta
//To Do: Hacer que solo sea la plantilla y el fetch se haga en el service o controller ---------------------
//entradas: datosCita(paciente_nombre, especialidad_snap, fecha_hora, numero_telefono)
//process.loadEnvFile('/../../.env');



const TOKEN = process.env.WSP_TOKEN 
const GRAPH_BASE = process.env.GRAPH_BASE 
const TEMPLATE = process.env.CONFIRM_TEMPLATE_END
console.log('TEMPLATE EN confirmTemplate.js:', TEMPLATE);
//console.log('GRAPH BASE EN confirmTemplate.js:', GRAPH_BASE);
//console.log('TOKEN EN confirmTemplate.js:', TOKEN);

export function rellenadoDatos (nombrePaciente, especialidad, fechaCita, horaCita, numeroPaciente) {
    
    const payload = {
        messaging_product: "whatsapp",
        to: numeroPaciente, //número destino  #Numero vicho: 56966484260  ,Numero Ale: 56955333737
        type: "template",
        template: {
            name: TEMPLATE, // nombre EXACTO como aparece en Business Manager
            language: { code: "es" },       // o "es" según como la aprobaste
            components: [
            {
                type: "body",
                parameters: [
                { type: "text", text: nombrePaciente },
                { type: "text", text: especialidad },
                { type: "text", text: fechaCita },
                { type: "text", text: horaCita },
                { type: "text", text: "Hospital Gustavo Fricke" }
                ]
            }
            ]
        }
        };
    return JSON.stringify(payload)
}

/*
export async function sendConfirmation(datosCitas) {
   
 /*
 console.log('Datos para enviar confirmacion:', datosCitas[0])
 console.log('Numero paciente:', datosCitas[0].paciente_telefono)
 console.log('Nombre paciente:', datosCitas[0].paciente_nombre)
 console.log('Nombre medico:', datosCitas[0].especialidad_snap)
 console.log('Fecha y hora cita:', datosCitas[0].fecha_hora[0], datosCitas[0].fecha_hora[1])
 
  try {
    //Para no delegarle tanta responsabilidad a la template, deberia solo devovler la funcion de rellenadoDatos y hacer el fetch en otro lado, por ejemplo en el controller y service
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
      //console.log("Respuesta de Meta: al enviar plantilla", data);
      //Con la data se puede guardar el ID del mensaje enviado en la base de datos de las citas para asociar el id y el mensaje
      const wamid_envio = data.messages[0].id;
      const idCita = cita.id; //Aca se obtiene la id de la cita actual en la iteracion
      //Llamar a la funcion para guardar el ID del mensaje enviado en la DB
      await asociarMensajeCita(wamid_envio, idCita);
      
      
      //To Do: Hacer que retorne o una lista o por ejemplo unir tanto el wamid con el id cita y retornar una lsita con todos y luego en otro lado separarlos y asociarlos
      
      //console.log("Wamid del mensaje enviado: ", wamid_envio);
      //console.log("ID de cita: ", idCita);
      

      
    });
     
    
    //console.log("Respuesta de Meta:", data);
  } catch (error) {
    console.error("Error enviando plantilla:", error);
  }
}
*/