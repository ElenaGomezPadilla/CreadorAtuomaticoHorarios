import axios from './axios';


export const asignaturaListRequest = () => axios.get(`/asignaturas`);
