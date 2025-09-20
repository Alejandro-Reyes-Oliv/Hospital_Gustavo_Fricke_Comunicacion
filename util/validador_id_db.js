// Función para validar si un ID existe en la base de datos
// ----------------------------------Librerias--------------------------
import { dbPool } from '../database/config.js'

// ----------------------------------Validadores--------------------------
export const validarMedicoID = async (id) => {
  try {
    const result = await dbPool.query('SELECT EXISTS(SELECT 1 FROM medicos WHERE id_medico=$1)', [id])
    // console.log('result.row', result.rows[0].exists) //Esto retorna un objeto con la propiedad exists, que es true o false
    // console.log('result ', result)  //Esto retorna muchas cosas, y dentro de ellas esta rows: [{exists:true}]
    if (result.rows[0].exists) {
      return true
    } else {
      return false
    }
  } catch (error) {
    return error
  }
}
