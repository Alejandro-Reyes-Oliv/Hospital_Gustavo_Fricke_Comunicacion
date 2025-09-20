// Aca van los controladores (donde se procesan las peticiones) de los medicos
// ---------------------------------Librerias--------------------------
import { dbPool } from '../database/config.js' // Importa la configuracion de la base de datos
import { validarMedicoID } from '../util/validador_id_db.js' // Importa el validador de ID para médico
// Falta crear e importar los validadores de los medicos

// ---------------------------------Controlador--------------------------
export class medicoController {
  // - - - - - - - - - - - Obtener todos los medicos - - - - - - - - - - - - - - -
  // Este metodo obtiene todos los medicos de la base de datos
  // Ruta: /medicos/ (GET)
  static async getAllMedicos (req, res) {
    try {
      const results = await dbPool.query('SELECT * FROM medicos') // Aca se retornan todos los médicos evidentemente, se esta haciendo un Select *
      res.status(200).json(results.rows) // Aca se tienen que enviar los datos al frontend
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener los medicos' })
    }
  }

  // - - - - - - - - - - - - Crear un nuevo medico - - - - - - - - - - - - - - -
  // Este metodo crea un nuevo medico en la base de datos
  // Ruta: /medicos/ (POST)
  // Falta validar los datos que vienen en el req.body
  static async createMedico (req, res) {
    console.log(req.body)
    res.send('Aqui se crea un medico')
  }

  // - - - - - - - - - - - - Obtener un medico por ID - - - - - - - - - - - - - -
  // Este metodo obtiene un medico por su ID
  // Ruta: /medicos/:id (GET)
  // Falta validar que el ID exista, o no, simplemente manejar el error
  static async getMedicoById (req, res) {
    const id = req.params.id // Aca guardo el id en una constante, para luego usarlo en la query de manera "segura", ya que si uso directamente el req.params.id en la query, podria ser vulnerable a inyeccion SQL
    try {
      const result = await dbPool.query('SELECT * FROM medicos WHERE id_medico = $1', [id]) // En esta linea se hace la query a la base de datos (dbPool es la conexion) y la sentencia select, se le coloca el $1, $2, $n, para decir que ahi va una variable, que luego al cerrar el '' se coloca la coma y las variables en el orden
      // Se hace para evitar el inyectado de SQL
      if (result.rows.length === 0) { // en el rows van los resultados de la query, en este caso si es que no tiene nada, es porque evidentemente no encontro nada
        return res.status(404).json({ error: 'Médico no encontrado' }) // Se manda como respuesta un not found (404)
      }
      res.status(200).json(result.rows[0]) // Y en caso de si encontrar algo, se retorna
    } catch (error) {
      res.status(500).json({ error: 'Error al cargar el médico' })
    }
  }

  // - - - - - - - - - - - - Eliminar un medico por ID - - - - - - - - - - - - - -
  // Este metodo "elimina" un medico segun su ID, pero al ser soft delete, solo cambia su estado a inactivo
  // Ruta: /medicos/:id (DELETE)
  // Falta validar que el ID exista
  static async deleteMedicoById (req, res) {
    const id = req.params.id
    /*
    // realmente el validador este, no sirve de nada, pq si el id no existe, el update no afecta ninguna fila y se maneja con el rowCount
    const existe = await validarMedicoID(id)
    console.log('existe ', existe)
    */
    try {
      const result = await dbPool.query('UPDATE medicos SET estado = $1 WHERE id_medico = $2', ['inactivo', id]) // Aqui se cambia el estado de un medico a inactivo segun el id ingresado
      console.log(result.rowCount)
      if (result.rowCount === 0) { // rowCount devuelve la cantidad de filas afectadas por la query, si es 0, es porque no encontro el id; row.length no sirve en este caso porque un update no retorna filas
        return res.status(404).json({ error: 'Médico no encontrado' })// Siempre y cuando el id que ingrese cuente con el formato UUID, si no existe, entra aqui, si es de formato diferente, se va al catch
      }
      res.status(200).json({ message: 'Estado de médico cambiado a inactivo' })
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar el médico' })
    }
  }

  // - - - - - - - - - - - - Actualizar un medico por ID - - - - - - - - - - - - - -
  // Este metodo actualiza un medico por su ID
  // Ruta: /medicos/:id (PATCH)
  // Falta validar que el ID exista
  static async updateMedicoById (req, res) {
    res.send(`Aqui se actualiza el medico con id ${req.params.id}`)
  }

  // - - - - - - - - - - - - Obtener medicos por especialidad - - - - - - - - - - - - - -
  // Este metodo obtiene medicos por su especialidad
  // Ruta: /medicos/especialidad/:especialidad (GET)  #Aun falta ver si es mejor asi o con query params /medicos?especialidad=cardiologia
  // Falta validar que la especialidad exista
  static async getMedicosByEspecialidad (req, res) {
    res.send(`Aqui se obtienen los medicos con especialidad ${req.params.especialidad}`)
  }

  // - - - - - - - - - - - - Obtener medicos por nombre - - - - - - - - - - - - - -
  // Este metodo obtiene medicos por su nombre
  // Ruta: /medicos/nombre/:nombre (GET)  # Mas de lo mismo que en especialidad, falta ver si es mejor asi o con query params /medicos?nombre=juan
  // Falta validar que el nombre exista
  static async getMedicosByNombre (req, res) {
    // const nombreMedico = req.params.nombre
  }

  // - - - - - - - - - - - - Obtener medicos por estado - - - - - - - - - - - - - -
  // Este metodo obtiene medicos por su estado
  // Ruta: /medicos/estado/:estado (GET)  # Mas de lo mismo que en especialidad y nombre, falta ver si es mejor asi o con query params /medicos?estado=activo o /medicos?estado=inactivo
  // Falta validar que el estado exista
  static async getMedicoByEstado (req, res) {
    res.send(`Aqui se obtienen los medicos con estado ${req.params.estado}`)
  }
}
