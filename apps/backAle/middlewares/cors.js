// Configuracion para el CORS, para que no acepte todos las direcciones
// ----------------------------------Librerias--------------------------
import cors from 'cors'

// ----------------------------------Configuracion-----------------------
// Esta es la lista de dominios que aceptamos/permitidos, si se necesita alguno mas, se añade aca
const ACCEPTED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:8080'
]
// Se exporta de una la funcion, sino habria que poner el export abajo
export const corsMiddleware = ({ acceptedOrigins = ACCEPTED_ORIGINS } = {}) => cors({ // la vdd nose pq se le asigna el valor de la variable de los dominios a una nueva, asi estaba en el curso xd, nose si funcara si se pasa la lista directamente
  origin: (origin, callback) => { // origin es una propiedad de cors, el cual su valor se asigna con la arrowfunction que le entran el origen y callback es parte de como funciona cors, osea es necesario
    if (acceptedOrigins.includes(origin)) {
      return callback(null, true) // El primer parametro es el error, en este caso al ser un origen permitido, no deberia haber error (por ello el null), y el segundo parametro indica si se acepta o no
    }
    if (!origin) { // Aca es que si no tiene la cabecera de origen (como seria el caso de la conexion con el frontend, u otro servicio (practicamente que no sea un navegador), se permite (el cors es solo para navegadores))
      return callback(null, true)
    }
    return callback(new Error('Origen no permitido por CORS')) // Si no es un origen permitido, se manda el error
  }
})
