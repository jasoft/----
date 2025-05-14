export interface AuthModel {
  id: string;
  username: string;
  role: string;
  tokenExpire?: string;
  email: string;
  created: string;
  updated: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

export interface AuthData {
  token: string;
  record: AuthModel;
}
