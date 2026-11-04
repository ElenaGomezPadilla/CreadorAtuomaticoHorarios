import mongoose from 'mongoose'

const asignaturaSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true, 
        unique: true,
    },
    curso: {
        type: Number,
        required: true,
        enum: [1, 2, 3, 4], 
    },
    creditos: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
    },
    dificultad: {
        type: String,
        required: true,
        trim: true,
        enum: ['baja', 'media', 'moderada', 'alta', 'critica'],
    },
    cuatrimestre: {
        type: String,
        required: true,
        trim: true,
        enum: ['1', '2', '1 & 2'],
    },
    prerequisitos: [{        
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asignatura',
    }],
}, {
    timestamps: true
})

asignaturaSchema.virtual('itinerarios_detallados', {
    ref: 'Itinerario',      
    localField: '_id',  
    foreignField: 'asignatura',
});

asignaturaSchema.set('toObject', { virtuals: true });
asignaturaSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Asignatura', asignaturaSchema)