import axios from './axios';

export const itinerarioListRequest = () => axios.get(`/itinerarios`);

export const itinerarioPorAsiganturaListRequest = () => axios.get(`/itinerarios/asignatura/${asignaturaId}`);

