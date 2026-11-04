import mongoose from 'mongoose';
import Itinerario from '../models/itinerario.models.js'; 
const MONGODB_URI = 'mongodb://localhost/gestorhorarios';

async function limpiar() {
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a Mongo');

    const itinerarios = await Itinerario.find();
    console.log(`Revisando ${itinerarios.length} itinerarios...`);

    let modificados = 0;
    for (const itin of itinerarios) {
        const diaLimpio = itin.dia?.trim();
        const horaInicioLimpia = itin.hora_inicio?.trim();
        const horaFinLimpia = itin.hora_fin?.trim();
        const grupoLimpio = itin.grupo?.trim();

        const cambia =
            diaLimpio !== itin.dia ||
            horaInicioLimpia !== itin.hora_inicio ||
            horaFinLimpia !== itin.hora_fin ||
            grupoLimpio !== itin.grupo;

        if (cambia) {
            itin.dia = diaLimpio;
            itin.hora_inicio = horaInicioLimpia;
            itin.hora_fin = horaFinLimpia;
            itin.grupo = grupoLimpio;
            await itin.save();
            modificados++;
        }
    }

    console.log(`Listo. ${modificados} itinerarios corregidos.`);
    await mongoose.disconnect();
}

limpiar().catch(err => {
    console.error('Error en la limpieza:', err);
    process.exit(1);
});