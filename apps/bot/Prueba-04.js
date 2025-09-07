import fetch from "node-fetch"; // Si usas Node 18+, ya viene con fetch integrado

const url = "https://graph.facebook.com/v23.0/733696073164766/messages";
const token = "EAAPcFHLFxk4BPS3JbKIZANSvZATSH6iEMCCPtraIABsHFEYHn4lIcltQS0mDxp4XZBwAx3xZBAjNcEgscsM6SPcgx2PHZAqeOWPcXwUjLj9GsZA8zLXz77JXfuN5CuT87eCUXRpqX2zxXJ6mbT7eibMpOu9ZAXz3e1wZBelGANAii7Rkdv5mMeK8cJa8pY9r97rOcWo4Pzh6iro3nUsox5F5KeNnQZBB6ouiHWZBHPIpbVTq2ApgZBVFsF0EeJyZBhoQOQZDZD"; // ⚠️ tu token de acceso

const payload = {
  messaging_product: "whatsapp",
  to: "56966484260", // número destino
  type: "template",
  template: {
    name: "confirmacion_cita_medica", // nombre EXACTO como aparece en Business Manager
    language: { code: "es" },       // o "es" según como la aprobaste
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: "Juan Pérez" },
          { type: "text", text: "Dra. María López" },
          { type: "text", text: "20/08/2025" },
          { type: "text", text: "11:00" },
          { type: "text", text: "Piso 3, Box 5" }
        ]
      }
    ]
  }
};

async function sendTemplate() {
  try {
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
