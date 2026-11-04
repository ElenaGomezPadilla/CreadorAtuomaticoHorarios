import axios from './axios';


//Siempre envía las cookies del dominio del backend en las peticiones
//sin esto las cookies no se incluirián en las peticiones y el backend no podría leerlas
axios.defaults.withCredentials = true;

export const horarioListRequest = () => 
  axios.get(`/horarios`, { withCredentials: true });

export const crearHorarioRequest = async (datos) => {
  return axios.post(`/crearHorario`, datos, { withCredentials: true });
};

export const crearHorariosPersonalizadosRequest = async (datos) => {
  return axios.post(`/crearHorariosPersonalizados`, datos, { withCredentials: true });
};

export const updateHorarioRequest = async (id, newFields) => {
  return axios.put(`/horario/${id}`, newFields, { withCredentials: true });
};

export const deteleHorarioRequest = async (id) => {
  return axios.delete(`/horario/${id}`, { withCredentials: true });
};
