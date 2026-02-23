import axios from 'axios';
import { env } from './env';

// Create an Axios instance
const api = axios.create({
    baseURL: env.API_URL,
    withCredentials: true, // Send cookies with requests
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response Interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Check if error is 401 and request hasn't been retried yet
        // Also skip retry for login and refresh requests to avoid infinite loops
        if (error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/login') &&
            !originalRequest.url?.includes('/auth/refresh')) {
            originalRequest._retry = true;

            try {
                // Attempt to refresh token
                await api.post('/auth/refresh');

                // Retry original request
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed (e.g., refresh token expired)
                console.error('Refresh token failed:', refreshError);

                // 쿠키 삭제를 위해 로그아웃 호출 시도 (실패해도 무방)
                try {
                    await api.post('/auth/logout');
                } catch (e) {
                    console.error('Logout failed during refresh error:', e);
                }

                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
