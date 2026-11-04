import {Router} from "express";
import { authRequired, requireAdmin } from "../middlewares/validateToken.js";

import {
    getAsignaturas,
    createAsignatura,
    getAsignatura,
    updateAsignatura,
    deleteAsignatura,
} from "../controllers/asignatura.controller.js";

const router = Router();

router.get('/asignaturas', getAsignaturas);
router.post('/asignatura', requireAdmin, createAsignatura);
router.get('/asignatura/:id', getAsignatura);
router.put('/asignatura/:id', requireAdmin, updateAsignatura);
router.delete('/asignatura/:id', requireAdmin, deleteAsignatura);

export default router;