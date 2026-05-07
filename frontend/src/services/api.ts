import axios from 'axios';

const API_BASE_URL = 'http://192.168.3.70:3006/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export interface RouteImport {
  id: number;
  fileName: string;
  status: string;
  createdAt: string;
  errorMessage: string | null;
}

export interface StandardPostalCode {
  id: number;
  province: string;
  city: string;
  district: string;
  postalCode: string;
}

export { apiClient };

export const postalApi = {
  uploadStandardPostalCode: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/postal/standard/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  clearStandardPostalCode: () => {
    return apiClient.delete('/postal/standard/clear');
  },

  getStandardPostalCodeCount: () => {
    return apiClient.get('/postal/standard/count');
  },

  getStandardPostalCodes: (skip: number = 0, take: number = 100, filters?: { province?: string; city?: string; district?: string; postalCode?: string }) => {
    return apiClient.get<{ success: boolean; data: StandardPostalCode[] }>('/postal/standard/list', {
      params: { skip, take, ...filters }
    });
  },

  uploadUserRoutes: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/postal/routes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  getUserRouteImports: () => {
    return apiClient.get<{ success: boolean; data: RouteImport[] }>('/postal/routes/list');
  },

  getUserRouteImportById: (id: number) => {
    return apiClient.get(`/postal/routes/${id}`);
  },

  deleteUserRouteImport: (id: number) => {
    return apiClient.delete(`/postal/routes/${id}`);
  },

  cleanRouteData: (id: number, level: number = 3) => {
    return apiClient.post(`/postal/routes/${id}/clean`, { level });
  },

  exportResult: async (id: number) => {
    const fileNameResponse = await apiClient.get<{ success: boolean; fileName: string }>(`/postal/routes/${id}/export-filename`);
    const fileName = fileNameResponse.data.fileName;
    
    const response = await apiClient.get(`/postal/routes/${id}/export`, {
      responseType: 'blob'
    });
    
    return { data: { fileName, blob: response.data } };
  }
};
