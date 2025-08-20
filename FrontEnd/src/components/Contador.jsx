import { useState } from "react";

export default function Contador(){
    const [valor,setValor] = useState(0);
    return(
       <>
       <div className="flex items-center gap-2">
        <button className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300" onClick={()=> setValor(valor-1)}>restar</button>
        <span className="w-12 text-center font-semibold">{valor}</span>
        <button className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300" onClick={()=> setValor(valor+1)}>sumar</button>
       </div>
       </> 
    );
}