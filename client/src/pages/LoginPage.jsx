import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate , useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import {Link} from 'react-router-dom';
import foto from '../assets/foto.jpg';  


function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const { 
      signin,
      isAuthenticated, 
      errors: SigninErrors 
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
      await signin(values);
  });

  return (
    <div className="contenedor-principal-login">
      <div className='contenedor-izquierda'> 

      <div className='imagen-registro-login'>
        <img src={foto} alt="Imagen Lateral" className="imagen-centrada" />
      </div>

    </div>

      <div className="contenedor-derecha">

        {SigninErrors.map((error, i) => (
            <div key={i} className="caja-mensaje-error">
                {error}
            </div>
        ))}

        <form onSubmit={onSubmit} className='ubicacion-formulario'>

          <div className='ubicacion-texto'>
            <h1 className="titulo-texto-principal">Inicio de sesión</h1>
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
                type="password"
                {...register("password", { required: true })}
                className="input-estilo"
                placeholder='Contraseña'
            />
            {errors.password && <p className="texto-rojo">Password es requerido</p>}
          </div>
          
          <button type="submit" className="boton-siguiente">
              Iniciar sesión
          </button>

        </form>

        <p className="flex-texto-espaciado">
          ¿No tienes una cuenta aún? 
          <Link to="/register" className="enlace">Regístrate</Link>
        </p>

      </div>
    </div>
  )
}

export default LoginPage