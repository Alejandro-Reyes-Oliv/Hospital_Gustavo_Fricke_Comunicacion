import fetch from "node-fetch";
import { Client } from "pg"; // Instala con: npm install pg

const url = "https://graph.facebook.com/v23.0/733696073164766/messages";
const token = "EAAPcFHLFxk4BPS3JbKIZANSvZATSH6iEMCCPtraIABsHFEYHn4lIcltQS0mDxp4XZBwAx3xZBAjNcEgscsM6SPcgx2PHZAqeOWPcXwUjLj9GsZA8zLXz77JXfuN5CuT87eCUXRpqX2zxXJ6mbT7eibMpOu9ZAXz3e1wZBelGANAii7Rkdv5mMeK8cJa8pY9r97rOcWo4Pzh6iro3nUsox5F5KeNnQZBB6ouiHWZBHPIpbVTq2ApgZBVFsF0EeJyZBhoQOQZDZD";

// Configura tu conexión PostgreSQL
const dbConfig = {
  host: "localhost",
  user: "postgres",
  password: "parfetech",
  database: "pruebas_bot",
  port: 5432 // usualmente el puerto por defecto
};

async function getAppointmentData(id) {
  const client = new Client(dbConfig);
  await client.connect();
  const res = await client.query(
    "SELECT telefono, paciente, medico, fecha, hora FROM citas WHERE id = $1",
    [id]
  );
  await client.end();
  return res.rows[0]; // Devuelve el primer resultado
}

async function sendTemplate() {
  try {
    // Obtén los datos de la cita (por ejemplo, id = 1)
    const cita = await getAppointmentData(1);

    const payload = {
      messaging_product: "whatsapp",
      to: cita.telefono, // Usar el número de la base de datos
      type: "template",
      template: {
        name: "confirmacion_cita_medica",
        language: { code: "es" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: cita.nombre },
              { type: "text", text: cita.nombre },
              { type: "text", text: cita.fecha },
              { type: "text", text: cita.hora }
            ]
          }
        ]
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("Respuesta de Meta:", data);
  } catch (error) {
    console.error("Error enviando plantilla:", error);
  }
}

sendTemplate();