export default function Saludo ({nombre = "visitante"}){
    return(
        <div className="p-4 rounded bg-white shadow">
            <p className="text-gray-700">Hola,<span className="font-semibold">{nombre}</span> 👋</p>
        </div>
    );
}
