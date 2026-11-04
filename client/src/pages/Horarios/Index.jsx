import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { HorarioContext } from '../../context/HorarioContext';
import { horarioListRequest, updateHorarioRequest } from '../../api/horario';  
import { AsignaturaContext } from '../../context/AsignaturaContext';
import { ItinerarioContext } from '../../context/ItinerarioContext';
import { useAuth } from '../../context/AuthContext';


import Navbar from '../../components/Navbar';
import MenuLateral from '../../components/MenuLateral';

function HorariosIndex() {
  const { horarios, cargarHorarios, borrarHorario, actualizarHorario } = useContext(HorarioContext); //Cargo los horarios
  const { asignaturas, cargarAsignaturas } = useContext(AsignaturaContext); //Cargo las asignaturas
  const { itinerarios, cargarItinerarios } = useContext(ItinerarioContext); //Cargo los itinerarios
  const { user, isAuthenticated, logout, loading} = useAuth();


  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return; // Si el AuthContext todavía está verificando el token, no hacemos nada

    // Si por algún error llegamos aquí sin estar logueados (aunque el ProtectedRoute debería evitarlo)
    if (!isAuthenticated) {
        navigate("/login");
        return;
    }

    // Cargamos los datos del servidor
    cargarHorarios();
    cargarAsignaturas();
    cargarItinerarios();

  }, [isAuthenticated, loading]); // Dependemos de loading para saber cuándo actuar

  // Si está cargando la sesión, mostramos un indicador para evitar saltos de interfaz
  if (loading) {
    return <div className="cargando">Verificando sesión...</div>;
  }

  const horariosUsuario = horarios || [];
  
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const horas = ['08:30', '09:30', '10:30', '11:30', '12:30', '13:30', '14:30',
     '15:30', '16:30', '17:30', '18:30', '19:30', '20:30'];

  return (
    <div className="contenedor-principal-listado-horario">
      
      <div className='organizar-nabvar-menu'>
        <MenuLateral />    
        <Navbar />   
      </div>

      <div className='cabecera-horario'>
        <div className='titulo-vista-horarios'>
          <h1>Listado de horarios</h1>
        </div>
      </div>



      <div className="contenedor-listado-horarios">
        {horariosUsuario.map((horario) => {
        // Usamos directamente los itinerarios guardados en el propio horario 
        const itinerariosDelHorario = horario.itinerarios || [];


        return (
          <div key={horario._id}>
            <div className="contenedor-caja-horario-botones-listado-horario">
              <div className="caja-horario">
                <div className='nombre-horario'> <strong>{horario.nombre}</strong> </div>

                <div className="listado-matriz-horario">
                  {[...Array(horas.length + 1)].map((_, rowIndex) => (
                    <div key={rowIndex} className="listado-fila-horario">
                      {[...Array(diasSemana.length + 1)].map((_, colIndex) => {
                        if (rowIndex === 0) {
                          return (
                            <div key={colIndex} className="listado-celda-horario-dias">
                              {colIndex === 0 ? '' : diasSemana[colIndex - 1]}
                            </div>
                          );
                        }
                        if (colIndex === 0) {
                          return (
                            <div key={colIndex} className="listado-celda-horario-horas">
                              {horas[rowIndex - 1]}
                            </div>
                          );
                        }

                        const diaActual = diasSemana[colIndex - 1];
                        const horaInicioActual = horas[rowIndex - 1].split('-')[0];
                        const ocupadaPorAnterior = itinerariosDelHorario.some(itin => {
                          if (itin.dia?.trim() !== diaActual) return false;
                          const inicioIndex = horas.indexOf(itin.hora_inicio?.trim());
                          const esDobleHora = itin.hora_fin?.trim() === horas[inicioIndex + 2];
                          return esDobleHora && horas[inicioIndex + 1] === horaInicioActual;
                        });

                        if (ocupadaPorAnterior) return null;
                        const itinerarioEncontrado = itinerariosDelHorario.find(itin =>
                          itin.dia?.trim() === diaActual && itin.hora_inicio?.trim() === horaInicioActual
                        );
                        const inicioIndex = horas.indexOf(horaInicioActual);
                        const esDobleHora = itinerarioEncontrado &&
                          itinerarioEncontrado.hora_fin?.trim() === horas[inicioIndex + 2];

                        const rowSpan = esDobleHora ? 2 : 1;
                        const asignaturaEncontrada = itinerarioEncontrado ? horario.asignaturas.find(asig =>
                              String(asig._id) === String(itinerarioEncontrado.asignatura?._id || itinerarioEncontrado.asignatura)
                            )
                          : null;

                        return (
                          <div key={colIndex} className="listado-celda-horario" style={{ gridRow: `span ${rowSpan}` }} >
                            {itinerarioEncontrado ? (
                              <>
                                <div className='listado-celda-horario-titulo-asignatura'>
                                  {itinerarioEncontrado.nombre_asignatura || asignaturaEncontrada?.nombre || 'Asignatura'}
                                </div>
                                <div className='listado-celda-horario-caracteristicas-asignatura'>
                                  <div className='listado-celda-horario-asignatura-informacion'>{itinerarioEncontrado.modalidad}</div>
                                  <div className='listado-celda-horario-asignatura-informacion'>cuatri {asignaturaEncontrada?.cuatrimestre}</div>
                                  <div className='listado-celda-horario-asignatura-informacion'>curso {asignaturaEncontrada?.curso}</div>
                                </div>
                              </>
                            ) : (
                              <>&nbsp;</>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className='contenedor-botones-horario'>
                <button onClick={() => navigate(`/editarHorarios/${horario._id}`)} className="boton-horario">
                  Editar horario
                </button>
                <button onClick={() => borrarHorario(horario)} className="boton-horario">
                  Eliminar horario
                </button>
              </div>
            </div>
          </div>
        );
      })}
      </div>

    </div>
  );
}

export default HorariosIndex;
