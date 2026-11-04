import Asignatura from '../models/asignatura.models.js';
import Horario from '../models/horario.models.js'; // Importación necesaria corregida para getAsignaturasPorHorario
import bcrypt from 'bcryptjs';
import { createAccessToken } from '../libs/jwt.js';
import mongoose from 'mongoose';

/**
 * @file Controladores de gestión académica para el modelo Asignatura.
 * @description Contiene los métodos CRUD y consultas avanzadas con ordenamiento y populación de datos.
 */

/**
 * Obtiene un listado de todas las asignaturas de la base de datos de manera ordenada.
 * @async
 * @param {import('express').Request} req - Objeto de petición de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Devuelve una respuesta JSON con el array de asignaturas ordenadas por curso y cuatrimestre.
 */
export const getAsignaturas = async (req, res) => {
    try {
        // Obtiene todas las asignaturas poblando sus itinerarios y ordenando el flujo académico
        const asignaturas = await Asignatura.find()
            .populate('itinerarios_detallados')
            .sort({ 
                curso: 1,         // Primero ordena por curso de manera ascendente (1, 2, 3...)
                cuatrimestre: 1   // Desempata por cuatrimestre ('1' primero, luego '2')
            });

        res.json(asignaturas);
    } catch (error) {
        console.error('Error en getAsignaturas:', error);
        res.status(500).json({ message: 'Error al obtener las asignaturas' });
    }
};

/**
 * Crea y almacena una nueva asignatura vinculada al usuario autenticado.
 * @async
 * @param {import('express').Request} req - Requiere los campos del cuerpo de la petición y `req.user.id` del middleware de auth.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Responde con el objeto guardado y un estado HTTP 201 (Created).
 */
export const createAsignatura = async (req, res) => {
    try {
        const { nombre, curso, creditos, dificultad, cuatrimestre } = req.body;

        // Validación básica de campos obligatorios
        if (!nombre || !curso || !creditos || !cuatrimestre) {
            return res.status(400).json({ message: 'Faltan datos requeridos para crear la asignatura' });
        }

        const nuevaAsignatura = new Asignatura({
            nombre,
            curso,
            creditos,
            dificultad, 
            cuatrimestre,
            user: req.user.id // Vinculación con el usuario creador
        });
        
        const guardaAsignatura = await nuevaAsignatura.save();
        res.status(201).json(guardaAsignatura); 
    } catch (error) {
        console.error('Error en createAsignatura:', error);
        res.status(500).json({ message: 'Error al guardar la asignatura' });
    }
};

/**
 * Obtiene una única asignatura mediante su identificador único (ID).
 * @async
 * @param {import('express').Request} req - Requiere `req.params.id`.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>}
 */
export const getAsignatura = async (req, res) => {
    try {
        const asignatura = await Asignatura.findById(req.params.id);

        if (!asignatura) {
            return res.status(404).json({ message: 'Asignatura no hallada' });
        }

        res.json(asignatura);
    } catch (error) {
        console.error('Error en getAsignatura:', error);
        res.status(500).json({ message: 'Error al buscar la asignatura' });
    }
};

/**
 * Obtiene los horarios existentes poblando los detalles de las asignaturas vinculadas a cada uno.
 * @async
 * @param {import('express').Request} req - Objeto de petición de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>}
 */
export const getAsignaturasPorHorario = async (req, res) => {
    try {
        const horarios = await Horario.find().populate('asignaturas'); 
        res.json(horarios);
    } catch (error) {
        console.error('Error en getAsignaturasPorHorario:', error);
        res.status(500).json({ message: 'Error al obtener horarios' });
    }
};

/**
 * Actualiza los datos de una asignatura existente localizándola por su ID.
 * @async
 * @param {import('express').Request} req - Requiere `req.params.id` y los parámetros modificados en el `req.body`.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Devuelve la instancia del documento con los cambios aplicados.
 */
export const updateAsignatura = async (req, res) => {
    try {
        const asignatura = await Asignatura.findByIdAndUpdate(req.params.id, req.body, {
            new: true // Retorna el documento modificado en lugar del original
        });

        if (!asignatura) {
            return res.status(404).json({ message: 'Asignatura no hallada' });
        }

        res.json(asignatura);
    } catch (error) {
        console.error('Error en updateAsignatura:', error);
        res.status(500).json({ message: 'Error al actualizar la asignatura' });
    }
};

/**
 * Elimina de forma permanente una asignatura de la base de datos por su ID.
 * @async
 * @param {import('express').Request} req - Requiere `req.params.id`.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Envía un estado 204 (No Content) si el proceso concluye de forma óptima.
 */
export const deleteAsignatura = async (req, res) => {
    try {
        const asignatura = await Asignatura.findByIdAndDelete(req.params.id);

        if (!asignatura) {
            return res.status(404).json({ message: 'Asignatura no hallada' });
        }    
        
        res.sendStatus(204);
    } catch (error) {
        console.error('Error en deleteAsignatura:', error);
        res.status(500).json({ message: 'Error al eliminar la asignatura' });
    }
};