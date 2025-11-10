//Aqui se vera toda la logica relacionada con el envio de mensajes de confirmacion a traves del boton
import {prisma} from '../config/prisma.js';
import { styleText } from 'node:util';

//----------------------------------------Obtencion de datos de cita y llenado de mensaje-------------------------------------------
//Funcion que obtiene los datos de la cita a traves del id de la cita
//Entradas: ids = [id1, id2, id3...]  (Array de id's de las citas)
//Salida: Array con el telefono, nombre del paciente, especialidad, fecha de la cita y la id para luego asociarlo al mensaje


export async function obtenerDatosCita(ids = []){
    ids = ids.map(id => parseInt(id));  //Convertir todos los ids en numericos, ya que entran como strings
    //Con el map se asegura que se ejecute la funcion para cada id en el array
    try{
        if (ids.length === 0){ //Si es que no se proporcionan IDs, retornar array vacio. No deberia pasar, ya que desde el front se bloquea el boton si no se tiene seleccionado al menos una cita
            console.warn('No se proporcionaron IDs de citas');
            return [];
        }
        const datosCitas = await prisma.cita.findMany({  //Se guarda en datosCitas toda la informacion obtenida de la DB (telefono, nombre, especialidad y fecha de las ids entrantes)
            where : {
                id: { in: ids },
            },
            select: {
                    paciente_telefono: true,
                    paciente_nombre: true,
                    especialidad_snap : true,
                    fecha_hora: true,
                    id:true
                }
        })
        //- - - - - - - - - - - - - - - - - - - - -  - - - - - - Mapeos y formateos de fecha y hora - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
        //Limpieza de la fecha y hora para que quede en formato legible
        //Entrada: 2025-11-11T02:00:00.000Z
        //Salida: ['2025-Nov-11', '02:00']
        datosCitas.forEach(fecha => { //Aca se hace el formateo de cada fecha obtenida, ya que en la base de datos esta contenida en un formato poco legible e.j(2025-11-09 00:00:00-03)
            fecha.fecha_hora = fecha.fecha_hora.toString().split(" "); //Al convertir a string y hacer split por espacios, queda un array con ['Mon', 'Nov', '10', '2025', '02:00:00', 'GMT-0300', '(hora', 'de','verano', 'de', 'Chile)']
            fecha.fecha_hora = fecha.fecha_hora[3] + "-" + fecha.fecha_hora[1] + "-" + fecha.fecha_hora[2] + " " + fecha.fecha_hora[4].slice(0,5); //Aca se reordena la fecha a formato 'AAAA-MM-DD HH:MM' e.j (2025-11-11 02:00)
            fecha.fecha_hora = fecha.fecha_hora.split(" "); //Aca retorna un array que contiene [fecha] [hora] e.j (['2025-11-11', '02:00'] 
        }); 
        
        datosCitas.forEach(cita => {
            cita.fecha_hora[0] = mapearFecha(cita.fecha_hora[0]); //Mapear la fecha a formato legible e.j (11 de noviembre de 2025)
            cita.fecha_hora[1] = cita.fecha_hora[1].slice(0,5); //Dejar solo la hora en formato HH:MM e.j (00:01)
            //console.log("Fecha mapeada: ", cita.fecha_hora[0], " Hora mapeada: ", cita.fecha_hora[1]);
        });
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - Formateo de numero telefonico - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        //Formateo del numero telefonico para que sea compatible con el API de WhatsApp Business (Debe incluir codigo de pais, en este caso 56 para Chile)
        //Entrada: numero telefonico en formato string e.j '912345678' o '56912345678'
        //Salida: numero telefonico en formato string e.j '56912345678'
 
        datosCitas.forEach(numero => {
            if (numero.paciente_telefono.length == 10 || numero.paciente_telefono.length >= 13 || numero.paciente_telefono.length <= 8) {
                console.warn(`El numero telefonico ${numero.paciente_telefono} tiene una longitud invalida.`);
                return [];
            }
            if (!numero.paciente_telefono.startsWith('56') && numero.paciente_telefono.length === 9) {
                numero.paciente_telefono = '56' + numero.paciente_telefono;
            }
            /*
            if (!numero.paciente_telefono.startsWith('56') && numero.paciente_telefono.length === 8) {
                numero.paciente_telefono = '569' + numero.paciente_telefono;
            }
            */
        });
        
        return datosCitas;

    }catch (error){
        console.error('Error al obtener los datos de la cita: ', error);
    }
}


//----------------------------------------Funcion de mapeado de fecha-------------------------------------
//Funcion que mapea la fecha desde el formato AAAA-MM-DD al formato "DD de mes de AAAA"
//Entrada: fechaStr = "AAAA-MM-DD"
//Salida: "DD de mes de AAAA"
function mapearFecha(fechaStr) {
    const meses = {
        "Jan": "enero",
        "Feb": "febrero",
        "Mar": "marzo",
        "Apr": "abril",
        "May": "mayo",
        "Jun": "junio",
        "Jul": "julio",
        "Aug": "agosto",
        "Sep": "septiembre",
        "Oct": "octubre",
        "Nov": "noviembre",
        "Dec": "diciembre"
    }
    const [year, month, day] = fechaStr.split('-');
    return `${day} de ${meses[month]} de ${year}`;
}

//----------------------------------------Mapeado de respuestas de cita--------------------------------------------
//Funcion que mapea las respuestas del usuario desde el payload del boton al estado de la cita
//Entrada: respuesta = 'confirmar' o 'cancelar'
//Salida: 'confirmada' o 'cancelada'
function mapearRepuesta(respuesta){
    const respuestaMapeada = {
        'confirmar' : 'confirmada',
        'cancelar' : 'cancelada',
        'no asistiré' : 'cancelada',
        'asistiré' : 'confirmada'
    }
    return respuestaMapeada[respuesta];
}
//----------------------------------------Mapeado de estados de mensaje--------------------------------------------
//Funcion que mapea los estados del mensaje recibidos por el webhook al español
//Entrada: estado = 'sent', 'delivered', 'read'
//Salida: 'enviado', 'entregado', 'leido'
function mapearEstado(estado){
    const estadoMapeado = {
        'sent' : 'enviado',
        'delivered' : 'recibido',
        'read' : 'leido'
    }
    return estadoMapeado[estado];
    
}

//----------------------------------------Guardado de id de mensaje enviado en cita-------------------------------------------
//Funcion que guarda el ID del mensaje enviado en la DB de citas para asociar el mensaje con la cita
//To Do: Cambiar el campo donde se guarda el ID del mensaje, ya que actualmente se esta guardando en paciente_rut por falta de un campo adecuado - - - - - - - - - - - - - - - - - -
//Entradas: wamid_envio: ID del mensaje enviado por Meta, idCita: ID de la cita
//Salida: Ninguna
export async function asociarMensajeCita(wamid_envio, idCita){
    try{
        await prisma.cita.update({
            where: { id: idCita },
            data: { paciente_rut: wamid_envio }  //Esto se tiene que cambiar - - - - - -- - -- - -- - -- - -- - -- - -- 
        });
        //console.log(`ID del mensaje ${wamid_envio} asociado a la cita ${idCita} correctamente.`);
    }catch(error){
        console.error('Error al asociar el ID del mensaje a la cita: ', error);
    }           
}

//----------------------------------------Buscar cita por wamid-------------------------------------------
//Funcion que busca la cita en la DB a traves del wamid del mensaje enviado
//Entradas: wamid: ID del mensaje enviado
//Salida: objeto cita con el ID de la cita e.j {id: 20}
async function buscarCitaPorWamid(wamid) {
    try {
        const cita = await prisma.cita.findFirst({
            where: { paciente_rut: wamid },
            select: {
                id: true,
            }
        });
        return cita;
    } catch (error) {
        console.error('Error al buscar la cita por wamid: ', error);
        return null;
    }
}

//----------------------------------------Cambio de estado de cita segun respuesta del paciente-------------------------------------------
//Funcion que cambia el estado de la cita segun la respuesta del paciente
//Entradas: wamid_contexto: ID del contexto del mensaje recibido (es decir, del mensaje al que se responde), respuesta: 'confirmada' o 'cancelada'
//Salida: Ninguna
export async function cambiarEstadoCita(wamid_contexto, respuesta){
    try{
        if (wamid_contexto ){
            const idCita = await buscarCitaPorWamid(wamid_contexto);
            const respuestaMapeada = mapearRepuesta(respuesta); //Mapear la respuesta del usuario a el estado de la cita
            console.log('Respuesta mapeada: ', respuestaMapeada);
            console.log("id del mensaje contexto: ", wamid_contexto)
            console.log("id de la cita obtenida: ", idCita.id);
            
            await prisma.cita.update({
                where: {id : idCita.id, paciente_rut: wamid_contexto }, //Buscar la cita por ID y por el wamid del mensaje al que se responde
                data: { estado: respuestaMapeada }
            });
        
        }
    }catch(error){
        console.error('Error al cambiar el estado de la cita (confirmada, cancelada): ', error);
    }
}

//----------------------------------------Cambio de estado de mensaje-------------------------------------------
//Funcion que cambia el estado del mensaje en la DB de mensajes segun el estado recibido por el webhook
//Entradas: wamid_enviado: ID del mensaje enviado (es decir, al presionar el boton de Enviar bot), estado: 'sent', 'delivered', 'read' (son los estados que devuelve directamente el webhook)
//Salida: Ninguna
export async function cambiarEstadoMensaje(wamid_enviado, estado){
    try{
        if (wamid_enviado){
            const idCita = await buscarCitaPorWamid(wamid_enviado);
            const estadoMapeado = mapearEstado(estado); //Mapear el estado del mensaje a español
            
            await prisma.cita.update({
                where: {id : idCita.id, paciente_rut: wamid_enviado }, //Buscar la cita por ID y por el wamid del mensaje enviado
                data: { estado: estadoMapeado }
            });
        }
        

    }catch(error){
        console.error('Error al cambiar el estado del mensaje (enviado, recivido, leido): ', error);
    }
}

