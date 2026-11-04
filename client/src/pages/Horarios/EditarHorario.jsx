import React, { useContext, useEffect, useState } from 'react';
import { Link,  useNavigate, useParams } from 'react-router-dom';

import { HorarioContext } from '../../context/HorarioContext';
import { horarioListRequest, updateHorarioRequest } from '../../api/horario';  
import { AsignaturaContext } from '../../context/AsignaturaContext';
import { ItinerarioContext } from '../../context/ItinerarioContext';
import { useAuth } from '../../context/AuthContext';

import Navbar from '../../components/Navbar';
import MenuLateral from '../../components/MenuLateral';

function EditarHorario() {
  const {horarios, cargarHorarios, borrarHorario, actualizarHorario} = useContext(HorarioContext);
  const {asignaturas, cargarAsignaturas } = useContext(AsignaturaContext);
  const {itinerarios, cargarItinerarios } = useContext(ItinerarioContext);
  const {user, isAuthenticated, logout, loading } = useAuth();

  const [asignaturasSeleccionadas, setAsignaturasSeleccionadas] = useState([]);
  const [nombreHorario, setNombreHorario] = useState('');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [seleccionTemporal, setSeleccionTemporal] = useState([]);
  const [gruposSeleccionados, setGruposSeleccionados] = useState({});
  const [itinerariosSeleccionados, setItinerariosSeleccionados] = useState([]);
  const [gruposIniciales, setGruposIniciales] = useState({});
  const [gruposBorrador, setGruposBorrador] = useState({ teoria: null, practica: null });
  const [asignaturaGrupoAbierta, setAsignaturaGrupoAbierta] = useState(null);
  const [asignaturaPendiente, setAsignaturaPendiente] = useState(null);
  const { id } = useParams();

  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    cargarHorarios();
    cargarAsignaturas();
    cargarItinerarios();
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (id && horarios) {
      const horarioEncontrado = horarios.find(h => h._id === id);
      if (horarioEncontrado) {
        setNombreHorario(horarioEncontrado.nombre || "");
        const idsPrevios = horarioEncontrado.asignaturas.map(asig => asig._id || asig);
        setAsignaturasSeleccionadas(idsPrevios);

        const idsItinerariosPrevios = (horarioEncontrado.itinerarios || []).map(itin => itin._id || itin);
        setItinerariosSeleccionados(idsItinerariosPrevios);
      }
    }
  }, [id, horarios]);

  if (loading) return <div className="cargando">Verificando sesión...</div>;
  if (!horarios || !itinerarios) return <div className="cargando">Cargando datos...</div>;

  const horarioActual = horarios.find(h => h._id === id);

  const HORA_A_MIN = (hora) => {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  };

  const seSolapan = (a, b) => {
    if (a.dia?.trim() !== b.dia?.trim()) return false;
    const inicioA = HORA_A_MIN(a.hora_inicio), finA = HORA_A_MIN(a.hora_fin);
    const inicioB = HORA_A_MIN(b.hora_inicio), finB = HORA_A_MIN(b.hora_fin);
    return inicioA < finB && inicioB < finA;
  };

  const obtenerSesionesDeGrupo = (asigId, modalidad, grupo) => {
    if (!grupo) return [];
    return itinerarios
      .filter(itin =>
        String(itin.asignatura?._id || itin.asignatura) === String(asigId) &&
        itin.modalidad === modalidad &&
        itin.grupo === grupo
      )
      .map(itin => ({ dia: itin.dia, hora_inicio: itin.hora_inicio, hora_fin: itin.hora_fin }));
  };

  const obtenerSesionesOcupadas = (excluirAsigId, excluirModalidad) => {
    const sesiones = [];
    seleccionTemporal.forEach(asigId => {
      const grupos = gruposSeleccionados[asigId] || {};
      if (grupos.teoria && !(asigId === excluirAsigId && excluirModalidad === 'teoria')) {
        sesiones.push(...obtenerSesionesDeGrupo(asigId, 'teoria', grupos.teoria));
      }
      if (grupos.practica && !(asigId === excluirAsigId && excluirModalidad === 'practicas')) {
        sesiones.push(...obtenerSesionesDeGrupo(asigId, 'practicas', grupos.practica));
      }
    });
    return sesiones;
  };

  const eliminarAsignaturaDelHorario = () => {
    const asigId = asignaturaGrupoAbierta._id;
    setSeleccionTemporal(prev => prev.filter(item => item !== asigId));
    setGruposSeleccionados(prev => {
      const copia = { ...prev };
      delete copia[asigId];
      return copia;
    });
    setGruposBorrador({ teoria: null, practica: null });
    setAsignaturaGrupoAbierta(null);
  };

  if (!horarioActual) return <div className="cargando">Cargando horario...</div>;

  const itinerariosDelHorario = horarioActual.itinerarios || [];
  const itinerariosParaMostrar = menuAbierto
  ? seleccionTemporal.flatMap(asigId => {
      const grupos = gruposSeleccionados[asigId] || {};
      return itinerarios.filter(itin => {
        const mismaAsignatura = String(itin.asignatura?._id || itin.asignatura) === String(asigId);
        if (!mismaAsignatura) return false;
        if (itin.modalidad === 'teoria') return grupos.teoria != null && itin.grupo === grupos.teoria;
        if (itin.modalidad === 'practicas') return grupos.practica != null && itin.grupo === grupos.practica;
        return false;
      });
    })
  : itinerarios.filter(itin => itinerariosSeleccionados.includes(itin._id));

  const asignaturasParaMostrar = menuAbierto? asignaturas: asignaturas.filter(a => asignaturasSeleccionadas.includes(a._id));  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const horas = ['08:30', '09:30', '10:30', '11:30', '12:30', '13:30', '14:30',
    '15:30', '16:30', '17:30', '18:30', '19:30', '20:30'];

  const abrirModal = () => {
    setSeleccionTemporal([...asignaturasSeleccionadas]);

    const gi = {};
    asignaturasSeleccionadas.forEach(asigId => {
      const itinTeoria = itinerarios.find(itin =>
        itinerariosSeleccionados.includes(itin._id) &&
        String(itin.asignatura?._id || itin.asignatura) === String(asigId) &&
        itin.modalidad === 'teoria'
      );
      const itinPractica = itinerarios.find(itin =>
        itinerariosSeleccionados.includes(itin._id) &&
        String(itin.asignatura?._id || itin.asignatura) === String(asigId) &&
        itin.modalidad === 'practicas'
      );
      gi[asigId] = {
        teoria: itinTeoria?.grupo ?? null,
        practica: itinPractica?.grupo ?? null,
      };
    });

    setGruposIniciales(gi);
    setGruposSeleccionados(gi);
    setMenuAbierto(true);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (asignaturasSeleccionadas.length === 0) {
      alert("Selecciona al menos una asignatura.");
      return;
    }
    const datosHorario = {
      asignaturas: asignaturasSeleccionadas,
      itinerarios: itinerariosSeleccionados,
      nombre: nombreHorario.trim() !== '' ? nombreHorario : "Sin nombre"
    };
    try {
      await actualizarHorario(id, datosHorario);
      alert("Horario actualizado correctamente.");
      navigate('/horarios');
    } catch (error) {
      console.error(error);
      alert("Error al actualizar.");
    }
  };

const handleAceptar = () => {
  setAsignaturasSeleccionadas(seleccionTemporal);

  const idsItinerarios = seleccionTemporal.flatMap(asigId => {
    const grupos = gruposSeleccionados[asigId] || {};
    return itinerarios
      .filter(itin => {
        const mismaAsignatura = String(itin.asignatura?._id || itin.asignatura) === String(asigId);
        if (!mismaAsignatura) return false;
        if (itin.modalidad === 'teoria') return grupos.teoria != null && itin.grupo === grupos.teoria;
        if (itin.modalidad === 'practicas') return grupos.practica != null && itin.grupo === grupos.practica;
        return false;
      })
      .map(itin => itin._id);
  });

  setItinerariosSeleccionados(idsItinerarios);
  setMenuAbierto(false);
};

  const handleCancelar = () => {
    setSeleccionTemporal([...asignaturasSeleccionadas]); 
    setGruposSeleccionados(gruposIniciales);
    setAsignaturaPendiente(null);
    setGruposBorrador({ teoria: null, practica: null });
    setAsignaturaGrupoAbierta(null);
    setMenuAbierto(false);
  };

  const handleAceptarPanel = () => {
    if (!gruposBorrador.teoria && !gruposBorrador.practica) {
      alert("Debes seleccionar al menos un grupo antes de continuar.");
      return;
    }

    const asigId = asignaturaGrupoAbierta._id;

    setGruposSeleccionados(prev => ({
      ...prev,
      [asigId]: gruposBorrador
    }));

    if (asignaturaPendiente) {
      setSeleccionTemporal(prev => [...prev, asigId]);
      setAsignaturaPendiente(null);
    }

    setAsignaturaGrupoAbierta(null);
  };

  const handleCerrarPanel = () => {
    setAsignaturaPendiente(null);
    setGruposBorrador({ teoria: null, practica: null });
    setAsignaturaGrupoAbierta(null);
  };

  return (
    <div className="contenedor-principal-editar-horario">

      <div className='organizar-nabvar-menu'>
        <MenuLateral />
        <Navbar />
      </div>

      <div className='cabecera-horario'>
        <div className='titulo-vista-horarios'>
          <h1>Edición del horario</h1>
        </div>
      </div>

      <div className='contenedor-editar-horario'>
        <div className="contenedor-horario-y-nombre">
          <div className="edicion-nombre-horario">
            <input type="text" id="nombre" className="input-nombre-horario"
              value={nombreHorario}
              onChange={(e) => setNombreHorario(e.target.value)}
              placeholder="Ej: Horario de Matemáticas"
            />
          </div>

          <div className="contenedor-editar-horario-matriz">
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
                    const horaInicioActual = horas[rowIndex - 1];

                    const ocupadaPorAnterior = itinerariosParaMostrar.some(itin => {
                      if (itin.dia?.trim() !== diaActual) return false;
                      const inicioIndex = horas.indexOf(itin.hora_inicio?.trim());
                      const esDobleHora = itin.hora_fin?.trim() === horas[inicioIndex + 2];
                      return esDobleHora && horas[inicioIndex + 1] === horaInicioActual;
                    });
                    if (ocupadaPorAnterior) return null;

                    const itinerarioEncontrado = itinerariosParaMostrar.find(itin =>
                      itin.dia?.trim() === diaActual && itin.hora_inicio?.trim() === horaInicioActual
                    );

                    const inicioIndex = horas.indexOf(horaInicioActual);
                    const esDobleHora = itinerarioEncontrado &&
                      itinerarioEncontrado.hora_fin?.trim() === horas[inicioIndex + 2];
                    const rowSpan = esDobleHora ? 2 : 1;

                    const asignaturaEncontrada = itinerarioEncontrado
                      ? asignaturasParaMostrar.find(asig =>
                          String(asig._id) === String(itinerarioEncontrado.asignatura?._id || itinerarioEncontrado.asignatura)
                        )
                      : null;

                    return (
                      <div key={colIndex} className="celda-horario" style={{ gridRow: `span ${rowSpan}` }}>
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
        </div>

        <div className='contenedor-botones-horario'>
          <button type="button" className='boton-horario' onClick={() => navigate('/horarios')}>Cancelar</button>
          <button type="button" className='boton-horario' onClick={handleSubmit}>Guardar cambios</button>

          <div className="contenedor-menu-desplegable">
            <button className='boton-horario' onClick={abrirModal}>Editar Asignaturas</button>

            {menuAbierto && (
              <div className="modal-desplegable" onClick={handleCancelar}>
                <div className="modal-ventana" onClick={(e) => e.stopPropagation()}>
                  <form className='formulario-edicion-horario'>
                    <div className='contenedor-titulo-botones'>
                      <label htmlFor="asignatura" className='texto-titulo-creacion-horario'>
                        Selecciona una asignatura:
                      </label>
                      <div className="modal-botones">
                        <button className='boton-horario' onClick={handleCancelar}>Cancelar</button>
                        <button className='boton-horario' onClick={handleAceptar}>Aceptar</button>
                      </div>
                    </div>

                    <div className='edicion-horario-listado-asignaturas'>
                      {asignaturas.map((asignatura) => {
                        const isChecked = seleccionTemporal.includes(asignatura._id);

                        return (
                          <div key={asignatura._id} className="edicion-horario-fila-asignatura">
                            <label
                              className={`edicion-horario-caja-asignatura ${isChecked ? 'seleccionada' : ''}`}
                              style={{ cursor: 'pointer' }}
                              onClick={(e) => {
                                if (isChecked) {
                                  e.preventDefault();
                                  setGruposBorrador(gruposSeleccionados[asignatura._id] || { teoria: null, practica: null });
                                  setAsignaturaGrupoAbierta(asignatura);
                                }
                              }}
                            >
                              <input
                                type="checkbox"
                                value={asignatura._id}
                                checked={isChecked}
                                onChange={(e) => {
                                  const asigId = e.target.value;
                                  const yaEstabaMarcada = seleccionTemporal.includes(asigId);

                                  if (yaEstabaMarcada) {
                                    // Desmarcar directamente
                                    setSeleccionTemporal(prev => prev.filter(item => item !== asigId));
                                    setGruposSeleccionados(prev => {
                                      const copia = { ...prev };
                                      delete copia[asigId];
                                      return copia;
                                    });
                                  } else {
                                    // Nueva asignatura: abrir panel sin añadir aún
                                    setAsignaturaPendiente(asignatura);
                                    setGruposBorrador({ teoria: null, practica: null });
                                    setAsignaturaGrupoAbierta(asignatura);
                                  }
                                }}
                                style={{ display: 'none' }}
                              />
                              {asignatura.nombre}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </form>
                </div>
              </div>
            )}

            {asignaturaGrupoAbierta && (
              <div className="panel-flotante-overlay" onClick={handleCerrarPanel}>
                <div className="panel-flotante-grupos" onClick={(e) => e.stopPropagation()}>
                  <div className="panel-flotante-cabecera">
                    <h3>{asignaturaGrupoAbierta.nombre}</h3>
                    <div className="panel-flotante-botones-cabecera">
                      <button type="button" className="boton-horario" onClick={handleAceptarPanel}>
                        Aceptar
                      </button>
                      {!asignaturaPendiente && (
                        <button type="button" className="boton-horario" onClick={eliminarAsignaturaDelHorario}>
                          Eliminar del horario
                        </button>
                      )}
                      <button type="button" className="boton-horario" onClick={handleCerrarPanel}>
                        Cerrar
                      </button>
                    </div>
                  </div>

                  {['teoria', 'practicas'].map(modalidad => {
                    const gruposDeEstaModalidad = {};
                    itinerarios
                      .filter(itin =>
                        String(itin.asignatura?._id || itin.asignatura) === String(asignaturaGrupoAbierta._id) &&
                        itin.modalidad === modalidad
                      )
                      .forEach(itin => {
                        const clave = itin.grupo || 'unico';
                        if (!gruposDeEstaModalidad[clave]) gruposDeEstaModalidad[clave] = [];
                        gruposDeEstaModalidad[clave].push(itin);
                      });

                    const gruposEntries = Object.entries(gruposDeEstaModalidad);
                    if (gruposEntries.length === 0) return null;

                    const campoSeleccion = modalidad === 'teoria' ? 'teoria' : 'practica';

                    return (
                      <div key={modalidad} className="panel-flotante-seccion-modalidad">
                        <h4>{modalidad === 'teoria' ? 'Teoría' : 'Prácticas'}</h4>
                        <div className="panel-flotante-listado-grupos">
                          {gruposEntries.map(([grupo, sesiones]) => {
                            const estaSeleccionado = gruposBorrador?.[campoSeleccion] === grupo;

                            return (
                              <button
                                key={grupo}
                                type="button"
                                className={`panel-flotante-boton-grupo ${estaSeleccionado ? 'seleccionado' : ''}`}

                                onClick={() => {
                                  const sesionesNuevoGrupo = sesiones.map(s => ({ dia: s.dia, hora_inicio: s.hora_inicio, hora_fin: s.hora_fin }));

                                  const conflictos = [];
                                  seleccionTemporal.forEach(asigId => {
                                    if (asigId === asignaturaGrupoAbierta._id) return;
                                    const grupos = gruposSeleccionados[asigId] || {};

                                    ['teoria', 'practicas'].forEach(mod => {
                                      const campoMod = mod === 'teoria' ? 'teoria' : 'practica';
                                      const grupoActual = grupos[campoMod];
                                      if (!grupoActual) return;

                                      const sesionesExistentes = obtenerSesionesDeGrupo(asigId, mod, grupoActual);
                                      const choca = sesionesNuevoGrupo.some(nueva =>
                                        sesionesExistentes.some(ocupada => seSolapan(nueva, ocupada))
                                      );

                                      if (choca) {
                                        const asigNombre = asignaturas.find(a => String(a._id) === String(asigId))?.nombre || asigId;
                                        conflictos.push({ asigId, asigNombre, modalidad: mod, campo: campoMod });
                                      }
                                    });
                                  });

                                  if (conflictos.length > 0) {
                                    const nombresConflicto = conflictos.map(c => `"${c.asigNombre}" (${c.modalidad})`).join(', ');
                                    const confirmar = window.confirm(
                                      `Este grupo se solapa con: ${nombresConflicto}. ¿Deseas seleccionarlo igualmente? Se eliminará el grupo conflictivo de esa asignatura.`
                                    );
                                    if (!confirmar) return;

                                    setGruposSeleccionados(prev => {
                                      const copia = { ...prev };
                                      conflictos.forEach(c => {
                                        copia[c.asigId] = { ...copia[c.asigId], [c.campo]: null };
                                      });
                                      return copia;
                                    });
                                  }

                                  setGruposBorrador(prev => ({ ...prev, [campoSeleccion]: grupo }));
                                }}


                              >
                                <div className="panel-flotante-grupo-nombre">{grupo}</div>
                                {sesiones.map((s, idx) => (
                                  <div key={idx} className="panel-flotante-grupo-sesion">
                                    {s.dia} · {s.hora_inicio} - {s.hora_fin}
                                  </div>
                                ))}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditarHorario;