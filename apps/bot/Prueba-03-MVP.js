var myHeaders = new Headers();
myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

var celular = "+56955333737"; // Número del paciente
var instancia = "instance138353";
var token = "4xoon1ca7tecmn9h";

// Mensaje con confirmación y botones
var bodyMensaje = "Hola Alejandro Reyes, tu cita médica con el Dr. Ignacio Tenorio está agendada para el día 30/08/2025 a las 11:00, en el área de Toma de muestras. La cita se realizará en el piso 3.\n¿Quieres confirmar tu cita médica?\n✅ Confirmar\n❌ Cancelar";

var urlencoded = new URLSearchParams();
urlencoded.append("token", token);

//urlencoded.append("to", `%2B${celular}`);
urlencoded.append("to",celular);

urlencoded.append("body", bodyMensaje);

var requestOptions = {
  method: 'POST',
  headers: myHeaders,
  body: urlencoded,
  redirect: 'follow'
};

fetch(`https://api.ultramsg.com/${instancia}/messages/chat`, requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));
