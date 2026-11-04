import Itinerario from '../models/itinerario.models.js';
import Horario from '../models/horario.models.js';
import bcrypt from 'bcryptjs';
import { createAccessToken } from '../libs/jwt.js';
import mongoose from 'mongoose';

/**
 * @file Controles de gestión para los itinerarios académicos.
 * @description Maneja las operaciones CRUD y filtros específicos para el modelo Itinerario.
 */

/**
 * Obtiene un listado de todos los itinerarios de la base de datos.
 * * @async
 * @param {import('express').Request} req - Objeto de petición de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Devuelve una respuesta JSON con el array de itinerarios o un error 500.
 */
export const getItinerarios = async (req, res) => {
    try {
        const itinerarios = await Itinerario.find();
        res.json(itinerarios);
    } catch (error) {
        console.error('Error en getItinerarios:', error);
        res.status(500).json({ message: 'Error al obtener los itinerarios' });
    }
};

/**
 * Obtiene todos los itinerarios vinculados a una asignatura específica.
 * * @async
 * @param {import('express').Request} req - Objeto de petición de Express, requiere `req.params.asignaturaId`.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Devuelve una respuesta JSON con los itinerarios filtrados.
 */
export const getItinerarioPorAsignatura = async (req, res) => {
    try {
        const itinerarios = await Itinerario.find({
            asignatura: req.params.asignaturaId
        });
        res.json(itinerarios);
    } catch (error) {
        console.error('Error en getItinerarioPorAsignatura:', error);
        res.status(500).json({ message: 'Error al obtener los itinerarios' });
    }
};

/**
 * Obtiene los itinerarios basándose en las asignaturas contenidas dentro de un horario específico.
 * * @async
 * @param {import('express').Request} req - Objeto de petición de Express, requiere `req.params.horarioId`.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Responde con la lista de itinerarios con la asignatura poblada, o error 404/500.
 */
export const getItinerariosPorHorario = async (req, res) => {
    try {
        const { horarioId } = req.params;
        const horario = await Horario.findById(horarioId);
        
        if (!horario) {
            return res.status(404).json({ message: 'Horario no encontrado' });
        }

        const asignaturaIds = horario.asignaturas.map(asig => asig._id);
        if (!asignaturaIds || asignaturaIds.length === 0) {
            return res.status(404).json({ message: 'Asignaturas no encontradas en este horario' });
        }

        const itinerarios = await Itinerario.find({
            asignatura: { $in: asignaturaIds }
        }).populate('asignatura');

        res.json(itinerarios);
    } catch (error) {
        console.error('Error en getItinerariosPorHorario:', error);
        res.status(500).json({ message: 'Error al obtener los itinerarios' });
    }
};

/**
 * Obtiene los itinerarios filtrados por asignatura y turno.
 * * @async
 * @param {import('express').Request} req - Requiere `req.params.turno` y `req.params.asignaturaId`.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>}
 */
export const getItinerarioPorTurno = async (req, res) => {
    try {
        const { turno, asignaturaId } = req.params;

        if (!asignaturaId || !turno) {
            return res.status(400).json({ message: 'Faltan parámetros: asignaturaId o turno' });
        }

        const itinerarios = await Itinerario.find({
            asignatura: asignaturaId,
            turno: turno,
        });

        res.json(itinerarios);
    } catch (error) {
        console.error('Error en getItinerarioPorTurno:', error);
        res.status(500).json({ message: 'Error al obtener los itinerarios por turno' });
    }
};

/**
 * Obtiene los itinerarios filtrados por asignatura y modalidad.
 * * @async
 * @param {import('express').Request} req - Requiere `req.params.modalidad` y `req.params.asignaturaId`.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>}
 */
export const getItinerarioPorModalidad = async (req, res) => {
    try {
        const { modalidad, asignaturaId } = req.params;

        if (!asignaturaId || !modalidad) {
            return res.status(400).json({ message: 'Faltan parámetros: asignaturaId o modalidad' });
        }

        const itinerarios = await Itinerario.find({
            asignatura: asignaturaId,
            modalidad: modalidad,
        });

        res.json(itinerarios);
    } catch (error) {
        console.error('Error en getItinerarioPorModalidad:', error);
        res.status(500).json({ message: 'Error al obtener los itinerarios por modalidad' });
    }
};

/**
 * Obtiene los itinerarios filtrados por asignatura, modalidad y turno en conjunto.
 * * @async
 * @param {import('express').Request} req - Requiere `req.params.turno`, `req.params.modalidad` y `req.params.asignaturaId`.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>}
 */
export const getItinerarioPorTurnoModalidad = async (req, res) => {
    try {
        const { turno, modalidad, asignaturaId } = req.params;

        if (!asignaturaId || !turno || !modalidad) {
            return res.status(400).json({ message: 'Faltan parámetros: asignaturaId, turno o modalidad' });
        }

        const itinerarios = await Itinerario.find({
            turno: turno, 
            modalidad: modalidad,
            asignatura: asignaturaId,
        });

        res.json(itinerarios);
    } catch (error) {
        console.error('Error en getItinerarioPorTurnoModalidad:', error);
        res.status(500).json({ message: 'Error al obtener los itinerarios por turno y modalidad' });
    }
};

/**
 * Crea y almacena un nuevo Itinerario en la base de datos.
 * * @async
 * @param {import('express').Request} req - Objeto de petición. El cuerpo (`req.body`) debe contener las propiedades del itinerario.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Responde con el objeto guardado o un código de estado de error (400 o 500).
 */
export const createItinerario = async (req, res) => {
     const { asignatura, dia, hora_inicio, hora_fin, turno, modalidad } = req.body;

    if (!asignatura || !dia || !hora_inicio || !hora_fin || !turno || !modalidad) {
        return res.status(400).json({ message: 'Faltan datos necesarios' });
    }

    if (!mongoose.Types.ObjectId.isValid(asignatura)) {
        return res.status(400).json({ message: 'El ID de la asignatura no es válido' });
    }

    const nuevoItinerario = new Itinerario({
        asignatura,
        dia,
        hora_inicio,
        hora_fin, 
        turno,
        modalidad
    });
    
    try {
        const guardaItinerario = await nuevoItinerario.save();
        res.status(201).json(guardaItinerario);
    } catch (error) {
        console.error('Error en createItinerario:', error);
        res.status(500).json({ message: 'Error al guardar el itinerario' });
    }
};

/**
 * Obtiene un único itinerario por su ID.
 * * @async
 * @param {import('express').Request} req - Requiere `req.params.id`.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>}
 */
export const getItinerario = async (req, res) => {
    try {
        const itinerario = await Itinerario.findById(req.params.id);

        if (!itinerario) {
            return res.status(404).json({ message: 'Itinerario no hallado' });
        }

        res.json(itinerario);
    } catch (error) {
        console.error('Error en getItinerario:', error);
        res.status(500).json({ message: 'Error al buscar el itinerario' });
    }
};

/**
 * Actualiza un itinerario existente por su ID con los datos enviados en el cuerpo de la petición.
 * * @async
 * @param {import('express').Request} req - Requiere `req.params.id` y los campos modificados en `req.body`.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Devuelve el documento actualizado.
 */
export const updateItinerario = async (req, res) => {
    try {
        const itinerario = await Itinerario.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });

        if (!itinerario) {
            return res.status(404).json({ message: 'Itinerario no hallado' });
        }

        res.json(itinerario);
    } catch (error) {
        console.error('Error en updateItinerario:', error);
        res.status(500).json({ message: 'Error al actualizar el itinerario' });
    }
};

/**
 * Elimina un itinerario de la base de datos por su ID.
 * * @async
 * @param {import('express').Request} req - Requiere `req.params.id`.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Envía un estado 204 sin contenido si la operación es exitosa.
 */
export const deleteItinerario = async (req, res) => {
    try {
        const itinerario = await Itinerario.findByIdAndDelete(req.params.id);

        if (!itinerario) {
            return res.status(404).json({ message: 'Itinerario no hallado' });
        }    
        
        res.sendStatus(204);
    } catch (error) {
        console.error('Error en deleteItinerario:', error);
        res.status(500).json({ message: 'Error al eliminar el itinerario' });
    }
};