import 'dotenv/config';
import app from './app.js';
import {connectDB} from  './db.js';
import createRootUser from './scripts/createRootUser.js';
import createInvitadoUser from './scripts/createInvitedUser.js';
import { PORT } from './config.js'; // Importa el puerto de tu config


// Conectamos la base de datos 
connectDB();

// Creamos el usuario Root (si no lo está ya)
createRootUser();
createInvitadoUser();

// Conectamos el servidor
app.listen(PORT); // Usa la variable (que es 4000)
console.log(`Server on port ${PORT}`);