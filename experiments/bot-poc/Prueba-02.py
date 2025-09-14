import requests

destino = "56966484260"
url = "https://graph.facebook.com/v22.0/733696073164766/messages"
token = "EAAPcFHLFxk4BPPTjCushZAX8FsASZCqqMCtIVmStVciWtreZBHVk6pWP6T9k8SEZB3F9VWZAxj8nluqoKWY4DgGEk2O4iPBbMt1YKwYmbuetHo3FVK4HUZB2v4KCtE5VWKqmszaO6JMoOjjZBHBw7ChmlbnJnyPXLEeYZC12g5F1hQz7LGOLFXEJ6KtfH9qJtkacUSZAuA0pCk1GwTcLHaUUSSp1UKWnXv3jgjFtD3AKE2En3pEUy1Nisbkj2Xa2OjAZDZD"

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

data = {
    "messaging_product": "whatsapp",
    "to": destino,
    "type": "interactive",
    "interactive": {
        "type": "button",
        "body": {
            "text": "Hola 👋, ¿quieres confirmar tu cita médica?"
        },
        "action": {
            "buttons": [
                {
                    "type": "reply",
                    "reply": {
                        "id": "confirmar_cita",
                        "title": "✅ Confirmar"
                    }
                },
                {
                    "type": "reply",
                    "reply": {
                        "id": "cancelar_cita",
                        "title": "❌ Cancelar"
                    }
                }
            ]
        }
    }
}

response = requests.post(url, headers=headers, json=data)
print(response.status_code, response.text)
