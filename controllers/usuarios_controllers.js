// Aca van los controladores (donde se procesan las peticiones) de los usuarios
// ---------------------------------Librerias--------------------------
import { dbPool } from '../database/config.js' // Importa la configuracion de la base de datos
// Falta crear e importar el modelo de usuarios
// Falta crear e importar los validadores de los usuarios

// ---------------------------------Controlador--------------------------
export class usuarioController {
  // - - - - - - - - - - - - Obtener todos los usuarios - - - - - - - - - - - - - -
  // Este metodo obtiene todos los usuarios de la base de datos
  // Ruta: /usuarios/ (GET)
  static async getAllUsuarios (req, res) {
    try {
      const results = await dbPool.query('SELECT * FROM usuarios')
      res.status(200).json(results.rows) // Aca se tienen que enviar los datos al frontend
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener los usuarios' })
      console.error('Error al obtener los usuarios:', error)
    }
  }

  // - - - - - - - - - - - - Crear un nuevo usuario - - - - - - - - - - - - - -
  // Este metodo crea un nuevo usuario en la base de datos
  // Ruta: /usuarios/ (POST)
  static async createUsuario (req, res) {
    res.send('Aqui se crea un usuario')
  }

  // - - - - - - - - - - - - - Obtener usuario por ID - - - - - - - - - - - - - -
  // Este metodo obtiene un usuario por su ID
  // Ruta: /usuarios/:id (GET)  #Falta ver si es mejor asi o con query params /usuarios?id=1
  static async getUsuarioById (req, res) {
    // const { id } = req.params
    res.send(`Aqui se obtiene el usuario con id ${req.params.id}`)
  }

  // - - - - - - - - - - - - Eliminar usuario por ID - - - - - - - - - - - - - -
  // Este metodo elimina un usuario por su ID
  // Ruta: /usuarios/:id (DELETE)
  static async deleteUsuarioById (req, res) {
    res.send(`Aqui se elimina el usuario con id ${req.params.id}`)
  }

  // - - - - - - - - - - - - Actualizar usuario por ID - - - - - - - - - - - - - -
  // Este metodo actualiza un usuario por su ID
  // Ruta: /usuarios/:id (PATCH)
  static async updateUsuarioById (req, res) {
    res.send(`Aqui se actualiza el usuario con id ${req.params.id}`)
  }

  // - - - - - - - - - - - - Obtener usuarios por estado - - - - - - - - - - - - - -
  // Este metodo obtiene usuarios por su estado
  // Ruta: /usuarios/estado/:estado (GET) #De igual manera, ver si es mejor asi o con query params /usuarios?estado=activo o /usuarios?estado=inactivo
  static async getUsuariosByEstado (req, res) {
    res.send(`Aqui se obtienen los usuarios con estado ${req.params.estado}`)
  }
}
