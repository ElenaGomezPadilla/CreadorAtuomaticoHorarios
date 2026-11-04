import React, { useContext, useEffect } from 'react';
import {Link, useNavigate} from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import Navbar from '../components/Navbar';
import MenuLateral from '../components/MenuLateral';

function HomePage(){
    const { isAuthenticated, loading, user , logout} = useAuth();

    if (loading) return null;

    return (
        <div className='home-page'>

          <div className='organizar-nabvar-menu'>
            <MenuLateral />    
            <Navbar />   
          </div>
          
          <div className='body-home-page'>
            <div className='home-page-bloques-principales'>



              <div className='home-page-bloque-texto'>
                <div className='home-page-texto-principal'>
                    Organiza tu horario académico en minutos 
                </div>

                <div className='home-page-sub-texto-principal'>
                    Elige tus asignaturas, comprueba los horarios disponibles y genera tu aplicación sin complicaciones
                </div>

              </div>

              <div className='home-page-bloque-botones'>
                <Link to="/horarios" className="home-page-boton-ver-horario">
                    Ver horarios
                </Link>  

                
                <Link to="/crearHorarios" className="home-page-boton-crear-horario">
                  Crear un nuevo horario
                </Link> 

                <Link to="/asignaturas" className="home-page-boton-ver-asignaturas">
                  Ver listado a signaturas 
                </Link> 
              </div>


            </div>
          </div>


        </div>
    );
}

export default HomePage