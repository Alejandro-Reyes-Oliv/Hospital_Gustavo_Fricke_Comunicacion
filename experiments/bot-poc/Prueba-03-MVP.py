## Usar whatsapp business Cloud para mensajes con botones
## Aquí usamos UltraMsg, vinculado a mi numero personal
import http.client
import ssl 

conn = http.client.HTTPSConnection("api.ultramsg.com",context = ssl._create_unverified_context())

#payload = "token=w9rzhmbh8t3atfdi&to=%2B56966484260&body=Mensaje automático de prueba desde python"
celular= "56955333737"
instancia= "instance138353"
token= "4xoon1ca7tecmn9h"
payload = f"token={token}&to=%2B{celular}&body=Hola Alejandro Reyes, tu cita médica con el Dr. Ignacio Tenorio está agendada para el día 30/08/2025 a las 11:00, en el área de Toma de muestras. La cita se realizará en el piso 3.\n¿Quieres confirmar tu cita médica?\n✅ Confirmar\n❌ Cancelar"


payload = payload.encode('utf8').decode('iso-8859-1') 

headers = { 'content-type': "application/x-www-form-urlencoded" }

conn.request("POST", f"/{instancia}/messages/chat", payload, headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))