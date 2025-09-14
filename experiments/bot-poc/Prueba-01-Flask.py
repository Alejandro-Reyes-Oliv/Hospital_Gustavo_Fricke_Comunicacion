# Ejecutar Prueba-01.py, luego este archivo y después entrar a cmd y ejecutar: ngrok http 5000

from flask import Flask, request

app = Flask(__name__)

# Aceptar tanto "/" como "/webhook"
@app.route("/", methods=["POST"])
@app.route("/webhook", methods=["POST"])
def webhook():
    data = request.json  # Recibe JSON desde UltraMsg
    if not data:
        return "No JSON recibido", 400

    numero = data.get("from")
    mensaje = (data.get("body") or "").strip().lower()

    print(f"Mensaje de {numero}: {mensaje}")

    if mensaje == "1":
        print("Cita confirmada ✅")
    elif mensaje == "2":
        print("Cita cancelada ❌")
    elif mensaje == "3":
        print("Reprogramar cita 🔄")
    else:
        print("Respuesta no reconocida")

    return "ok", 200

if __name__ == "__main__":
    app.run(port=5000)

