import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import foto from '../assets/foto-biblioteca.png';  

function RegisterPage() {
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm();
    
    const { 
        signup, 
        isAuthenticated, 
        errors: RegisterErrors 
    } = useAuth();  
    
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (isAuthenticated) {
            const from = location.state?.from?.pathname || "/";
            navigate(from, { replace: true });    
        }
    }, [isAuthenticated, navigate]);

    const onSubmit = handleSubmit(async (values) => {
        await signup(values);
    });

    return (
        <div className="contenedor-principal-login">

            <div className='contenedor-izquierda'> 
                <div className='imagen-registro-login'>
                <img src={foto} alt="Imagen Lateral" className="imagen-centrada" />
                </div>
            </div>
  
            <div className="contenedor-derecha">
  
                {RegisterErrors.map((error, i) => (
                    <div key={i} className="caja-mensaje-error">
                        {error}
                    </div>
                ))}

                <form onSubmit={onSubmit} className='ubicacion-formulario'>
                    <div className='ubicacion-texto'>
                        <h1 className="titulo-texto-principal">Regístrate</h1>
                        <h1 className="subtitulo-texto-secundario">Saca el máximo partido a tu vida universitaria</h1>
                    </div>

                    <div>
                        <input
                            type="text"
                            {...register("username", { required: true })}
                            className="input-estilo"
                            placeholder='Usuario'
                        />
                        {errors.username && <p className="texto-rojo">Username es requerido</p>}

                        <input
                            type="email"
                            {...register("email", { required: true })}
                            className="input-estilo"
                            placeholder='Correo electrónico'
                        />
                        {errors.email && <p className="text-red-500">Email es requerido</p>}

                        <input
                            type="password"
                            {...register("password", { required: true })}
                            className="input-estilo"
                            placeholder='Contraseña'
                        />
                        {errors.password && <p className="texto-rojo">Password es requerido</p>}
                    </div>

                    <button type="submit" className="boton-siguiente">
                        Regístrate
                    </button>
                    
                </form>

                <p className="flex-texto-espaciado">
                    ¿Ya tienes una cuenta?
                    <Link to="/login" className="enlace">Inicia sesion</Link>
                </p>

            </div>
        </div>

    );
}

export default RegisterPage;
