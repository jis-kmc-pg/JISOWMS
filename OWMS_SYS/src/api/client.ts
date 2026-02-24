import { useUserStore } from '../store/userStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface ApiResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
}

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
        status?: number;
    };
    message: string;
}

interface ExtendedRequestInit extends RequestInit {
    responseType?: 'json' | 'blob' | 'text';
}

async function request<T = any>(
    endpoint: string,
    options: ExtendedRequestInit = {}
): Promise<ApiResponse<T>> {
    const token = useUserStore.getState().token;
    const { responseType = 'json', ...fetchOptions } = options;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (fetchOptions.headers) {
        Object.assign(headers, fetchOptions.headers);
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

    // OWMS_SYS는 항상 Tauri 환경이므로 환경 체크 없이 직접 invoke 사용
    try {
        const { invoke } = await import('@tauri-apps/api/core');

        const requestOptions = {
            method: fetchOptions.method || 'GET',
            url,
            headers,
            body: fetchOptions.body ? JSON.parse(fetchOptions.body as string) : undefined
        };

        const result = await invoke<{ status: number; statusText: string; data: any }>('api_request', {
            options: requestOptions
        });

        // 에러 처리
        if (result.status >= 400) {
            if (result.status === 401) {
                useUserStore.getState().logout();
            }
            const error: ApiError = {
                response: {
                    data: result.data,
                    status: result.status,
                },
                message: result.data.message || `HTTP ${result.status}`,
            };
            throw error;
        }

        return {
            data: result.data,
            status: result.status,
            statusText: result.statusText,
        };
    } catch (error: any) {
        // 이미 ApiError 형태로 throw된 경우
        if (error.response) {
            throw error;
        }
        // 기타 에러
        const apiError: ApiError = {
            message: error.message || '네트워크 오류가 발생했습니다.',
        };
        throw apiError;
    }
}

const apiClient = {
    get: <T = any>(url: string, config?: ExtendedRequestInit) =>
        request<T>(url, { ...config, method: 'GET' }),

    post: <T = any>(url: string, data?: any, config?: ExtendedRequestInit) =>
        request<T>(url, {
            ...config,
            method: 'POST',
            body: JSON.stringify(data),
        }),

    put: <T = any>(url: string, data?: any, config?: ExtendedRequestInit) =>
        request<T>(url, {
            ...config,
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    delete: <T = any>(url: string, config?: ExtendedRequestInit) =>
        request<T>(url, { ...config, method: 'DELETE' }),

    patch: <T = any>(url: string, data?: any, config?: ExtendedRequestInit) =>
        request<T>(url, {
            ...config,
            method: 'PATCH',
            body: JSON.stringify(data),
        }),
};

export default apiClient;
