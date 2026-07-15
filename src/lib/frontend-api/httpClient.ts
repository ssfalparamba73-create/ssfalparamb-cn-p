export class HttpClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public field?: string
  ) {
    super(message);
    this.name = 'HttpClientError';
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`/api/v1${endpoint}`, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (data && data.error) {
        throw new HttpClientError(
          data.error.message || 'API request failed',
          data.error.code || 'UNKNOWN_ERROR',
          response.status,
          data.error.field
        );
      }
      throw new HttpClientError(`HTTP Error: ${response.status}`, 'HTTP_ERROR', response.status);
    }
    // Our backend wraps success responses in { ok: true, data: T }
    return (data && data.ok !== undefined && 'data' in data) ? data.data : data;
  } catch (err) {
    if (err instanceof HttpClientError) {
      throw err;
    }
    throw new HttpClientError(
      err instanceof Error ? err.message : 'Network error',
      'NETWORK_ERROR',
      0
    );
  }
}
