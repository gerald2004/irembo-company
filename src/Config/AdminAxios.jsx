import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const adminAxios = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // send admin_refresh_token cookie
});

export default adminAxios;
