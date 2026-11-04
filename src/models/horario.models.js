import mongoose from 'mongoose'

const horarioSchema = new mongoose.Schema({
    nombre: {
        type: String,
        trim: true, 
        default: 'nuevo horario',
    },
    asignaturas: [ 
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Asignatura',
          required: true,
        }
    ],
    itinerarios: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Itinerario',
        }
    ],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
}, {
    timestamps: true
})

export default mongoose.model('Horario', horarioSchema)