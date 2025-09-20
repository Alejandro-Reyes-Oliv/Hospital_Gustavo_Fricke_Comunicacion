// Aca van los controladores (donde se procesan las peticiones) de las citas medicas
// ---------------------------------Librerias--------------------------
import { dbPool } from '../database/config.js' // Importa la configuracion de la base de datos
// Falta crear e importar los validadores de las citas

// ---------------------------------Controlador-------------------------------

export class citaController {
  // - - - - - - - - - - - - Obtener todas las citas - - - - - - - - - - - - - -
  // Este metodo obtiene todas las citas de la base de datos
  // Ruta: /citas/ (GET)
  static async getAllCitas (req, res) {
    try {
      const results = await dbPool.pool.query('SELECT * FROM citas') // Aca se hace la consulta a la base de datos, en este caso un select *
      res.status(200).json(results.rows) // Aca se tienen que enviar los datos al frontend
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las citas médicas' })
    }
  }

  // - - - - - - - - - - - - Crear una nueva cita - - - - - - - - - - - - - -
  // Este metodo crea una nueva cita en la base de datos
  // Ruta: /citas/ (POST)
  static async createCita (req, res) {
    res.send('Crear cita')
  }

  // - - - - - - - - - - - - Obtener una cita por ID - - - - - - - - - - - - - -
  // Este metodo obtiene una cita por su ID
  // Ruta: /citas/:id (GET)
  static async getCitaById (req, res) {
    res.send('Obtener cita por ID')
  }

  // - - - - - - - - - - - - Eliminar una cita por ID - - - - - - - - - - - - - -
  // Este metodo elimina una cita por su ID
  // Ruta: /citas/:id (DELETE)
  static async deleteCitaById (req, res) {
    res.send(`Eliminar cita por ID ${req.params.id}`)
  }

  // - - - - - - - - - - - - Actualizar una cita por ID - - - - - - - - - - - - - -
  // Este metodo actualiza una cita por su ID
  // Ruta: /citas/:id (PATCH)
  static async updateCitaById (req, res) {
    res.send(`Actualizar cita por ID ${req.params.id}`)
  }

  // - - - - - - - - - - - - Obtener citas por periodo de tiempo - - - - - - - - - - - - - -
  // Este metodo obtiene citas por un periodo de tiempo.
  // Ruta: /citas/periodo/:periodo (GET)  # Falta definir bien como se va a enviar el periodo, si usar query params o path params
  // Ejemplo: /citas/periodo/2023-01-01_2023-01-31 o /citas?inicio=2023-01-01&fin=2023-01-31

  static async getCitasByPeriodo (req, res) {
    res.send(`Obtener citas por periodo de tiempo ${req.params.periodo}`)
  }

  // - - - - - - - - - - - - Obtener citas por ID de medico - - - - - - - - - - - - - -
  // Este metodo obtiene citas por el ID de un medico
  // Ruta: /citas/medico/:medicoId (GET) # Falta definir bien si usar query params o path params / citas?medicoId=1
  static async getCitasByMedicoId (req, res) {
    res.send(`Obtener citas por ID de medico ${req.params.medicoId}`)
  }

  // - - - - - - - - - - - - Obtener citas por nombre de paciente - - - - - - - - - - - - - -
  // Este metodo obtiene citas por el nombre de un paciente
  // Ruta: /citas/paciente/:nombrePaciente (GET) # Falta definir bien si usar query params o path params / citas?nombrePaciente=Juan%20Perez el %20 es un espacio en URL encoding
  static async getCitasByNombrePaciente (req, res) {
    res.send(`Obtener citas por nombre de paciente ${req.params.nombrePaciente}`)
  }
}
