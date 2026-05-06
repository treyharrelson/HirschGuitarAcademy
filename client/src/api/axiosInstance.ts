// creates a single axios instance that is imported elsewhere
// this makes it so that the base URL for api calls is in one place
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    withCredentials: true,
});

export default api;