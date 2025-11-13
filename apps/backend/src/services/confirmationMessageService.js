//Aqui se vera toda la logica relacionada con el envio de mensajes de confirmacion a traves del boton
import { rellenadoDatosPacienteCancela} from '../../../bot-gateway/templates/pacienteCancelaTemplate.js';
import {prisma} from '../config/prisma.js';
import { styleText } from 'node:util';
import { rellenadoDatos } from '../../../bot-gateway/templates/confirmTemplate.js';
import { rellenadoDatosInformacion } from '../../../bot-gateway/templates/informationTemplate.js';
process.loadEnvFile('../../../.env');
//----------------------------------------Obtencion de datos de cita-------------------------------------------
//Funcion que obtiene los datos de la cita a traves del id de la cita
//Entradas: ids = [id1, id2, id3...]  (Array de id's de las citas)
//Salida: Array con el telefono, nombre del paciente, especialidad, fecha de la cita y la id para luego asociarlo al mensaje enviado e.j [{paciente_telefono: '56912345678', paciente_nombre: 'Juan Perez', especialidad_snap: 'Cardiologia', fecha_hora: ['2025-11-11', '10:00'], id: 1}, {...}, {...}]


export async function obtenerDatosCita(ids = []){
    console.log("IDs que entran a obtenerDatosCita: ", ids);
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
//Entrada: respuesta = 'confirmar' o 'cancelar' / 'no asistiré' o 'asistiré'
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

//----------------------------------------Mapeado de plantillas-------------------------------------------------------
//Funcion que mapea los nombres de las plantillas a enviar 
//Entrada: nombre de la plantilla de ejemplo
//Salida: nombre real de la plantilla a enviar
function mapearPlantilla(nombrePlantilla){
    const plantillaMapeada = {
        'confirmacion_cita' : process.env.CONFIRM_TEMPLATE_END,
        'informacion_cita' : process.env.CONFIRMADA_TEMPLATE_END,
        'cancelada_cita_paciente' : process.env.CANCELADA_TEMPLATE_END
    }
    return plantillaMapeada[nombrePlantilla];
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
export async function buscarCitaPorWamid(wamid) {
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
            
            const estadoActualCita = await obtenerEstadoCita(idCita.id); //Obtener el estado actual de la cita para evitar sobreescribir estados importantes ya que el flow es pendiente -> confirmada ó cancelada, si se recibe una no puede cambiarse a la otra
            console.log("Estado actual de la cita: ", estadoActualCita);
            if (estadoActualCita != 'confirmada' && estadoActualCita != 'cancelada' && estadoActualCita != 'recordado'){ //En este caso es cuando la cita aun no ha sido confirmada ni cancelada, se puede cambiar el estado
                await prisma.cita.update({
                    where: {id : idCita.id, paciente_rut: wamid_contexto }, //Buscar la cita por ID y por el wamid del mensaje al que se responde
                    data: { estado: respuestaMapeada }
                });
            }else{
                console.log("El estado de la cita ya es definitivo, no se puede cambiar");
                //En esta parte incluso se podria enviar un mensaje al usuario indicando que su cita ya fue confirmada o cancelada y no se puede cambiar
            }
            
        
        }
    }catch(error){
        console.error('Error al cambiar el estado de la cita (confirmada, cancelada): ', error);
    }
}

//----------------------------------------Cambio de estado de mensaje-------------------------------------------
//Funcion que cambia el estado del mensaje en la DB de mensajes segun el estado recibido por el webhook )
//Entradas: wamid_enviado: ID del mensaje enviado (es decir, al presionar el boton de Enviar bot), estado: 'sent', 'delivered', 'read' (son los estados que devuelve directamente el webhook)
//Salida: Ninguna
//Comentario: se puede hacer de mejor manera, pero por ahora funciona
export async function cambiarEstadoMensaje(wamid_enviado, estado){
    try{
        if (wamid_enviado){
            const idCita = await buscarCitaPorWamid(wamid_enviado);
            const estadoMapeado = mapearEstado(estado); //Mapear el estado del mensaje a español
            const estadoActualCita = await obtenerEstadoCita(idCita.id); //Obtener el estado actual de la cita para evitar sobreescribir estados importantes ni anteriores, ya que el flow es enviado -> recibido -> leido
            if (estadoActualCita === 'pendiente'){ //En este caso es cuando el mensaje aun no se envia, al hacerlo puede cambiar a cualquiera de los estados
                await prisma.cita.update({
                    where: {id : idCita.id, paciente_rut: wamid_enviado }, 
                    data: { estado: estadoMapeado }
                });
            }else if(estadoActualCita === 'enviado' && estadoMapeado === 'recibido'){
                await prisma.cita.update({
                    where: {id : idCita.id, paciente_rut: wamid_enviado }, //Buscar la cita por ID y por el wamid del mensaje enviado
                    data: { estado: estadoMapeado }
                });
            }else if (estadoActualCita === 'recibido' && estadoMapeado === 'leido'){
                //se puede
                await prisma.cita.update({
                    where: {id : idCita.id, paciente_rut: wamid_enviado }, //Buscar la cita por ID y por el wamid del mensaje enviado
                    data: { estado: estadoMapeado }
                });
            }else if (estadoActualCita === 'recibido' && estadoMapeado === 'enviado'){
                console.log("El estado que esta entrando es anterior al que ya se ingreso en la base de datos"); //No hacer nada, ya que el estado actual es mas avanzado que el estado recibido
            }else if (estadoActualCita === 'leido' && (estadoMapeado === 'recibido' || estadoMapeado === 'enviado')){
                console.log("El estado que esta entrando es anterior al que ya se ingreso en la base de datos"); //No hacer nada, ya que el estado actual es mas avanzado que el estado recibido
            } 
        }
        

    }catch(error){
        console.error('Error al cambiar el estado del mensaje (enviado, recibido, leido): ', error);
    }
}

//----------------------------------------Obtencion del estado de cita-----------------------------------------
//Funcion que obtiene el estado de la cita a traves del ID de la cita
//Entradas: idCita: ID de la cita
//Salida: estado de la cita e.j 'pendiente', 'confirmada', 'cancelada', 'enviado', 'recibido', 'leido'
export async function obtenerEstadoCita(idCita){
    try{
        const cita = await prisma.cita.findUnique({
            where: {id: idCita},
            select: {estado: true}
        });
        return cita.estado;
    }catch(error){
        console.error('Error al obtener el estado de la cita: ', error);
        return null;
    }
}

//-----------------------------------------Obtencion de wamid de la cita----------------------------------
//Funcion que obtiene el wamid de la cita a traves del ID de la cita
//Entradas: idCita: ID de la cita
//Salida: wamid de la cita (ID del mensaje enviado)
async function obtenerWamidCita(idCita){
    try{
        const cita = await prisma.cita.findUnique({
            where: {id: idCita},
            select: {paciente_rut: true} //Actualmente el wamid se esta guardando en paciente_rut, se debe cambiar en el futuro ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! !
        })
    }catch(error){
        console.error('Error al obtener el wamid de la cita: ', error);
        return null;
    }
}
/* Hace falta darle mas vueltas al asunto, de momento lo traspaso a una forma mas sencilla, es decir, al webhook
//----------------------------------------Decision de envio de plantilla----------------------------------------
//Funcion que decide que plantilla enviar segun el estado de la cita
//Entradas: estadoCita: estado de la cita e.j 'pendiente', 'confirmada', 'cancelada', 'enviado', 'recibido', 'leido'
//Salida: nombre de la plantilla a enviar e.j 'confirmacion_cita', 'recordatorio_cita', 'cita_confirmada', 'cita_cancelada'. Ojo son solo ejemplos, no son los nombres reales de las plantillas
export async function decidirPlantillaEnvio(idCita){
    //Caso en el que wamid no existe, quiere decir que no se ha enviado ningun mensaje aun
    const wamid = await obtenerWamidCita(idCita);
    const estadoActualCita = await obtenerEstadoCita(idCita);
    if (!wamid){ //En caso de que no haya nada en el campo de wamid, es decir, no se ha enviado ningun mensaje aun
        if (estadoActualCita === 'pendiente' && estadoActualCita != 'confirmada' && estadoActualCita != 'cancelada'){ //Se verifica si el estado de la cita es pendiente, ya que si es otra cosa no se deberia enviar nada (desde el front se puede agregar automaticamente los estados de confirmada y cancelada, en esos casos no se envian los mensajes de confirmacion, pq se asume que ya se confirmo o cancelo por otro medio)
            console.log(styleText('bgYellow', `Decidiendo plantilla a enviar para cita ${idCita}: ${mapearPlantilla('confirmacion_cita')}`));
            return mapearPlantilla('confirmacion_cita');

        }
    }else if (wamid){ //Hay que agregar un paso mas, que seria que si existe un wamid, pero el estado se cambia internamente a confirmada o cancelada, no se deberian de enviar mensajes (Falta manejar el cancelado de cita por parte de funcionario aun)
        //Para el momento en el que exista un manejo de la cancelacion de cita por parte del funcionario, se deberia agregar una condicion mas que verifique si el estado actual de la cita es por parte del paciente o del fucnionario, algo asi como canceladoPaciente o canceladoFuncionario, ya que se enviarian 2 plantillas diferentes segun el caso
        if (estadoActualCita === 'confirmada'){
            console.log(styleText('bgYellow', `Decidiendo plantilla a enviar para cita ${idCita}: ${mapearPlantilla('informacion_cita')}`));
            return mapearPlantilla('informacion_cita');
            //To Do: Luego de enviar la plantilla con la informacion, se entra en el modo de recordatorios, que aun no esta implementado
        }else if (estadoActualCita === 'cancelada'){
            console.log(styleText('bgYellow', `Decidiendo plantilla a enviar para cita ${idCita}: ${mapearPlantilla('cancelada_cita_paciente')}`));
            return mapearPlantilla('cancelada_cita_paciente');
        }
    }
}

//----------------------------------------Rellenado de plantillas-------------------------------------------
//Funcion que rellena las plantillas con los datos de la cita segun plantilla a enviar
//Entradas: nombrePlantilla: nombre de la plantilla a enviar, datosCita: objeto con los datos de la cita (telefono, nombre, especialidad, fecha y id)
//Salida: objeto con los parametros rellenados para enviar a la API de WhatsApp Business

export async function rellenarPlantilla(idCita){
 const datosCita = await obtenerDatosCita([idCita]); //Obtener los datos de la cita a traves del ID de la cita
 const plantilla = await decidirPlantillaEnvio(idCita); //Llama a la funcion que decide que plantilla enviar segun el estado de la cita
 console.log(styleText('bgGray', `Plantilla a enviar: ${plantilla}`));
    switch (plantilla){
        case mapearPlantilla('confirmacion_cita'): 
            console.log(styleText('bgGreen', `Rellenando plantilla de confirmacion: ${plantilla}`));
            return rellenadoDatos(datosCita[0].paciente_nombre, datosCita[0].fecha_hora[0], datosCita[0].fecha_hora[1], datosCita[0].paciente_telefono); 
        case mapearPlantilla('informacion_cita'):
            console.log(styleText('bgBlue', `Rellenando plantilla de informacion: ${plantilla}`));
            return rellenadoDatosInformacion(datosCita[0].fecha_hora[0], datosCita[0].fecha_hora[1], datosCita[0].paciente_telefono);
        case mapearPlantilla('cancelada_cita_paciente'):
            console.log(styleText('bgRed', `Rellenando plantilla de cancelacion por parte del paciente: ${plantilla}`));
            return rellenadoDatosPacienteCancela(datosCita[0].paciente_telefono);
        default:
            console.warn('No se encontro una plantilla para enviar');
            return null;
    }

}*/