
import axios from 'axios';

const API_BASE = 'https://develop-agent.819819.xyz/api';

const getClient = () => {
  const token = localStorage.getItem('auth_token');
  return axios.create({
    baseURL: API_BASE,
    headers: {
      'X-Auth-Token': token || '',
    },
  });
};

export const api = {
  health: () => getClient().get('/health'),
  
  auth: {
    validate: (token: string) => getClient().post('/auth/validate', { token }, { headers: { 'X-Auth-Token': token } }),
    info: () => getClient().get('/auth/info'),
  },

  services: {
    list: () => getClient().get('/services'),
    get: (name: string) => getClient().get(`/services/${name}`),
    start: (name: string) => getClient().post(`/services/${name}/start`),
    stop: (name: string) => getClient().post(`/services/${name}/stop`),
    restart: (name: string) => getClient().post(`/services/${name}/restart`),
    delete: (name: string, force = false) => getClient().delete(`/services/${name}?force=${force}`),
    enable: (name: string) => getClient().put(`/services/${name}/enable`),
    disable: (name: string) => getClient().put(`/services/${name}/disable`),
    logs: (name: string, tail = 100) => getClient().get(`/services/${name}/logs?tail=${tail}`),
    createYaml: (name: string, yaml: string) => getClient().post('/services/yaml', { name, yaml }),
    createZip: (formData: FormData) => getClient().post('/services/zip', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    exec: (name: string, data: { container: string; command: string; user?: string }) => 
      getClient().post(`/services/${name}/exec`, data),
  },

  system: {
    info: () => getClient().get('/system/info'),
    metrics: () => getClient().get('/system/metrics'),
    processes: (params?: any) => getClient().get('/system/processes', { params }),
    dockerStats: () => getClient().get('/system/docker/stats'),
    dockerImages: () => getClient().get('/system/docker/images'),
    upgrade: (formData: FormData) => getClient().post('/upgrade', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  },

  validation: {
    data: () => getClient().get('/validate/data'),
    services: () => getClient().get('/validate/services'),
    fix: (type: string = 'all', auto_execute = false) => 
      getClient().post('/validate/fix', { type, auto_execute }),
  },
};
