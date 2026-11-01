
import { http, HttpResponse } from "msw";

import type {
  AuthSession,
  Collector,
} from "@/services/authService";

// ==========================================
// KURIO — MOCK DE AUTENTICAÇÃO
// ==========================================

type MockUser = Collector & {
  passwordSalt: string;
  passwordHash: string;
};

type MockSession = {
  token: string;
  userId: string;
  expiresAt: string;
};

const USERS_KEY = "kurio:mock-users";
const SESSIONS_KEY = "kurio:mock-sessions";

const SESSION_DURATION = 60 * 60 * 1000;

let memoryUsers: MockUser[] = [];
let memorySessions: MockSession[] = [];

// ==========================================
// PERSISTÊNCIA DO MOCK
// ==========================================

function readUsers(): MockUser[] {
  try {
    const saved = localStorage.getItem(USERS_KEY);

    if (saved) {
      const parsed: unknown = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        return parsed as MockUser[];
      }
    }
  } catch {
    // Usa armazenamento temporário.
  }

  return memoryUsers;
}

function saveUsers(users: MockUser[]): void {
  memoryUsers = users;

  try {
    localStorage.setItem(
      USERS_KEY,
      JSON.stringify(users)
    );
  } catch {
    // Os dados permanecem em memória.
  }
}

function readSessions(): MockSession[] {
  try {
    const saved = localStorage.getItem(SESSIONS_KEY);

    if (saved) {
      const parsed: unknown = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        return parsed as MockSession[];
      }
    }
  } catch {
    // Usa armazenamento temporário.
  }

  return memorySessions;
}

function saveSessions(
  sessions: MockSession[]
): void {
  memorySessions = sessions;

  try {
    localStorage.setItem(
      SESSIONS_KEY,
      JSON.stringify(sessions)
    );
  } catch {
    // Os dados permanecem em memória.
  }
}

// ==========================================
// SENHAS — APENAS PARA SIMULAÇÃO
// ==========================================

async function hashPassword(
  password: string,
  salt: string
): Promise<string> {
  const content = new TextEncoder().encode(
    `${salt}:${password}`
  );

  const digest = await crypto.subtle.digest(
    "SHA-256",
    content
  );

  return Array.from(new Uint8Array(digest))
    .map((value) =>
      value.toString(16).padStart(2, "0")
    )
    .join("");
}

async function createMockUser(
  name: string,
  email: string,
  password: string
): Promise<MockUser> {
  const passwordSalt = crypto.randomUUID();

  return {
    id: crypto.randomUUID(),
    name,
    email: email.toLowerCase(),
    avatarUrl: null,
    passwordSalt,
    passwordHash: await hashPassword(
      password,
      passwordSalt
    ),
  };
}

// ==========================================
// USUÁRIOS FICTÍCIOS
// ==========================================

async function getUsers(): Promise<MockUser[]> {
  const existing = readUsers();

  if (existing.length > 0) {
    return existing;
  }

  const users = await Promise.all([
    createMockUser(
      "Colecionador Demo",
      "demo@kurio.test",
      "Demo12345!"
    ),

    createMockUser(
      "Colecionadora Teste",
      "teste@kurio.test",
      "Teste12345!"
    ),
  ]);

  saveUsers(users);

  return users;
}

// ==========================================
// DADOS PÚBLICOS DO USUÁRIO
// ==========================================

function toCollector(user: MockUser): Collector {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
  };
}

// ==========================================
// CRIAR SESSÃO
// ==========================================

function createSession(
  user: MockUser
): AuthSession {
  const session: MockSession = {
    token: crypto.randomUUID(),
    userId: user.id,
    expiresAt: new Date(
      Date.now() + SESSION_DURATION
    ).toISOString(),
  };

  saveSessions([
    ...readSessions().filter(
      (existing) =>
        new Date(existing.expiresAt).getTime() >
        Date.now()
    ),
    session,
  ]);

  return {
    user: toCollector(user),
    accessToken: session.token,
    expiresAt: session.expiresAt,
  };
}

// ==========================================
// RECUPERAR SESSÃO AUTENTICADA
// ==========================================

async function findSession(
  request: Request
): Promise<AuthSession | null> {
  const authorization =
    request.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice(7).trim();

  const session = readSessions().find(
    (item) => item.token === token
  );

  if (!session) {
    return null;
  }

  if (
    new Date(session.expiresAt).getTime() <=
    Date.now()
  ) {
    saveSessions(
      readSessions().filter(
        (item) => item.token !== token
      )
    );

    return null;
  }

  const users = await getUsers();

  const user = users.find(
    (item) => item.id === session.userId
  );

  if (!user) {
    return null;
  }

  return {
    user: toCollector(user),
    accessToken: session.token,
    expiresAt: session.expiresAt,
  };
}

// ==========================================
// VALIDAR ENTRADA
// ==========================================

function parseObject(
  value: unknown
): Record<string, unknown> | null {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as Record<string, unknown>;
}

// ==========================================
// ENDPOINTS DE AUTENTICAÇÃO
// ==========================================

export const authHandlers = [

  // ========================================
  // POST /api/auth/register
  // ========================================

  http.post("/api/auth/register", async ({
    request,
  }) => {
    const body = parseObject(
      await request.json().catch(() => null)
    );

    if (!body) {
      return HttpResponse.json(
        { message: "Dados inválidos." },
        { status: 400 }
      );
    }

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (name.length < 2) {
      return HttpResponse.json(
        {
          message:
            "Informe um nome com pelo menos 2 caracteres.",
        },
        { status: 400 }
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return HttpResponse.json(
        { message: "E-mail inválido." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return HttpResponse.json(
        {
          message:
            "A senha deve ter pelo menos 8 caracteres.",
        },
        { status: 400 }
      );
    }

    const users = await getUsers();

    if (
      users.some((user) => user.email === email)
    ) {
      return HttpResponse.json(
        {
          message:
            "Já existe uma conta com esse e-mail.",
        },
        { status: 409 }
      );
    }

    const newUser = await createMockUser(
      name,
      email,
      password
    );

    saveUsers([...users, newUser]);

    return HttpResponse.json(
      createSession(newUser),
      { status: 201 }
    );
  }),

  // ========================================
  // POST /api/auth/login
  // ========================================

  http.post("/api/auth/login", async ({
    request,
  }) => {
    const body = parseObject(
      await request.json().catch(() => null)
    );

    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body?.password === "string"
        ? body.password
        : "";

    if (!email || !password) {
      return HttpResponse.json(
        {
          message:
            "Informe e-mail e senha.",
        },
        { status: 400 }
      );
    }

    const users = await getUsers();

    const user = users.find(
      (item) => item.email === email
    );

    if (!user) {
      return HttpResponse.json(
        {
          message:
            "E-mail ou senha incorretos.",
        },
        { status: 401 }
      );
    }

    const providedHash = await hashPassword(
      password,
      user.passwordSalt
    );

    if (
      providedHash !== user.passwordHash
    ) {
      return HttpResponse.json(
        {
          message:
            "E-mail ou senha incorretos.",
        },
        { status: 401 }
      );
    }

    return HttpResponse.json(
      createSession(user),
      { status: 200 }
    );
  }),

  // ========================================
  // GET /api/auth/session
  // ========================================

  http.get("/api/auth/session", async ({
    request,
  }) => {
    const session = await findSession(
      request
    );

    if (!session) {
      return HttpResponse.json(
        {
          message:
            "Sessão inválida ou expirada.",
        },
        { status: 401 }
      );
    }

    return HttpResponse.json(
      session,
      { status: 200 }
    );
  }),

  // ========================================
  // POST /api/auth/logout
  // ========================================

  http.post("/api/auth/logout", ({
    request,
  }) => {
    const authorization =
      request.headers.get("Authorization");

    const token =
      authorization?.startsWith("Bearer ")
        ? authorization.slice(7).trim()
        : null;

    if (token) {
      saveSessions(
        readSessions().filter(
          (session) =>
            session.token !== token
        )
      );
    }

    return new HttpResponse(null, {
      status: 204,
    });
  }),
];


export async function getAuthenticatedMockUserId(
  request: Request
): Promise<string | null> {
  const session = await findSession(request);

  return session?.user.id ?? null;
}
