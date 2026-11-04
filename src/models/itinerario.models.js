import mongoose from 'mongoose';

const itinerarioSchema = new mongoose.Schema({
    asignatura:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asignatura',
        required: true
    },
    nombre_asignatura: {
        type: String,
        required: true,
        trim: true, 
    },
    dia: {
        type: String,
        required: true,
        trim: true, 
    },
    hora_inicio: {
        type: String,
        required: true,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/, // Validación formato HH:mm
    },
    hora_fin: {
        type: String,
        required: true,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/, // Validación formato HH:mm
    },
    turno: {
        type: String,
        required: true,
        trim: true,
        enum: ['mañana', 'tarde'],
    },
    grupo: {
        type: String,
        required: false,
        trim: true,
        enum: ['Grupo1', 'Grupo2', 'Grupo3', 'Grupo4', 'Grupo5','Grupo6','Grupo7','Grupo8','Grupo9','Grupo10','Grupo11','Grupo12','Grupo13','Grupo14', 'Grupo15','IS', 'SI', 'TI'],
    },
    modalidad: {
        type: String,
        required: true,
        trim: true,
        enum: ['practicas', 'teoria'],
    }
}, {
    timestamps: true
})

export default mongoose.model('Itinerario', itinerarioSchema)