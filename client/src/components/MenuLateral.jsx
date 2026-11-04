import { useState } from 'react';
import { useFormState } from 'react-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function MenuLateral(){
    const { isAuthenticated, logout } = useAuth();
    const [menuAbierto, setMenuAbierto] = useState(false);

    return(
        <>
        <button className="boton-abrir-menu" onClick={() => setMenuAbierto(true)}> ☰ </button>

        {menuAbierto && (
            <div className="menu-overlay" onClick={() => setMenuAbierto(false)} />
        )}

        <div className={`menu-lateral ${menuAbierto ? 'abierto' : ''}`}>
            <button className='exit-menu-lateral' onClick={() => setMenuAbierto(false)}>✕</button>
            <div className='elementos-menu-lateral'>
                <Link className='boton-menu-lateral' to="/">Inicio</Link>
                <Link className='boton-menu-lateral' to="/horarios">Mis horarios</Link>
                <Link className='boton-menu-lateral' to="/crearHorarios">Crear un horario</Link>
                <Link className='boton-menu-lateral' to="/asignaturas">Asignaturas</Link>

                <div>
                    {isAuthenticated &&
                    <>
                        <Link to="/" className="boton-menu-lateral" 
                            onClick={() => {
                            logout();
                            }}
                        >
                            Cerrar sesión 
                        </Link>
                    </>
                    }
                </div>

            </div>
        </div>
        </>
    );
}

export default MenuLateral; 