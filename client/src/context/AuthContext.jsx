import { useEffect, createContext, useContext, useState} from "react";
import { registerRequest, loginRequest, logoutRequest, verifyTokenRequest} from "../api/auth";
import Cookies from 'js-cookie';

// Creamos el contexto
export const AuthContext = createContext();

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); 
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);


  // Limpieza de errores a los 5 segundos 
  useEffect(() => {
    if (errors.length > 0) {
      const timer = setTimeout(() => {
        setErrors([]);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errors]);


  
  const signup = async (user) => {
    try {
      const res = await registerRequest(user);
      if (res.status === 201) {
        setUser(res.data);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log(error.response.data);
      setErrors(error.response.data.message);
    }
  };

  const signin = async (user) => {
    try {
        const res = await loginRequest(user);
        
        setUser(res.data);
        setIsAuthenticated(true);
    } catch (error) {
      setErrors(error.response.data || ["Error al iniciar sesión"]  );
    }
  };

  const logout = async (user) => {
    try{

      // 1. Le pedimos al backend que limpie la cookie httpOnly
      await logoutRequest();

      // 2. Limpiamos el estado de React
      setUser(null);
      setIsAuthenticated(false);

    }catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };


  useEffect(() => {
    const checkLogin = async () => {

      try {
        const res = await verifyTokenRequest();

        if (!res.data) {
           console.error("1. Fallo de autenticación:", res.data);
           setIsAuthenticated(false);
           setLoading(false);
            return
        }

          setIsAuthenticated(true);
          setUser(res.data);
          setLoading(false);
       
      } catch (error) {
        console.error("2. Fallo de autenticación:", error);
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
      }
    }
    checkLogin();
  }, []);



  return (
    <AuthContext.Provider
      value={{
        user,
        signup, 
        signin, 
        logout,
        isAuthenticated,
        errors,  
        loading,
      }}
    >
      {children} 
    </AuthContext.Provider>
  );
};

export default AuthContext;