import axios from "./axios";


export const registerRequest = async (user) =>
  axios.post(`/register`, user);

export const loginRequest = async (user) => axios.post(`/login`, user);

export const logoutRequest = user => 
  axios.post('logout', user, { withCredentials: true });

export const verifyTokenRequest = async (req, res) => axios.get(`/verify`);