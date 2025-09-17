// Aqui va la configuracion como tal de la aplicacion, importacion de rutas, middlewares, etc
// ---------------------------------Librerias--------------------------
import express, { json } from 'express'
import { corsMiddleware } from './middlewares/cors.js'
import { citasRouter } from './routes/citas_routes.js'
import { medicosRouter } from './routes/medicos_routes.js'

const app = express() // Aca creamos la aplicacion de express

// ---------------------------------Middlewares--------------------------
// Aca van los middlewares, que son funciones que se ejecutan antes de llegar a las rutas (como dice su nombre, middle, ocurren en entre que se manda la peticion y se llega a la ruta)
app.use(corsMiddleware()) // Middleware para el CORS, que permite o no las conexiones desde otros dominios (Ya esta semi configurado en su archivo) #Si solo se pone el use.cors(), hace que permita el acceso a cualquier dominio
app.use(json()) // Middleware para que entienda JSON en las peticiones

app.disable('x-powered-by') // Esto es mas que nada para "seguridad", deshabilta la cabecera que dice directamente que se usa express (por ejemplo cuando se hace una peticion, la respuesta arriba dice "X-Powered-By: Express")
// ---------------------------------Rutas--------------------------
// Aca van las rutas, que son los endpoints (POST, GET, PUT, PATCH ,DELETE ) a los que se puede acceder
app.use('/citas', citasRouter) // Al ingresar a traves del url /citas, se accede a las rutas definidas en citasRouter y dependiendo de si despues del citas hay un / se manda a una u otra, ruta por ejemplo con el GET, si es citas/ llama al getAll, pero si es citas/algo, llama al getbyId
app.use('/medicos', medicosRouter)
