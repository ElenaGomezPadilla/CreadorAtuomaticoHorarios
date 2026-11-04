import {Router} from "express";
import { authRequired, verifyTokenOpcional } from "../middlewares/validateToken.js";
import {
    getHorarios,
    getHorariosPorUsuario,
    createHorario,
    createHorariosPersonalizados,
    getHorario,
    updateHorario,
    deleteHorario,
} from "../controllers/horario.controller.js";

const router = Router();

router.get('/horarios', verifyTokenOpcional, getHorarios);
router.get('/horarios/usuario', authRequired, getHorariosPorUsuario);
router.post('/crearHorario', verifyTokenOpcional, createHorario);
router.post('/crearHorariosPersonalizados', verifyTokenOpcional, createHorariosPersonalizados);
router.get('/horario/:id', authRequired ,getHorario);
router.put('/horario/:id', authRequired, updateHorario);
router.delete('/horario/:id', authRequired, deleteHorario); 

export default router; 