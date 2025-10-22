//Aqui se vera toda la logica relacionada con el envio de mensajes de confirmacion a traves del boton
import {prisma} from '../config/prisma.js';


//----------------------------------------Obtencion de datos de cita y llenado de mensaje-------------------------------------------
//Funcion que obtiene los datos de la cita a traves del id de la cita
//Entradas: ids = [id1, id2, id3...]  (Array de id's de las citas)
//Salida: Array con el telefono, nombre del paciente, especialidad, fecha de la cita


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
                }
        })
        //Limpieza de la fecha y hora para que quede en formato legible
        datosCitas.forEach(fecha => { //Aca se hace el formateo de cada fecha obtenida, ya que en la base de datos esta contenida en un formato poco legible e.j(2025-09-23T00:01:00.000Z)
            fecha.fecha_hora = fecha.fecha_hora.toISOString().slice(0, 19).replace('T', ' ').split(' '); //El resultado queda en un array con [fecha, hora] e.j (['2025-09-23', '00:01:00'])
        }); //Aca retorna un array que contiene [fecha] [hora]
        datosCitas.forEach(cita => {
            cita.fecha_hora[0] = mapearFecha(cita.fecha_hora[0]); //Mapear la fecha a formato legible e.j (23 de septiembre de 2025)
            cita.fecha_hora[1] = cita.fecha_hora[1].slice(0,5); //Dejar solo la hora en formato HH:MM e.j (00:01)
        });

        /* ........................................NO IMPLEMENTADO.......................................
        //Misma funcion pero con map
        datosCitas.map(cita =>{
            cita.fecha_hora = cita.fecha_hora.toISOString().slice(0, 19).replace('T', ' ').split(' ');
        })
        */

        //Formateo del numero telefonico
        datosCitas.forEach(numero => {
            if (!numero.paciente_telefono.startsWith('56') && numero.paciente_telefono.length === 9) {
                numero.paciente_telefono = '56' + numero.paciente_telefono;
            }
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
        "01": "enero",
        "02": "febrero",
        "03": "marzo",
        "04": "abril",
        "05": "mayo",
        "06": "junio",
        "07": "julio",
        "08": "agosto",
        "09": "septiembre",
        "10": "octubre",
        "11": "noviembre",
        "12": "diciembre"
    }
    const [year, month, day] = fechaStr.split('-');
    return `${day} de ${meses[month]} de ${year}`;
}
