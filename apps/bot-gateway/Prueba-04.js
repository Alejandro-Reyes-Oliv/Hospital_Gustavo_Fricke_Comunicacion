import fetch from "node-fetch"; // Si usas Node 18+, ya viene con fetch integrado

const url = "https://graph.facebook.com/v23.0/733696073164766/messages";
const token = "EAAPcFHLFxk4BPgbS4RKu4Qy5AUSlRDC2kAKDPb3mrcOvZC7Qr8RUTUvjPdHna9ZBxfUTiA0ZADed3ZBjDFAeltxHAZA0WWBO5luwqklQ4lZBV2h7c3uphYQtsrOTqsC27v1ckZBgnKnZC3kZAT3tJx1fohhqsPcsx1IkEbCyuZBhaZBFy5JE97UlY7QWIVI12soUMbleAZDZD"; // ⚠️ tu token de acceso

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
