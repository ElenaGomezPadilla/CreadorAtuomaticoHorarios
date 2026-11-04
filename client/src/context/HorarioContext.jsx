import { createContext, useState, useEffect, useContext } from "react";
import { crearHorarioRequest, crearHorariosPersonalizadosRequest, horarioListRequest, deteleHorarioRequest, updateHorarioRequest } from "../api/horario";

// Creamos el contexto
export const HorarioContext = createContext();

// Hook personalizado para usar el contexto
export const useHorario  = () => {
  const context = useContext(HorarioContext);
  if (!context) {
    throw new Error("useHorario  must be used within an AuthProvider");
  }
  return context;
};
 
// Proveedor del contexto 
export const HorarioProvider = ({ children }) => {
  const [horarios, setHorarios] = useState(null); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const cargarHorarios = async () => {
    try {
      const res = await horarioListRequest();
      setHorarios(res.data);
    } catch (error) {
      console.error("Error al cargar horarios:", error);
    }
  };

  const crearHorario = async (nuevoHorario, isAuthenticated, navigate) => {
    try {
      const response = await crearHorarioRequest(nuevoHorario);
      const horarioCreado = response.data;

      if (!isAuthenticated) {
        // 1. Guardamos en el "disco duro" del navegador
       localStorage.setItem('horarioInvitado', JSON.stringify(horarioCreado));
      
        // 2. IMPORTANTE: Actualiza el estado de horarios en tu Contexto
        // Suponiendo que tienes un [horarios, setHorarios] = useState([])
        setHorarios([horarioCreado]); 
      
        alert("Horario de invitado guardado en este navegador.");      
    }


      alert("Horario creado correctamente.");
      navigate('/horarios');
    } catch (error) {
      console.error(error);
      alert("Hubo un error al crear el horario.");
    }
  };

  const crearHorariosPersonalizados = async (parametros, preferencias, isAuthenticated, navigate) => {
    try {
      
      alert("Horario de invitado guardado en este navegador.");      

      const response = await crearHorariosPersonalizadosRequest({ ...parametros, preferencias });
      setSoluciones(response.data);
      setPasoActual(5);

      alert("Horarios creados correctamente.");
      navigate('/horarios');
    } catch (error) {
      console.error(error);
      alert("Hubo un error al crear el horario.");
    }
  };

  const borrarHorario = async (horario, isAuthenticated) => {
    try {
      await deteleHorarioRequest(horario._id);

      setHorarios((prev) => {
        const filtrados = prev.filter(h => String(h._id) !== String(horario._id));
        return filtrados;
      });

      alert("Horario eliminado correctamente.");
    } catch (error) {
      console.error(error);
      alert("Error al eliminar el horario del servidor.");
    }
  
  };

  
  const actualizarHorario = async (id, datosActualizados) => {
    try {
        const response = await updateHorarioRequest(id, datosActualizados);
      
        // Actualizamos el estado local para que la vista se refresque al instante
        setHorarios((prev) => 
        prev.map(h => (h._id === id ? response.data : h))
      );
    
      return response.data;
    } catch (error) {
      console.error("Error al actualizar:", error);
      throw error;
    }
  };

  useEffect(() => {
    cargarHorarios();
  }, []);

  return (
    <HorarioContext.Provider value={{ horarios, cargarHorarios, crearHorario, crearHorariosPersonalizados, borrarHorario ,actualizarHorario  }}>
      {children}
    </HorarioContext.Provider>
  );
};