// Aca van los controladores (donde se procesan las peticiones) de los medicos
// ---------------------------------Librerias--------------------------
import { dbPool } from '../database/config.js' // Importa la configuracion de la base de datos
import { validarMedicoID, consultarEstadoMedicoID, validarNombreMedico } from '../util/validador_id_db.js' // Importa elos validadores basicos para médico
// Falta crear e importar los validadores de los medicos

// ---------------------------------Controlador--------------------------
export class medicoController {
  // - - - - - - - - - - - Obtener todos los medicos - - - - - - - - - - - - - - -
  // Este metodo obtiene todos los medicos de la base de datos
  // Ruta: /medicos/ (GET)
  // Se debe manejar luego la paginacion
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
  // Falta validar los datos que vienen en el req.body (SCHEMA)
  static async createMedico (req, res) {
    console.log(req.body)
    const id = req.body.idMedico
    const nombre = req.body.nombreMedico
    const especialidad = req.body.especialidad
    const estado = req.body.estado || 'activo' // Si no viene el estado, por defecto es activo
    // res.send('Aqui se crea un medico')
    try {
      const existeMedico = await validarNombreMedico(nombre) // Funcion que valida si el nombre del medico ya existe en la base de datos (util/validador_id_db.js)
      console.log('Existemedico: ', existeMedico)
      if (existeMedico) { // Si el retorno de validarNombreMedico es true, es porque el nombre ya existe
        return res.status(400).json({ error: 'El médico ya existe' })
      } else {
        await dbPool.query('INSERT INTO medicos (id_medico, nombremedico, especialidad, estado) VALUES($1, $2, $3, $4)', [id, nombre, especialidad, estado]) // Aca se inserta un nuevo medico en la base de datos si es que no existe ya uno con el mismo nombre
        return res.status(201).json({ message: 'Médico creado exitosamente' }) // 201 es el codigo de creado exitosamente
      }
    } catch (error) {
      res.status(500).json({ error: 'Error al crear el medico' })
    }
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
    try {
      const existe = await validarMedicoID(id) // Funcion que valida si el ID existe en la base de datos (util/validador_id_db.js)
      if (existe) { // Si el retorno de ValidarMedicoID es true, es porque el ID existe
        const estado = await consultarEstadoMedicoID(id) // Funcion que consulta el estado del medico segun su ID (util/validador_id_db.js)
        // console.log('estado ', estado)
        if (estado === 'inactivo') {
          // console.log('El medico esta inactivo')
          return res.status(400).json({ error: 'El médico ya está inactivo' })
        } else { // Solo si el medico esta activo, se puede cambiar a inactivo
          // console.log('EL medico estaba activo')
          await dbPool.query('UPDATE medicos SET estado = $1 WHERE id_medico = $2', ['inactivo', id]) // Aqui se cambia el estado de un medico a inactivo segun el id ingresado
          // console.log('result.rowCount ', result.rowCount)
          return res.status(200).json({ message: 'Estado de médico cambiado a inactivo' }) // Si se pudo cambiar el estado, se retorna este mensaje
        }
      } else { // Si el retorno de ValidarMedicoID es false, es porque el ID no existe
        return res.status(400).json({ error: 'El ID del médico no existe' })
      }
    } catch (error) {
      console.log('Error al validar estado: ', error)
      return res.status(500).json({ error: 'Error al eliminar el médico' })
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
