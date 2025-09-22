## Usar whatsapp business Cloud para mensajes con botones
## Aquí usamos UltraMsg, vinculado a mi numero personal
import http.client
import ssl 

conn = http.client.HTTPSConnection("api.ultramsg.com",context = ssl._create_unverified_context())

#payload = "token=w9rzhmbh8t3atfdi&to=%2B56966484260&body=Mensaje automático de prueba desde python"
celular= "56955333737"
instancia= "instance138353"
token= "z784i6faee0nzeic"
payload = f"token={token}&to=%2B{celular}&body=Hola, este es un mensaje automático de prueba desde Python, necesito que me respondas con un 1"


payload = payload.encode('utf8').decode('iso-8859-1') 

headers = { 'content-type': "application/x-www-form-urlencoded" }

conn.request("POST", f"/{instancia}/messages/chat", payload, headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))