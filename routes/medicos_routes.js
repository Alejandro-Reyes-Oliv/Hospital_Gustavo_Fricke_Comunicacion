// Aqui van las rutas relacionadas a los medicos
// ---------------------------------Librerias--------------------------
import { Router } from 'express'
import { medicoController } from '../controllers/medicos_controllers.js'
// --------------------------------Enrutado--------------------------
// AL igual que con las citas, los controladores (donde se procesan las peticiones) estaran en otra carpeta.
export const medicosRouter = Router()

medicosRouter.get('/', medicoController.getAllMedicos)
medicosRouter.post('/', medicoController.createMedico)

medicosRouter.get('/:id', medicoController.getMedicoById)
medicosRouter.delete('/:id', medicoController.deleteMedicoById)
medicosRouter.patch('/:id', medicoController.updateMedicoById)
// De aqui para abajo hay que refinar

// Ver de como poder hacerlos con parametros
// Faltaria una ruta que permita obtener medicos por especialidad
medicosRouter.get('/especialidad/:especialidad', medicoController.getMedicosByEspecialidad)
// Otra que permita obtener medicos por nombre
medicosRouter.get('/nombre/:nombre', medicoController.getMedicosByNombre)

medicosRouter.get('/estado/:estado', medicoController.getMedicoByEstado)
