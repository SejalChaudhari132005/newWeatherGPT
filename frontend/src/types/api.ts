export interface HealthCheckResponse {
  status: string;
  service: string;
}

export interface ApiErrorResponse {
  error: boolean;
  message: string;
  status_code: number;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
