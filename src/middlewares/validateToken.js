import User from '../models/user.models.js';
import jwt from 'jsonwebtoken';
import { TOKEN_SECRET } from '../config.js';

export const authRequired = (req, res, next) => {
  try{
    const { token } = req.cookies;

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    jwt.verify(token, TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next(); 
    });

  }catch (error){
    return res.status(500).json({ message: error.message });
  } 
};

export const verifyTokenOpcional = (req, res, next) => {
  //console.log("--- INICIO MIDDLEWARE ---");

  try{
      
    const { token } = req.cookies;
    // console.log("1. Cookie token recibida:", token ? "SÍ (existe)" : "NO (vacía)");

    if (!token) {
     //  console.log("2. Resultado: No hay token, req.user será null");
      req.user = null; // no hay token, usuario invitado
      return next();
    }

    jwt.verify(token, TOKEN_SECRET, async (err, decoded) => {
      if (err) { 
     //   console.log("3. ERROR JWT:", err.message);        
        req.user = null;
        return next(); // sigue como invitado
      }

    //   console.log("4. Token decodificado correctamente. ID buscado:", decoded.id);

      try{ //buscamos al usuario en la base de datos 

        const userFound = await User.findById(decoded.id);

        if(!userFound) {
      //    console.log("5. Usuario no encontrado en la Base de Datos");
          req.user = null;  //Si el usuario ha sido eliminado lo tratamos como invitado
        }else {
       //    console.log("5. ¡USUARIO ENCONTRADO!:", userFound.username);
          req.user = {
            id: userFound._id,
            username: userFound.username,
            role: userFound.role
          };
        }

    //    console.log("--- FIN MIDDLEWARE (ÉXITO) ---");
        next();

      }catch (error) {
   //      console.log("6. ERROR en DB durante el middleware:", error.message);
        req.user = null;

        next();
      }
    });
  }catch (error){
    return res.status(500).json({ message: error.message });
  } 
};

// cuando cree un usuario root: las asignaturas solo pueden ser editadas por él 
export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Acceso denegado: solo administradores' });
  }
};
