import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();

  return(

    <div className='navbar'>
        <div className='navbar-nombre-app'>
            <Link to="/" className="nombre-app">APRUFF</Link>
        </div>

        <div className='navbar-enlaces'>
            {!isAuthenticated ? (
            <>
                <Link to="/login" className="enlace-nabvar">
                Inicio de sesión
                </Link>

                <Link to="/register" className="enlace-nabvar">
                Registrarte
                </Link>
            </>
            ) : (
                <> 
                {/* Usamos un Link pero capturamos el click para ejecutar la lógica */}
                <p className="navbar-nombre-usuario">
                    Hola de nuevo {user.username}!
                </p>
                </>
            )}
        </div>

    </div>

  );
}

export default Navbar; 