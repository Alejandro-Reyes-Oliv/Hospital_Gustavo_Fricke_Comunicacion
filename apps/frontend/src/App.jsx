import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Saludo from './components/Saludo';
import Contador from './components/Contador';
import TablaConFiltro from './components/TablaConFiltro';


function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <TablaConFiltro />
    </div>
  );
}
export default App;