// Aqui van las rutas relacionadas a las citas médicas
// ---------------------------------Librerias--------------------------
import { Router } from 'express' // El router sirve simplificar la creacion de las rutas, es tedioso crearlas vanilla, pero se tendria mas control.
import { citaController } from '../controllers/citas_controllers.js' // Importa los controladores de las citas medicas, por eso se le pone el export
// ---------------------------------Enrutado--------------------------
// En este caso para mantener un poco el orden, y la utilizacion de capas, los controladores (donde se procesan las peticiones) estaran en otra carpeta.
export const citasRouter = Router()

citasRouter.get('/', citaController.getAllCitas)
citasRouter.post('/', citaController.createCita)

citasRouter.get('/:id', citaController.getCitaById)
citasRouter.delete('/:id', citaController.deleteCitaById)
citasRouter.patch('/:id', citaController.updateCitaById)

// Faltaria una ruta que permita obtener citas por periodo de tiempo, por ejemplo todas las citas entre dos fechas
citasRouter.get('/periodo', citaController.getCitasByPeriodo)
// Otra que permita obtener las citas de un medico en especifico
citasRouter.get('/medico/:medicoId', citaController.getCitasByMedicoId)
// Otra que permita obtener las citas segun el paciente
citasRouter.get('/paciente/:nombrePaciente', citaController.getCitasByPacienteId)
// Ver si se podria hacer con parametros opcionales, para que si no se pone nada, traiga todo, pero si se pone algo, filtre por eso
// Tambien se podria hacer una que permita obtener las citas por estado (pendiente, completada, cancelada, etc), pero eso ya es mas avanzado y depende de como se quiera manejar el sistema
// Tambien se podria hacer una que permita obtener las citas por especialidad medica, pero eso ya es mas avanzado y depende de como se quiera manejar el sistema
