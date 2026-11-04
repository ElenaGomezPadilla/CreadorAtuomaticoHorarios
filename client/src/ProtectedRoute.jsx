import { useAuth } from './context/AuthContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * @file Componente Guard de protección de rutas para React Router.
 * @description Restringe el acceso a vistas privadas, redirigiendo a los usuarios no autenticados 
 * hacia la página de login conservando la ruta de origen en el estado de navegación.
 */

/**
 * Componente funcional de Envoltura (Wrapper) para Rutas Protegidas.
 * Evalúa los estados globales de autenticación antes de renderizar los nodos secundarios.
 * * @component
 * @example
 * // Uso en la configuración de React Router:
 * <Route element={<ProtectedRoute />}>
 * <Route path="/profile" element={<ProfilePage />} />
 * </Route>
 * * @returns {React.ReactElement} Retorna un indicador de carga (Spinner), una redirección reactiva o el componente `Outlet`.
 */
function ProtectedRoute() {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation(); // Captura el objeto de ubicación (URL) actual en el historial del navegador

    // =========================================================================
    // 1. CONTROL DE ESTADO ASÍNCRONO (FASE DE VERIFICACIÓN)
    // =========================================================================
    // Mientras el contexto valida la firma del token almacenado en las cookies,
    // se detiene la renderización para evitar que un usuario válido sea expulsado erróneamente.
    if (loading) {
        return (
            <div className="spinner-container">
                <div className="loader"></div> 
            </div>
        );
    }

    // =========================================================================
    // 2. CONTROL DE ACCESO RESTRINGIDO (REDIRECCIÓN CON RETORNO)
    // =========================================================================
    // Si la carga finalizó y el usuario no está autenticado, se le redirige al login.
    // Inyectamos la propiedad `state: { from: location }` para que el formulario de Login 
    // sepa exactamente a qué sub-página quería entrar el usuario una vez inicie sesión.
    if (!isAuthenticated) {
        return <Navigate to='/login' state={{ from: location }} replace />;
    }

    // =========================================================================
    // 3. ACCESO AUTORIZADO
    // =========================================================================
    // Si el usuario superó la verificación con éxito, se renderiza el Outlet
    // que actúa como marcador de posición para las sub-rutas hijas declaradas.
    return <Outlet />;
}

export default ProtectedRoute;