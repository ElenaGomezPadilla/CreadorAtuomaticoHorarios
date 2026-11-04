import { createContext, useState, useEffect } from "react";
import { itinerarioListRequest , itinerarioPorAsiganturaListRequest } from "../api/itinerario";

// creamos el contexto
export const ItinerarioContext = createContext();

// Hook personalizado para usar el contexto
export const useItinerario = () => {
  const context = useContext(ItinerarioContext);
  if (!context) {
    throw new Error("useItinerario must be used within an AuthProvider");
  }
  return context;
};

// Proveedor del contexto
export const ItinerarioProvider = ({ children }) => {
  const [itinerarios, setItinerario] = useState([]);

  const cargarItinerarios = async () => {
    try {
      const res = await itinerarioListRequest();
      setItinerario(res.data);
    } catch (error) {
      console.error("Error al cargar itinerarios:", error);
    }
  };

  const cargarItinerariosPorAsignatura = async (asignaturaId) => {
    try {
      const res = await itinerarioPorAsiganturaListRequest(asignaturaId);
      setItinerario(res.data);
    } catch (error) {
      console.error("Error al cargar itinerarios por asignatura:", error);
    }
  };

  useEffect(() => {
    cargarItinerarios();
   }, []);

  return (
    <ItinerarioContext.Provider value={{ itinerarios, cargarItinerarios , cargarItinerariosPorAsignatura}}>
      {children}
    </ItinerarioContext.Provider>
  );
};
