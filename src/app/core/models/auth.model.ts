export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  role: string;
  email: string;
  name: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}