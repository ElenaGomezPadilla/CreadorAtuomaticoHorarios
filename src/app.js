import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js'
import asignaturaRoutes from './routes/asignatura.routes.js'
import horarioRoutes from './routes/horario.routes.js'
import itinerarioRoutes from './routes/itinerario.routes.js'

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true 
  })
);

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser()); 

// Rutas API
app.use("/api", authRoutes);
app.use("/api", asignaturaRoutes);
app.use("/api", horarioRoutes);
app.use("/api", itinerarioRoutes);

export default app;