import React, { useContext, useEffect, useState  } from 'react';
import { Link, useNavigate} from 'react-router-dom';

import { AsignaturaContext } from '../../context/AsignaturaContext';
import { ItinerarioContext } from '../../context/ItinerarioContext';
import { useAuth } from '../../context/AuthContext';

import Navbar from '../../components/Navbar';
import MenuLateral from '../../components/MenuLateral';

function DetalleItinerario({asignaturaId}) {
  const { cargarItinerariosPorAsignatura } = useContext(ItinerarioContext); 

  useEffect(() => {
    const obtenerDatos = async => {
      const datos = cargarItinerariosPorAsignatura(asignaturaId);
      setItinerarios(datos);

    };

    obtenerDatos();
  }, [asignaturaId]);
}

function AsignaturasIndex() {
  const { asignaturas, cargarAsignaturas } = useContext(AsignaturaContext); // Cargo las asignaturas
  const { itinerarios, cargarItinerarios } = useContext(ItinerarioContext); //Cargo los itinerarios
  const { user, isAuthenticated, logout } = useAuth(); // cargo el usuario registrado si lo estuviera
  
  const [cursoActual, setCursoActual] = useState(1);
  const [cuatriActual, setcCuatriActual] = useState(1);
  
  const navigate = useNavigate(); 
  
  useEffect(() => {
    cargarAsignaturas();
    cargarItinerarios();
  }, []);

   // Agrupamos las asignaturas por curso
  const asignaturasPorCurso = asignaturas.reduce((acc, asignatura) => {
    const curso = asignatura.curso;
    if (!acc[curso]) acc[curso] = [];
    acc[curso].push(asignatura);
    return acc;
  }, {});

  const cursosOrdenados = Object.keys(asignaturasPorCurso).sort((a, b) => a - b);


  return (
    
    <div className="contenedor-principal-asignaturas">
 
      <div className='organizar-nabvar-menu'>
        <MenuLateral />    
        <Navbar />   
      </div>

      <div className='cabecera-asignaturas'>
        <div className='titulo-vista-asignaturas'>
          <h1>Lista de Asignaturas</h1>
        </div>
        
      </div>

      {cursosOrdenados.map((curso) => (
          <div key={curso} className='bloque-curso'>

            <div className='separador-curso'>
              <span className='texto-separador-curso'>Curso {curso}</span>
              <div className='linea-separador-curso'></div>
            </div>

            <div className='lista-asignaturas'>
              {asignaturasPorCurso[curso].map((asignatura) => (
                <div key={asignatura._id} className="caja-asignatura">

                  <div className='titulo-asignatura'>
                    <strong>{asignatura.nombre}</strong>
                  </div>

                  <div className='contenedor-etiquetas-asignatura'>
                    <div className='etiqueta-asignatura'>
                      <div className='texto-etiqueta-asignatura'>
                        Curso {asignatura.curso}
                      </div>
                    </div>

                    <div className='etiqueta-asignatura'>
                      <div className='texto-etiqueta-asignatura'>
                        Cuatri {asignatura.cuatrimestre}
                      </div>
                    </div>

                    <div className='etiqueta-asignatura'>
                      <div className='texto-etiqueta-asignatura'>
                        Dificultad {asignatura.dificultad} 
                      </div>
                    </div>
                  </div>

                  <div className='contenedor-horario-asignatura'>
                    {(() => {
                      const filterItinerarios = itinerarios.filter((it) => {
                        const idDelItinerario = String(it.asignatura?._id || it.asignatura);
                        const idDeLaAsignatura = String(asignatura._id);
                        return idDelItinerario === idDeLaAsignatura;
                      });

                      if (filterItinerarios.length === 0) {
                        return <p className='texto_itinerario_asignatura'>No se han encontrado horarios</p>;
                      } else {
                        return (
                          <div className='texto_itinerario_asignatura'>
                            <strong>Teoria</strong>
                            {filterItinerarios.filter(it => it.modalidad === 'teoria').map((it) => (
                              <div key={it._id}>
                                <div>
                                  <p>{it.grupo} - {it.dia} - {it.hora_inicio} - {it.hora_fin}</p>
                                </div>
                              </div>
                            ))}

                            <strong>Practicas</strong>
                            {filterItinerarios.filter(it => it.modalidad === 'practicas').map((it) => (
                              <div key={it._id}>
                                <div>
                                  <p>{it.grupo} - {it.dia} - {it.hora_inicio} - {it.hora_fin}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }
                    })()}
                  </div>

                  {asignatura.prerequisitos.length > 0 &&
                    <div className='contenedor-dependencias-asignatura'>
                      <div className='texto-dependencias-asignatura'>
                        <p><strong>Asignaturas previas</strong></p>
                        {asignatura.prerequisitos.map((preId) => {
                          const asigRequisito = asignaturas.find(asig => String(asig._id) === String(preId));
                          if (!asigRequisito) return null;
                          return (
                            <div key={String(preId)}>
                              <p> - {asigRequisito.nombre}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  }

                </div>
              ))}
            </div>
          </div>
        ))}

    </div>
  );
}

export default AsignaturasIndex;
  