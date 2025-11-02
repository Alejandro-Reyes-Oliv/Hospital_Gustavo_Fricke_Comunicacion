//Aca se  encontrara la logica para guardar las respuestas de los usuarios que presionan los botones en los mensajes de confirmacion de citas

//import { cambiarEstadoCita } from "../services/confirmationMessageService.js";





//----------------------------------------Guardado de la respuesta del usuario en la DB-------------------------------------------
//Funcion que guarda la respuesta del usuario en la DB
//Entradas: req: objeto de la peticion con el body que contiene la informacion del usuario que respondio el boton proveniente del webhook 
//Llama a: cambiarEstadoCita de confirmationMessageService.js para cambiar el estado de la cita segun la respuesta del usuario
/*
export async function guardarRespuestaUsuario(req, res){
    try{
        const from = req.body.entry[0].changes[0].value.messages[0].from;
        const reply = (req.body.entry[0].changes[0].value.messages[0].button.payload).toLowerCase();
        const wamid = req.body.entry[0].changes[0].value.messages[0].context.id;
        const timestamp = req.body.entry[0].changes[0].value.messages[0].timestamp;
        //validar que el wamid no exista ya en la DB para evitar duplicados

        cambiarEstadoCita(wamid, reply);
        console.log(`Respuesta del usuario ${from} con wamid ${wamid} y respuesta ${reply} guardada correctamente.`);
        res.status(200).send('Respuesta guardada correctamente');
    }catch (error){
        console.error(`Error al guardar la respuesta del usuario ${from} con wamid ${wamid}: `, error);
        res.status(500).send('Error al guardar la respuesta');
    }

}
    */