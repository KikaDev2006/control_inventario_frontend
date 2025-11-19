const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    // Try to parse backend error message
    let errorMessage = `API Error: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData && errorData.detail) {
        errorMessage = errorData.detail;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      }
    } catch {
      // if parsing fails, use status text
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
