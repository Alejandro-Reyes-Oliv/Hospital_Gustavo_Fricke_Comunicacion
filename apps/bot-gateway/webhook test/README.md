Cmds:
1) Node server.js -> activa el listener
2) curl "http://localhost:8081/webhook?hub.mode=subscribe&hub.verify_token=tu_token_de_verificacion&hub.challenge=123" -> prueba de verificacion
3) Simula respuesta txt = "a": 
$uri = "http://localhost:8081/webhook"

$json = @'
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "56911111111",
          "id": "wamid.TEST",
          "timestamp": "1694460000",
          "text": { "body": "a" },
          "type": "text"
        }],
        "contacts": [{ "wa_id": "56911111111" }]
      }
    }]
  }]
}
'@

Invoke-RestMethod -Uri $uri -Method Post -ContentType "application/json" -Body $json

4) Revisar .jsonl -> log de msj recibido
