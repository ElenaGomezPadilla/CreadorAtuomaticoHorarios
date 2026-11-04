import User from '../models/user.models.js';
import jwt from "jsonwebtoken";
import bcrypt from 'bcryptjs';
import { TOKEN_SECRET } from "../config.js";
import { createAccessToken } from '../libs/jwt.js';

/**
 * @file Controladores de autenticación y gestión de sesiones de usuario.
 * @description Maneja el registro, inicio de sesión, verificación de estado y cierre de sesión mediante JWT en Cookies.
 */

/**
 * Registra un nuevo usuario en el sistema.
 * @async
 * @param {import('express').Request} req - Petición de Express. Requiere `email`, `password` y `username` en el `req.body`.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} Devuelve el perfil del usuario registrado junto con la cookie de sesión.
 */
export const register = async (req, res) => {
    try {
        const { email, password, username } = req.body;

        // Validar unicidad del correo electrónico
        const userFoundByEmail = await User.findOne({ email });
        if (userFoundByEmail) {
            return res.status(400).json({ message: ["El correo ya está en uso"] });
        }

        // Validar unicidad del nombre de usuario
        const userFoundByUsername = await User.findOne({ username });
        if (userFoundByUsername) {
            return res.status(400).json({ message: ["El usuario ya está en uso"] });
        }

        // Validar longitud de la contraseña
        if (password.length < 6) {
            return res.status(400).json({ message: ["La contraseña debe tener al menos 6 caracteres"] });
        }

        // Encriptar la contraseña
        const passwordHash = await bcrypt.hash(password, 10);

        // Instanciar y guardar el nuevo usuario
        const newUser = new User({
            username,
            email,
            password: passwordHash,
        });
        const userSaved = await newUser.save();

        // Generar token de acceso
        const token = await createAccessToken({ id: userSaved._id });

        // Configurar la cookie de autenticación segura
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 24 * 60 * 60 * 1000 // 1 día
        });
        
        res.status(201).json({
            id: userSaved._id,
            username: userSaved.username,
            email: userSaved.email,
            createdAt: userSaved.createdAt,
            updatedAt: userSaved.updatedAt,
        });

    } catch (error) {
        console.error('Error en el registro de usuario:', error);
        res.status(500).json({ message: [error.message] });
    }
};

/**
 * Autentica a un usuario existente verificando sus credenciales.
 * @async
 * @param {import('express').Request} req - Petición de Express con `username` y `password` en el cuerpo.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>} Devuelve el perfil del usuario autenticado y establece la cookie del token.
 */
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const userFound = await User.findOne({ username });

        if (!userFound) {
            return res.status(400).json({ message: ["Usuario incorrecto"] });
        }

        // Comparar contraseñas hashificadas
        const isMatch = await bcrypt.compare(password, userFound.password);
        if (!isMatch) {
            return res.status(400).json({ message: ["Contraseña incorrecta"] });
        }

        // Generar token incluyendo datos mínimos en el payload
        const token = await createAccessToken({ id: userFound._id, username: userFound.username });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({
            id: userFound._id,
            username: userFound.username,
            email: userFound.email,
            createdAt: userFound.createdAt,
            updatedAt: userFound.updatedAt,
        });

    } catch (error) {
        console.error('Error en el login de usuario:', error);
        res.status(500).json({ message: [error.message] });
    }
};

/**
 * Verifica la validez del token guardado en las cookies para mantener la sesión activa en el frontend.
 * @async
 * @param {import('express').Request} req - Petición de Express que lee la cookie `token`.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {void} Devuelve los datos esenciales del usuario si el token es válido.
 */
export const verifyToken = async (req, res) => {
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: "No autorizado" });

    jwt.verify(token, TOKEN_SECRET, async (error, user) => {
        if (error) return res.status(401).json({ message: "No autorizado" });

        try {
            const userFound = await User.findById(user.id);
            if (!userFound) {
                return res.status(401).json({ message: "El usuario ya no existe" });
            }

            return res.json({
                id: userFound._id,
                username: userFound.username,
                email: userFound.email,
            });
        } catch (dbError) {
            console.error('Error al buscar usuario en verifyToken:', dbError);
            return res.status(500).json({ message: "Error interno del servidor" });
        }
    });
};

/**
 * Cierra la sesión del usuario invalidando y expirando de inmediato la cookie del token.
 * @param {import('express').Request} req - Petición de Express.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {void} Envía un código de estado 200 de éxito.
 */
export const logout = (req, res) => {
    res.cookie('token', "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        expires: new Date(0), // Forzar expiración inmediata en el navegador
    });
    return res.sendStatus(200);
};

/**
 * Obtiene el perfil completo del usuario autenticado a través de los datos inyectados por el middleware de validación.
 * @async
 * @param {import('express').Request} req - Requiere `req.user.id` provisto por el middleware de protección de rutas.
 * @param {import('express').Response} res - Respuesta de Express.
 * @returns {Promise<void>}
 */
export const profile = async (req, res) => {
    try {
        const userFound = await User.findById(req.user.id);

        if (!userFound) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        return res.json({
            id: userFound._id,
            email: userFound.email,
            username: userFound.username,
            createdAt: userFound.createdAt,
            updatedAt: userFound.updatedAt,
        });
    } catch (error) {
        console.error('Error al obtener perfil de usuario:', error);
        return res.status(500).json({ message: error.message });
    }
};