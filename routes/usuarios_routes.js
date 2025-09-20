// Aqui van las rutas relacionadas a los usuarios
// ---------------------------------Librerias--------------------------
import { Router } from 'express'
import { usuarioController } from '../controllers/usuarios_controllers.js'
// --------------------------------Enrutado--------------------------
// De igual manera que los anteriores, los controladores (donde se procesan las peticiones) estaran en su respectiva carpeta.
export const usuariosRouter = Router()

usuariosRouter.get('/', usuarioController.getAllUsuarios)

usuariosRouter.post('/', usuarioController.createUsuario)

usuariosRouter.get('/:id', usuarioController.getUsuarioById)
usuariosRouter.delete('/:id', usuarioController.deleteUsuarioById)
usuariosRouter.patch('/:id', usuarioController.updateUsuarioById)
// Faltaria una ruta para obtener usuarios por su estado (activo, inactivo)
usuariosRouter.get('/estado/:estado', usuarioController.getUsuariosByEstado)
