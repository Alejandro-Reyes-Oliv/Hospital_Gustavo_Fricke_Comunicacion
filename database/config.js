// Aqui va la configuracion de la base de datos
// ---------------------------------Librerias--------------------------
import { Pool } from 'pg'

process.loadEnvFile() // Esto hace que se carguen las variables de entorno del archivo .env en process.env #Asi no hay que usar librerias extras como dotenv

// ---------------------------------Configuracion--------------------------

export const dbPool = new Pool({
  user: process.env.DBUSER, // El usuario de la base de datos, en este caso no le cree uno nuevo, asi que el por defecto es postgres
  host: process.env.DBHOST, // Ya que no esta en ningun servidor, se ocupa el localhost
  password: process.env.DBPASS,
  database: process.env.DBNAME, // Este es el nombre de la base de datos que se encuentra en el servidor (como no hay server en este caso, entonces en el local)
  port: process.env.DBPORT // El puerto por defecto de postgres es 5432, pero yo lo cambie a 5555 en la instalacion. (lo deje en el .env)
})
