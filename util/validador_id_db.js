// Función para validar si un ID existe en la base de datos
// ----------------------------------Librerias--------------------------
import { dbPool } from '../database/config.js'

// ----------------------------------Validadores--------------------------
// - - - - - - - - - - - - - - - - - -Citas - - - - - - - - - - - - - - - -
// -- -- -- -- -- -- -- -- -- -- -- Validador de ID -- -- -- -- -- -- -- --
// Esta funcion valida si un ID de cita existe en la base de datos
// Retorna true si existe, false si no existe

// -- -- -- -- -- -- -- -- -- Validador de estado por ID -- -- -- -- -- -- -- --

// - - - - - - - - - - - - - - - - - Medicos - - - - - - - - - - - - - - -
// -- -- -- -- -- -- -- -- -- -- -- Validador de ID -- -- -- -- -- -- -- --
// Esta funcion valida si un ID de medico existe en la base de datos
// Retorna true si existe, false si no existe
// Se usa en los controladores para validar si un ID existe antes de hacer operaciones con el
export const validarMedicoID = async (id) => {
  try {
    const result = await dbPool.query('SELECT EXISTS(SELECT 1 FROM medicos WHERE id_medico=$1)', [id]) // Aca se ocupa el EXISTS que retorna true o false segun si encuentra o no el id
    // console.log('result.row', result.rows[0].exists) //Esto retorna un objeto con la propiedad exists, que es true o false
    // console.log('result ', result) // Esto retorna muchas cosas, y dentro de ellas esta rows: [{exists:true}]
    if (result.rows[0].exists) { // El return que necesitamos (true o false) se encuentra aqui (rows[0].exists)
      return true
    } else {
      return false
    }
  } catch (error) {
    return error
  }
}
// -- -- -- -- -- -- -- -- -- Consultar Estado por ID -- -- -- -- -- -- -- --
// Esta funcion consulta el estado de un medico segun su ID en la base de datos
// Retorna el estado del medico (activo o inactivo) o un error si no se encuentra el ID #Aunque se ocupa junto al validador de ID, asi que si no existe el ID, no se llega a este punto
// Se usa en los controladores para validar el estado de un medico antes de hacer operaciones con el, como el eliminar (cambiar a inactivo)
export const consultarEstadoMedicoID = async (id) => {
  try {
    const result = await dbPool.query('SELECT estado FROM medicos WHERE id_medico = $1', [id]) // Aqui se va a buscar el estado del medico a la base de datos segun el id ingresado
    // console.log('estado segun result row ', result.rows[0].estado)
    if (result.rows[0].estado) { // Aca si es que hay algo en el resultado, se retorna el estado (activo o inactivo)
      return result.rows[0].estado
    }
  } catch (error) {
    return error
  }
}
// -- -- -- -- -- -- -- -- -- -- Validador de nombre de médico -- -- -- -- -- -- --
// Esta funcion valida si un nombre de medico existe en la base de datos
// Retorna true si existe, false si no existe
// Se usa en los controladores para validar si un nombre existe antes de hacer operaciones con el
export const validarNombreMedico = async (nombre) => {
  try {
    const result = await dbPool.query('SELECT EXISTS(SELECT 1 FROM medicos WHERE nombremedico=$1)', [nombre]) // Aca se ocupa el EXISTS que retorna true o false segun si encuentra o no el nombre
    if (result.rows[0].exists) { // Aca es donde se encuentra el return que necesitamos (true o false)
      return true
    } else {
      return false
    }
  } catch (error) {
    return error
  }
}
