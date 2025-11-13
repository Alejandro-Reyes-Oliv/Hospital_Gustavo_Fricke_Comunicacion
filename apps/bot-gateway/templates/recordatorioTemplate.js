process.loadEnvFile('../../../.env')
const TEMPLATE = process.env.RECORDATORIO_TEMPLATE
export function rellenadoDatosRecordatorio (nombrePaciente, fechaCita, horaCita, especialidad ,numeroPaciente) {
    
    const payload = {
        messaging_product: "whatsapp",
        to: numeroPaciente, 
        type: "template",
        template: {
            name: TEMPLATE, 
            language: { code: "es" },        
            components: [
            {
                type: "body",
                parameters: [
                { type: "text", text: nombrePaciente },
                { type: "text", text: fechaCita },
                { type: "text", text: horaCita },
                { type: "text", text: especialidad }
                ]
            }
            ]
        }
        };
    return JSON.stringify(payload)
}