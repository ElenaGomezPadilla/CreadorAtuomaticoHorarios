import React, { useContext, useEffect, useState } from 'react';
import { Link,  useNavigate } from 'react-router-dom';
import { MultiSelect } from 'primereact/multiselect';

import { AsignaturaContext } from '../../context/AsignaturaContext';
import { ItinerarioContext } from '../../context/ItinerarioContext';
import { useAuth } from '../../context/AuthContext';
import { crearHorarioRequest, crearHorariosPersonalizadosRequest } from '../../api/horario';  

import Navbar from '../../components/Navbar';
import MenuLateral from '../../components/MenuLateral';

function CrearHorario() {
  const { asignaturas, cargarAsignaturas } = useContext(AsignaturaContext);
  const { user, isAuthenticated, logout, loading } = useAuth();
  const {itinerarios, cargarItinerarios } = useContext(ItinerarioContext); 
  const [asignaturasCursadas, setAsignaturasCursadas] = useState([]);
  const [asignaturasExcluidas, setAsignaturasExcluidas] = useState([]); 
  const [asignaturasDeseadas, setAsignaturasDeseadas] = useState([]);
  const [nombreHorario, setNombreHorario] = useState('');
  const [filtros, setFiltros] = useState({
  turno: [],
  curso: [],
  dificultad: [],
  cuatrimestre: [],
  tam: 0
});

const [soluciones, setSoluciones] = useState([]);
const [warnings, setWarnings] = useState([]); 
const navigate = useNavigate();

  useEffect(() => {
    if (loading) return; // Si el AuthContext todavía está verificando el token, no hacemos nada
    if (isAuthenticated) {
      cargarAsignaturas();
    }

    cargarItinerarios();

  }, [isAuthenticated, user]);



  const handleSubmit = async (event) => {
    event.preventDefault();

    if (asignaturasCursadas.length === asignaturas.length) {
      alert("Todas las asignaturas han sido cursadas, ¡Enhorabuena!");
      return;
    }

    if (asignaturasExcluidas.length === asignaturas.length) {
      alert("No podemos crear un horario sin asignaturas");
      return;
    }

    if (filtros.cuatrimestre.length !== 1) {
      alert("Debes seleccionar un único cuatrimestre.");
      return;
    }

    if (filtros.tam == 0) {
      alert("El horario debe tener al menos 1 asignatura.");
      return;
    }

    if (filtros.tam > 8) {
      alert("No se deberían cursas más de 8 asignaturas por cuatrimestre.");
      return;
    }

    const parametros = {
      asignaturasCursadas,
      asignaturasExcluidas, 
      asignaturasDeseadas
    }

    const preferencias = {
      curso: filtros.curso,
      turno: filtros.turno, 
      dificultad: filtros.dificultad,
      cuatrimestre: filtros.cuatrimestre,
      tam: filtros.tam
    }

    try {
      const token = user?.token || null;
      console.log("Enviando:", { ...parametros, preferencias });
      const respuesta = await crearHorariosPersonalizadosRequest({ ...parametros, preferencias });

      if (respuesta.data.prerequisitosOmitidos) {
        alert("No se encontró un horario respetando prerrequisitos. Se generó uno ignorándolos.");
      } else {
        alert("Horarios creados correctamente.");
      }

      setSoluciones(respuesta.data.horarios);       
      setWarnings(respuesta.data.warnings || []);

      setPasoActual(5); 

    } catch (error) {
      console.error(error);
      const mensaje = error.response?.data?.message || "Hubo un error al crear el horario.";
      alert(mensaje);
    }
    
  };

  const guardarHorario = async (solucion, index) => {
    const idsAsignaturas = solucion.map(asig => asig._id);

    if (idsAsignaturas.length === 0) {
      alert("Selecciona al menos una asignatura.");
      return;
    }

    const idsItinerarios = solucion.flatMap(asig => {
      return itinerarios
        .filter(itin => {
          const idAsignaturaItin = String(itin.asignatura?._id || itin.asignatura);
          const mismaAsignatura = idAsignaturaItin === String(asig._id);
          if (!mismaAsignatura) return false;

          if (itin.modalidad === 'teoria') {
            if (asig.grupoTeoriaElegido == null) return false;
            return itin.grupo === asig.grupoTeoriaElegido;
          }

          if (itin.modalidad === 'practicas') {
            if (asig.grupoPracticaElegido == null) return false;
            return itin.grupo === asig.grupoPracticaElegido;
          }

          return false;
        })
        .map(itin => itin._id);
    });

    const datosHorario = {
      asignaturas: idsAsignaturas,
      itinerarios: idsItinerarios,
      nombre: nombreHorario.trim() !== '' ? nombreHorario : "Sin nombre"
    };

    try {
      await crearHorarioRequest(datosHorario);
      alert("Horario creado correctamente.");
      navigate('/horarios');
    } catch (error) {
      console.error(error);
      alert("Error al crear el horario.");
    }
  };


  const toggleFiltro = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: prev[campo].includes(valor)
        ? prev[campo].filter(v => v !== valor) 
        : [...prev[campo], valor]               
    }));
  };

  const handleInputChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor === '' ? '' : Number(valor) // Convierte el texto a número
    }));
  };

  const [pasoActual, setPasoActual] = useState(1);

  
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const horas = ['08:30-09:30', '09:30-10:30', '10:30-11:30', '11:30-12:30', '12:30-13:30', '13:30-14:30', '14:30-15:30',
      '15:30-16:30', '16:30-17:30', '17:30-18:30', '18:30-19:30', '19:30-20:30', '20:30-21:30'];
const horasInicio = horas.map(h => h.split('-')[0]);


  const asignaturasPorCurso = asignaturas.reduce((acc, asignatura) => {
    const curso = asignatura.curso;
    if (!acc[curso]) acc[curso] = [];
    acc[curso].push(asignatura);
    return acc;
  }, {});

  const cursosOrdenados = Object.keys(asignaturasPorCurso).sort((a, b) => a - b);

  useEffect(() => {
    if (pasoActual === 5) {
      console.log("=== REVISANDO DATOS EN PASO 5 ===");
      console.log("Cantidad de opciones devueltas:", soluciones.length);
      console.log("Estructura de la Opción 1 recibida:", soluciones[0]);
      
      // Imprimimos la lista completa de itinerarios de la base de datos para comparar IDs
      console.log("Todos los itinerarios del Contexto:", itinerarios);
    }
  }, [pasoActual, soluciones, itinerarios]);

  return (
    <div className="contenedor-principal-crear-horario">

      <div className='organizar-nabvar-menu'>
        <MenuLateral />    
        <Navbar />   
      </div>

      <div className='cabecera-horario'>
        <div className='titulo-vista-horarios'>
          <h1>Crear horario personalizado</h1>
        </div>
      </div>


      <div className="contenedor-wizard">
        {pasoActual === 1 && (
          <div className="paso paso-cursadas">

            <div className='titulo-contenedor-creacion-horario'> 
              <h1> Selecciona las asignaturas ya cursadas</h1>
            </div>


              <div className='contenedor-botones-creacion-horario'>

                <div className='contenedor-botones-filtros-curso-creacion-horario'>
                  {[1, 2, 3, 4].map(curso => {
                    const idsDelCurso = asignaturas
                      .filter(asig => Number(asig.curso) === curso)
                      .map(asig => asig._id);

                    const todasYaMarcadas = idsDelCurso.length > 0 && idsDelCurso.every(id => asignaturasCursadas.includes(id));

                    return (
                      <button key={curso} type="button" className='boton-individual-general' onClick={() => {
                          setAsignaturasCursadas(prev =>
                            todasYaMarcadas
                              ? prev.filter(id => !idsDelCurso.includes(id))
                              : [...new Set([...prev, ...idsDelCurso])]
                          );
                        }}
                      >
                        {todasYaMarcadas ? `Quitar ${curso}º curso` : `Seleccionar ${curso}º curso`}
                      </button>
                    );
                  })}
                </div>

                <div className='contenedor-botones-navegacion-creacion-horario'> 
                  <button className='boton-individual-general' onClick={() => setPasoActual(2)}>Siguiente</button>
                </div>

              </div>

            <div className='cuerpo-contenedor-creacion-horario'> 

              <div className='creacion-horario-listado-asignaturas'>

                {cursosOrdenados.map((curso) => (
                  <div key={curso} className='bloque-curso-creacion-horario'>

                    <div className='separador-curso'>
                      <span className='texto-separador-curso'>Curso {curso}</span>
                      <div className='linea-separador-curso'></div>
                    </div>

                    <div className='listado-asignaturas-creacion-horario'>

                      {asignaturasPorCurso[curso].map((asignatura) => {
                        const isChecked = asignaturasCursadas.includes(asignatura._id);

                        return (
                          <label 
                            key={asignatura._id} 
                            className={`creacion-horario-caja-asignatura ${isChecked ? 'seleccionada' : ''}`}
                            style={{ cursor: 'pointer' }}
                          >
                            <input
                              type="checkbox"value={asignatura._id}checked={isChecked}onChange={(e) => {
                                const id = e.target.value;
                                setAsignaturasCursadas(prev => prev.includes(id)? prev.filter(item => item !== id): [...prev, id]
                              );  }}
                              style={{ display: 'none' }}
                            />


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

                          </label>
                        );
                      })}
                   </div>

                  </div>
                ))}
              </div>

            </div>
          </div>
        )}


        {pasoActual === 2 && (
          <div className="paso paso-excluidas">

            <div className='titulo-contenedor-creacion-horario'> 
              <h1> Selecciona las asignaturas que no te interese cursar este curso</h1>
            </div>

            <div className='contenedor-botones-creacion-horario'>

              <div className='contenedor-botones-filtros-curso-creacion-horario'>
                {[1, 2, 3, 4].map(curso => {
                  const idsDelCurso = asignaturas
                    .filter(asig => !asignaturasCursadas.includes(asig._id) && Number(asig.curso) === curso)
                    .map(asig => asig._id);

                  const todasYaMarcadas = idsDelCurso.length > 0 && idsDelCurso.every(id => asignaturasExcluidas.includes(id));

                  return (
                    <button key={curso} type="button" className='boton-individual-general' onClick={() => {
                        setAsignaturasExcluidas(prev =>
                          todasYaMarcadas
                            ? prev.filter(id => !idsDelCurso.includes(id))
                            : [...new Set([...prev, ...idsDelCurso])]
                        );
                      }}
                    >
                      {todasYaMarcadas ? `Quitar ${curso}º curso` : `Seleccionar ${curso}º curso`}
                    </button>
                  );
                })}
              </div>

              <div className='contenedor-botones-navegacion-creacion-horario'> 
                <button className='boton-individual-general' onClick={() => setPasoActual(1)}>Anterior</button>
                <button className='boton-individual-general' onClick={() => setPasoActual(3)}>Siguiente</button>
              </div>

            </div>

            <div className='cuerpo-contenedor-creacion-horario'> 

              <div className='creacion-horario-listado-asignaturas'>

                {cursosOrdenados.map((curso) => {
                  const asignaturasDisponiblesDelCurso = asignaturasPorCurso[curso].filter(
                    asig => !asignaturasCursadas.includes(asig._id)
                  );

                  if (asignaturasDisponiblesDelCurso.length === 0) return null;

                  return (
                    <div key={curso} className='bloque-curso-creacion-horario'>

                      <div className='separador-curso'>
                        <span className='texto-separador-curso'>Curso {curso}</span>
                        <div className='linea-separador-curso'></div>
                      </div>

                      <div className='listado-asignaturas-creacion-horario'>

                        {asignaturasDisponiblesDelCurso.map((asignatura) => {
                          const isChecked = asignaturasExcluidas.includes(asignatura._id);

                          return (
                            <label 
                              key={asignatura._id} 
                              className={`creacion-horario-caja-asignatura ${isChecked ? 'seleccionada' : ''}`}
                              style={{ cursor: 'pointer' }}
                            >
                              <input type="checkbox" value={asignatura._id} checked={isChecked}onChange={(e) => {
                                  const id = e.target.value;
                                  setAsignaturasExcluidas(prev => prev.includes(id)? prev.filter(item => item !== id): [...prev, id]
                                  );
                                }}
                                style={{ display: 'none' }}
                              />

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

                            </label>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}

              </div>

            </div>
          </div>
        )}

        {pasoActual === 3 && (
          <div className="paso paso-deseadas">

            <div className='titulo-contenedor-creacion-horario'> 
              <h1> Selecciona las asignaturas que si te interese cursar este curso</h1>
            </div>

            <div className='contenedor-botones-creacion-horario'>

              <div className='contenedor-botones-filtros-curso-creacion-horario'>
                {[1, 2, 3, 4].map(curso => {
                  const idsDelCurso = asignaturas
                    .filter(asig =>
                      !asignaturasCursadas.includes(asig._id) &&
                      !asignaturasExcluidas.includes(asig._id) &&
                      Number(asig.curso) === curso
                    )
                    .map(asig => asig._id);

                  const todasYaMarcadas = idsDelCurso.length > 0 && idsDelCurso.every(id => asignaturasDeseadas.includes(id));

                  return (
                    <button
                      key={curso}
                      type="button"
                      className='boton-individual-general'
                      onClick={() => {
                        setAsignaturasDeseadas(prev =>
                          todasYaMarcadas
                            ? prev.filter(id => !idsDelCurso.includes(id))
                            : [...new Set([...prev, ...idsDelCurso])]
                        );
                      }}
                    >
                      {todasYaMarcadas ? `Quitar ${curso}º curso` : `Seleccionar ${curso}º curso`}
                    </button>
                  );
                })}
              </div>

              <div className='contenedor-botones-navegacion-creacion-horario'> 
                <button className='boton-individual-general' onClick={() => setPasoActual(2)}>Anterior</button>
                <button className='boton-individual-general' onClick={() => setPasoActual(4)}>Siguiente</button>
              </div>

            </div>

            <div className='cuerpo-contenedor-creacion-horario'> 

              <div className='creacion-horario-listado-asignaturas'>

                {cursosOrdenados.map((curso) => {
                  const asignaturasDisponiblesDelCurso = asignaturasPorCurso[curso].filter(
                    asig => !asignaturasCursadas.includes(asig._id) && !asignaturasExcluidas.includes(asig._id)
                  );

                  if (asignaturasDisponiblesDelCurso.length === 0) return null;

                  return (
                    <div key={curso} className='bloque-curso-creacion-horario'>

                      <div className='separador-curso'>
                        <span className='texto-separador-curso'>Curso {curso}</span>
                        <div className='linea-separador-curso'></div>
                      </div>

                      <div className='listado-asignaturas-creacion-horario'>

                        {asignaturasDisponiblesDelCurso.map((asignatura) => {
                          const isChecked = asignaturasDeseadas.includes(asignatura._id);

                          return (
                            <label 
                              key={asignatura._id} 
                              className={`creacion-horario-caja-asignatura ${isChecked ? 'seleccionada' : ''}`}
                              style={{ cursor: 'pointer' }}
                            >
                              <input
                                type="checkbox"
                                value={asignatura._id}
                                checked={isChecked}
                                onChange={(e) => {
                                  const id = e.target.value;
                                  setAsignaturasDeseadas(prev => 
                                    prev.includes(id)
                                      ? prev.filter(item => item !== id)
                                      : [...prev, id]
                                  );
                                }}
                                style={{ display: 'none' }}
                              />

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

                            </label>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}

              </div>

            </div>
          </div>
        )}


        {pasoActual === 4 && (
          <div className="paso">
        
            <div className='titulo-contenedor-creacion-horario'> 
              <h1> Seleccione los parámetros que desee</h1>
            </div>

            <div className='contenedor-botones-navegacion-creacion-horario-parametros'> 
              <button className='boton-individual-general' onClick={() => setPasoActual(3)}>Anterior</button>         
              <button type="button" onClick={handleSubmit} className='boton-individual-general'>Crear horario</button>
            </div>



            <div className='cuerpo-contenedor-creacion-horario-parametros'> 
              <div className='filtros-creacion-horario'> 
                <div className="grupo-filtro">
                  <p>Cursos prioritarios</p>
                  <div className="lista-botones-filtro">
                    {[{valor: '1', label: '1º'}, {valor: '2', label: '2º'}, {valor: '3', label: '3º'}, {valor: '4', label: '4º'}].map(({valor, label}) => (
                      <button
                        key={valor}
                        className={`boton-filtro ${filtros.curso.includes(valor) ? 'activo' : ''}`}
                        onClick={() => toggleFiltro('curso', valor)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className='filtros-creacion-horario'> 


                  {/* Filtro dificultad */}
                  <div className="grupo-filtro">
                    <p>Dificultad media del horario</p>
                    <div className="lista-botones-filtro">
                      {['todos', 'baja', 'media', 'moderada', 'alta', 'critica'].map(valor => (
                        <button
                          key={valor}
                          className={`boton-filtro ${filtros.dificultad.includes(valor) ? 'activo' : ''}`}
                          onClick={() => toggleFiltro('dificultad', valor)}
                        >
                          {valor === 'todos' ? 'Cualquiera' : valor}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filtro cuatrimestre */}
                  <div className="grupo-filtro">
                    <p>Seleccione el cuatrimestre del horario</p>
                    <div className="lista-botones-filtro">
                      {[{valor: '1', label: '1º'}, {valor: '2', label: '2º'}].map(({valor, label}) => (
                        <button
                          key={valor}
                          className={`boton-filtro ${filtros.cuatrimestre.includes(valor) ? 'activo' : ''}`}
                          onClick={() => {
                            const nuevoValor = filtros.cuatrimestre.includes(valor) ? [] : [valor];
                            setFiltros(prev => ({ ...prev, cuatrimestre: nuevoValor }));
                            }}
                          >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filtro cantidad de asignaturas */}
                  <div className="grupo-filtro">
                    <p>Cantidad de asignaturas</p>
                    <div className="contenedor-input-filtro">
                      <input type="number" min="1" max="12" className="input-filtro-num" placeholder="Ej. 5" value={filtros.tam || ''}  
                        onChange={(e) => handleInputChange('tam', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Filtro Turno */}
                  <div className="grupo-filtro">
                    <p>Turno/s deseados</p>
                    <div className="lista-botones-filtro">
                      {[{ valor: 'mañana', label: 'Mañana' }, { valor: 'tarde', label: 'Tarde' }
                      ].map(({ valor, label }) => (
                        <button key={valor} className={`boton-filtro ${filtros.turno.includes(valor) ? 'activo' : ''}`} onClick={() => toggleFiltro('turno', valor)} >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

        {pasoActual === 5 && (
          <div className="paso">

              <div className='cabecera-paso-horarios-generados'>
                <div className='titulo-contenedor-creacion-horario'> 
                  <h1>Estos son los horarios generados según los parámetros</h1> 
                </div>

                <div className='contenedor-botones-navegacion-creacion-horario-parametros'> 
                  <button className='boton-individual-general' onClick={() => setPasoActual(4)}>Anterior</button>  
                </div>
              </div>


              {warnings.length > 0 && (
      <div className="contenedor-warnings-horario">
        {warnings.map((warning, idx) => (
          <div key={idx} className="warning-horario">
            {warning}
          </div>
        ))}
      </div>
    )}

            <div className='cuerpo-contenedor-creacion-horario-generado'> 

             <div className="listado-horarios-generados">

              {Array.isArray(soluciones) && soluciones.map((solucion, index) => {

                // Construimos, para esta solución, una lista plana de eventos a pintar
                // cada sesión de teoría o práctica de cada asignatura, ya resuelta por el backend.
                const eventos = solucion.flatMap(asig => {
                  const eventosTeoria = (asig.sesionesTeoria || []).map(sesion => ({
                    ...sesion,
                    modalidad: 'teoria',
                    grupo: asig.grupoTeoriaElegido,
                    nombre: asig.nombre,
                    cuatrimestre: asig.cuatrimestre,
                    curso: asig.curso,
                  }));
                  const eventosPractica = (asig.sesionesPractica || []).map(sesion => ({
                    ...sesion,
                    modalidad: 'practicas',
                    grupo: asig.grupoPracticaElegido,
                    nombre: asig.nombre,
                    cuatrimestre: asig.cuatrimestre,
                    curso: asig.curso,
                  }));
                  return [...eventosTeoria, ...eventosPractica];
                });

                return (
                  <div key={index} className="opcion-horario-generado">  

                
                  
                  

                  <div className="edicion-nombre-horario">
                    <input type="text" id="nombre" className="input-nombre-horario"
                      value={nombreHorario}
                      onChange={(e) => setNombreHorario(e.target.value)}
                      placeholder="Ej: Horario de Matemáticas"
                    />

                    <button type="button" className='boton-crear-horario' onClick={() => guardarHorario(solucion, index)}>
                      Guardar este horario
                    </button>
    
                  </div>

                    <div className="matriz-horario">
                      {[...Array(horas.length + 1)].map((_, rowIndex) => (
                        <div key={rowIndex} className="fila-horario">
                          {[...Array(diasSemana.length + 1)].map((_, colIndex) => {

                            if (rowIndex === 0) {
                              return (
                                <div key={colIndex} className="celda-horario-dias">
                                  {colIndex === 0 ? '' : diasSemana[colIndex - 1]}
                                </div>
                              );
                            }

                            if (colIndex === 0) {
                              return (
                                <div key={colIndex} className="celda-horario-horas">
                                  {horas[rowIndex - 1]}
                                </div>
                              );
                            }

                            const diaActual = diasSemana[colIndex - 1];
                            const horaInicioActual = horasInicio[rowIndex - 1];

                            const ocupadaPorAnterior = eventos.some(ev => {
                              if (ev.dia !== diaActual) return false;
                              const inicioIndex = horasInicio.indexOf(ev.hora_inicio);
                              const esDobleHora = ev.hora_fin === horasInicio[inicioIndex + 2];
                              return esDobleHora && horasInicio[inicioIndex + 1] === horaInicioActual;
                            });
                            if (ocupadaPorAnterior) return null;

                            const eventosEnCelda = eventos.filter(ev =>
                              ev.dia === diaActual && ev.hora_inicio === horaInicioActual
                            );

                            const inicioIndex = horasInicio.indexOf(horaInicioActual);
                            const esDobleHora = eventosEnCelda.some(ev => ev.hora_fin === horasInicio[inicioIndex + 2]);
                            const rowSpan = esDobleHora ? 2 : 1;

                            return (
                              <div key={colIndex} className="celda-horario" style={{ gridRow: `span ${rowSpan}` }}>
                                {eventosEnCelda.map((ev, idx) => (
                                  <div key={idx} className="celda-horario-titulo-asignatura">
                                    {ev.nombre}
                                    <div className='celda-horario-caracteristicas-asignatura'>
                                      <div className='celda-horario-asignatura-informacion'>{ev.modalidad}</div>
                                      {ev.grupo && (<div className='celda-horario-asignatura-informacion'>{ev.grupo}</div>)}
                                      <div className='celda-horario-asignatura-informacion'>{ev.cuatrimestre} cuatri</div>
                                      <div className='celda-horario-asignatura-informacion'>{ev.curso} curso</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                  </div>
                );
              })}
            </div>

           

            </div>

          </div>
        )}

      </div>
    </div>

  );
}

export default CrearHorario;
