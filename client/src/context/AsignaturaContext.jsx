import { createContext, useState, useEffect } from "react";
import { asignaturaListRequest } from "../api/asignatura";

// creamos el contexto
export const AsignaturaContext = createContext();

// Hook personalizado para usar el contexto
export const useAsignatura = () => {
  const context = useContext(AsignaturaContext);
  if (!context) {
    throw new Error("useAsignatura must be used within an AuthProvider");
  }
  return context;
};

// Proveedor del contexto
export const AsignaturaProvider = ({ children }) => {
  const [asignaturas, setAsignaturas] = useState([]);

  const cargarAsignaturas = async () => {
    try {
      const res = await asignaturaListRequest();
      setAsignaturas(res.data);
    } catch (error) {
      console.error("Error al cargar asignaturas:", error);
    }
  };

  useEffect(() => {
    cargarAsignaturas();
  }, []);

  return (
    <AsignaturaContext.Provider value={{ asignaturas, cargarAsignaturas }}>
      {children}
    </AsignaturaContext.Provider>
  );
};
