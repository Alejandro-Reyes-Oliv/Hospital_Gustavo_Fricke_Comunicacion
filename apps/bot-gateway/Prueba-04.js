import fetch from "node-fetch"; // Si usas Node 18+, ya viene con fetch integrado

const url = "https://graph.facebook.com/v23.0/733696073164766/messages";
const token = "EAAPcFHLFxk4BPVL32RkcMml6I5c4bS73kVTGg7i3ZCwVDnlH3av7rRBcyZAJ3fJuM8PwqiCcUU8vsZB491X7khW4o1bIicMtwE3CsH5q7OhlMrfNXFEU8bQfKv9zaKZC7FZAcZBnWxzDRC3F1ULtLvVZA0AIgqhWC9yu4rST1otjwdoEQu2Kn92HPXvaZCdwYctdmuOakFo9fM0BaB2RI1J1HXEZCpGKH7GqIbwUoKQZDZD"; // ⚠️ tu token de acceso

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
