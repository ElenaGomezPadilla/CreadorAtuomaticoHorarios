import { Router } from 'express';
import { authRequired } from "../middlewares/validateToken.js";
import {
    getItinerarios,
    getItinerarioPorAsignatura,
    getItinerarioPorTurno,
    getItinerarioPorModalidad,
    getItinerarioPorTurnoModalidad,
    createItinerario,
    getItinerario,
    updateItinerario,
    deleteItinerario,
    getItinerariosPorHorario,
} from "../controllers/itinerario.controller.js";

const router = Router();

// Rutas de itinerarios
router.get('/itinerarios', getItinerarios); // Filtrado por asignatura, turno, modalidad

// Rutas con parámetros específicos
router.get('/itinerarios/asignatura/:asignaturaId', getItinerarioPorAsignatura); // Filtra por asignatura
router.get('/itinerarios/turno/:turno/:asignaturaId', getItinerarioPorTurno); // Filtra por turno y asignaturaId
router.get('/itinerarios/modalidad/:modalidad/:asignaturaId', getItinerarioPorModalidad); // Filtra por modalidad
router.get('/itinerarios/buscar/:turno/:modalidad/:asignaturaId', getItinerarioPorTurnoModalidad); // Filtra por turno y modalidad
router.get('/itinerarios/horario/:horarioId', getItinerariosPorHorario);


// Rutas para gestionar itinerarios
router.post('/itinerario', createItinerario); // Crear itinerario
router.get('/itinerario/:id', getItinerario); // Obtener un itinerario por id
router.put('/itinerario/:id', authRequired, updateItinerario); // Actualizar itinerario
router.delete('/itinerario/:id', authRequired, deleteItinerario); // Eliminar itinerario

export default router;
