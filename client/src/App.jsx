import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AppProviders from './AppProviders';

import RegisterPage from "./pages/RegisterPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import AsignaturasIndex from "./pages/Asignaturas/Index.jsx";
import HorariosIndex from "./pages/Horarios/Index.jsx";
import CrearHorario from "./pages/Horarios/CrearHorario.jsx";
import EditarHorario from "./pages/Horarios/EditarHorario.jsx";
import HomePage from "./pages/HomePage.jsx";
import ProtectedRoute from './ProtectedRoute.jsx';

// Hojas de estilos globales y de componentes modulares
import "./styles/index.css";
import "./styles/homePage.css";
import "./styles/loginRegister.css";
import "./styles/asignatura.css";
import "./styles/horario.css";

// Importaciones de estilos core y temas de componentes de PrimeReact
import 'primereact/resources/themes/lara-light-indigo/theme.css'; // Tema visual de PrimeReact
import 'primereact/resources/primereact.min.css';                // Estilos CSS estructurales de PrimeReact
import 'primeicons/primeicons.css';                             // Paquete de fuentes de iconos de PrimeIcons

/**
 * @file Componente Raíz de la Aplicación (App).
 * @description Configura la arquitectura de proveedores globales de estado (Contextos), 
 * el enrutamiento declarativo del lado del cliente y la inyección de hojas de estilo globales.
 */

/**
 * Componente principal de la aplicación React.
 * Orquesta los árboles de rutas públicas, semi-públicas y las protegidas por guardianes de autenticación.
 * * @component
 * @returns {React.ReactElement} Árbol de componentes envuelto por enrutadores y proveedores.
 */
function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>

            {/* =========================================================================
                RUTAS PÚBLICAS GENERALES
                ========================================================================= */}
            {/* Página de aterrizaje / Dashboard inicial */}
            <Route path='/' element={<HomePage/>}/>

            {/* =========================================================================
                RUTAS DE GESTIÓN DE AUTENTICACIÓN
                ========================================================================= */}
            <Route path='/login' element={<LoginPage/>}/>
            <Route path='/register' element={<RegisterPage/>}/>

            {/* =========================================================================
                RUTAS DE CONSULTA ACADÉMICA (SEMI-PÚBLICAS O CONFIGURABLES)
                ========================================================================= */}
            <Route path='/asignaturas' element={<AsignaturasIndex/>}/>

            {/* =========================================================================
                RUTAS PROTEGIDAS (Middleware Guard / Control de Sesión Requerido)
                ========================================================================= */}
            <Route element={<ProtectedRoute/>}>

              {/* Gestión de la cuenta y perfil de usuario logueado */}
              <Route path='/profile' element={<h1>Profile</h1>}/>

              {/* Flujos CRUD y automatización del generador de horarios */}
              <Route path='/horarios' element={<HorariosIndex/>}/>
              <Route path='/crearHorarios' element={<CrearHorario />}/>
              <Route path='/editarHorarios/:id' element={<EditarHorario />}/>
            
            </Route> 

        </Routes>
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;