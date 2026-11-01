
import axios from "axios";

// ==========================================
// KURIO — SERVIÇO DE AUTENTICAÇÃO
// ==========================================

export type Collector = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
};

export type AuthSession = {
  user: Collector;
  accessToken: string;
  expiresAt: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

const TOKEN_KEY = "kurio:access-token";

const authApi = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    Accept: "application/json",
  },
});

// Recupera o token da sessão simulada.
export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

// Salva apenas o token, nunca a senha.
function saveAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

// Remove o token local.
export function clearAccessToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // O encerramento local já foi solicitado.
  }
}

// Anexa o token às requisições autenticadas.
authApi.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  return config;
});

// ==========================================
// LOGIN
// ==========================================

async function login(
  credentials: LoginInput
): Promise<AuthSession> {
  const { data } = await authApi.post<AuthSession>(
    "/auth/login",
    credentials
  );

  saveAccessToken(data.accessToken);

  return data;
}

// ==========================================
// CADASTRO
// ==========================================

async function register(
  input: RegisterInput
): Promise<AuthSession> {
  const { data } = await authApi.post<AuthSession>(
    "/auth/register",
    input
  );

  saveAccessToken(data.accessToken);

  return data;
}

// ==========================================
// RECUPERAÇÃO DA SESSÃO
// ==========================================

async function getSession(): Promise<AuthSession> {
  const { data } = await authApi.get<AuthSession>(
    "/auth/session"
  );

  return data;
}

// ==========================================
// LOGOUT
// ==========================================

async function logout(): Promise<void> {
  try {
    await authApi.post("/auth/logout");
  } finally {
    clearAccessToken();
  }
}

export const authService = {
  login,
  register,
  getSession,
  logout,
};
