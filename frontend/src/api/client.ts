const API_BASE_URL = '/api';

let accessToken: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = (): string | null => {
  return accessToken;
};

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

export const apiClient = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Includes HttpOnly refresh token cookie
  };

  try {
    const response = await fetch(url, config);

    // If unauthorized, attempt token refresh using HttpOnly cookie
    if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!refreshRes.ok) {
            throw new Error('Refresh token invalid');
          }

          const refreshData = await refreshRes.json();
          const newToken = refreshData.data?.accessToken;
          setAccessToken(newToken);
          processQueue(null, newToken);

          // Retry original request with new token
          headers['Authorization'] = `Bearer ${newToken}`;
          const retryRes = await fetch(url, { ...config, headers });
          const retryData = await retryRes.json();

          if (!retryRes.ok) {
            throw retryData.error || new Error('Request failed');
          }
          return retryData.data !== undefined ? retryData.data : retryData;
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          setAccessToken(null);
          // Redirect or let caller handle
          throw refreshErr;
        } finally {
          isRefreshing = false;
        }
      } else {
        // Wait for active refresh
        return new Promise<T>((resolve, reject) => {
          failedQueue.push({
            resolve: async (token: string) => {
              headers['Authorization'] = `Bearer ${token}`;
              try {
                const retryRes = await fetch(url, { ...config, headers });
                const retryData = await retryRes.json();
                resolve(retryData.data !== undefined ? retryData.data : retryData);
              } catch (err) {
                reject(err);
              }
            },
            reject: (err: any) => reject(err),
          });
        });
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw data.error || new Error(data.message || 'API request failed');
    }

    return data.data !== undefined ? data.data : data;
  } catch (error: any) {
    throw error;
  }
};
