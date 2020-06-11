import axios from 'axios';

const server = axios.create({
  baseURL: process.env.REACT_APP_ECOLETA_API_URL,
});

export default server;
