// Aqui va la configuracion como tal de la aplicacion, importacion de rutas, middlewares, etc
// ---------------------------------Librerias--------------------------
// Import con ES modules
import express, { json } from 'express'
import { corsMiddleware } from './middlewares/cors.js'
import { citasRouter } from './routes/citas_routes.js'
import { medicosRouter } from './routes/medicos_routes.js'
import { usuariosRouter } from './routes/usuarios_routes.js'
import { styleText } from 'node:util' // Esto es mas que nada par darle color a la consola
process.loadEnvFile() // Esto hace que se carguen las variables de entorno del archivo .env en process.env #Asi no hay que usar librerias extras como dotenv

/*
// Imports con CommonJS
const express = require ('express')
const cors = require('cors')
const citasRouter = require('./routes/citas_routes')
const medicosRouter = require('./routes/medicos_routes')
const usuariosRouter = require('./routes/usuarios_routes')
*/

const app = express() // Aca asignamos la aplicacion de express

// A modo de ejemplo, para luego integrar el webhook de meta sin tener que usar otro puerto.
// const webhook = express()
// webhook.use(express.json())
// webhook.get('/webhook', /* verify */)
// webhook.post('/webhook', /* handle */)

// ---------------------------------Middlewares--------------------------
// Aca van los middlewares, que son funciones que se ejecutan antes de llegar a las rutas (como dice su nombre, middle, ocurren en entre que se manda la peticion y se llega a la ruta)
app.use(corsMiddleware()) // Middleware para el CORS, que permite o no las conexiones desde otros dominios (Ya esta semi configurado en su archivo) #Si solo se pone el use.cors(), hace que permita el acceso a cualquier dominio
app.use(json()) // Middleware para que entienda JSON en las peticiones

app.disable('x-powered-by') // Esto es mas que nada para "seguridad", deshabilta la cabecera que dice directamente que se usa express (por ejemplo cuando se hace una peticion, la respuesta arriba dice "X-Powered-By: Express")
// ---------------------------------Rutas--------------------------
// Aca van las rutas, que son los endpoints (POST, GET, PUT, PATCH ,DELETE ) a los que se puede acceder
// app.use('/', login)  //Aun falta hacer esta parte.
app.use('/citas', citasRouter) // Al ingresar a traves del url /citas, se accede a las rutas definidas en citasRouter y dependiendo de si despues del citas hay un / se manda a una u otra, ruta por ejemplo con el GET, si es citas/ llama al getAll, pero si es citas/algo, llama al getbyId
app.use('/medicos', medicosRouter) // Lo mismo que con las citas, pero para medicos
app.use('/usuarios', usuariosRouter) // y mas de lo mismo

// ------------------------------Puerto de escucha--------------------------
// Aca se setea en que puerto se ejecutara el servicio, se puede establecer de manera manual con una constante, o se puede hacer que tome el puerto de una variable de entorno (process.env.PORT) que es mas comun en produccion, ya que los servicios en la nube suelen asignar puertos dinamicamente #Como dice el amigaso, los servicios de host suelen asignar el puerto por esa variable, ya que no pueden haber 2 servicios usando el mismo puerto
// Para setear el valor de una variable de entorno, en la terminal antes de ejecutar el servicio, colocar $env:PORT=3000 (en windows powershell) o export PORT=3000 (en linux o mac) y luego ejecutar el servicio con node app.js

const PORT = process.env.AppPORT ?? process.env.PORT // Aqui se toma el puerto definido en el .env (AppPORT) o si es que no esta, toma el de (PORT), en realidad es mas que nada por si se instancia en un host (por el PORT)), pero no creo que lleguemos a eso

app.listen(PORT, () => { // El listen es el que pone a "escuchar" el servicio en el puerto definido
  console.log(styleText('green', `Servidor escuchando en el puerto http://localhost:${PORT}`)) // Aca para poder usar variables dentro de los console.log o se un string en sí, se usan `` en vez de "" o ''. En españosl chile se hacen con altgr + el cierre corchete xd } ] `
  // Y para darle color con styleText, primero se pone el color, y luego el texto, Nose que mas propiedades tiene
}) // Tampoco es necesario hacer que sea una funcion y dentro colocar el console.log, pero asi te aseguras de que se ejecuto bien el listen
