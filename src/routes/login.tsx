
import { useState, type FormEvent } from "react";
import axios from "axios";

import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";

import { useMutation } from "@tanstack/react-query";

import {
  ArrowLeft,
  LoaderCircle,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";

import { authService } from "@/services/authService";

// ==========================================
// KURIO — LOGIN E CADASTRO
// ==========================================

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

type AuthMode = "login" | "register";

type AuthFormInput = {
  mode: AuthMode;
  name: string;
  email: string;
  password: string;
};

// ==========================================
// TRATAMENTO DE ERROS
// ==========================================

function getAuthError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;

    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
    ) {
      return data.message;
    }

    if (!error.response) {
      return "Falha de comunicação com a API simulada.";
    }

    return `Não foi possível autenticar (HTTP ${error.response.status}).`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocorreu um erro inesperado.";
}

// ==========================================
// COMPONENTE
// ==========================================

// eslint-disable-next-line react-refresh/only-export-components
function LoginPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const authMutation = useMutation({
    mutationFn: async (input: AuthFormInput) => {
      if (input.mode === "register") {
        return authService.register({
          name: input.name.trim(),
          email: input.email.trim().toLowerCase(),
          password: input.password,
        });
      }

      return authService.login({
        email: input.email.trim().toLowerCase(),
        password: input.password,
      });
    },
  });

  const isPending = authMutation.isPending;

  function changeMode(nextMode: AuthMode): void {
    if (isPending) return;

    setMode(nextMode);
    setPassword("");
    setErrorMessage("");
    authMutation.reset();
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    setErrorMessage("");

    if (mode === "register" && name.trim().length < 2) {
      setErrorMessage(
        "Informe um nome com pelo menos 2 caracteres."
      );
      return;
    }

    if (mode === "register" && password.length < 8) {
      setErrorMessage(
        "A senha deve ter pelo menos 8 caracteres."
      );
      return;
    }

    try {
      const session = await authMutation.mutateAsync({
        mode,
        name,
        email,
        password,
      });

      if (!session.accessToken || !session.user.id) {
        throw new Error(
          "A API retornou uma sessão inválida."
        );
      }

      // O authService já armazenou o token.
      // Retorna ao marketplace após autenticação.
      await navigate({
        to: "/",
        search: { tab: "all" },
      });
    } catch (error: unknown) {
      setErrorMessage(getAuthError(error));
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-kurio-bg px-5 py-8 text-kurio-text">

      <div className="mx-auto w-full max-w-[420px]">

        {/* NAVEGAÇÃO */}

        <Link
          to="/"
          search={{ tab: "all" }}
          className="mb-10 inline-flex items-center gap-2 text-[13px] text-kurio-secondary hover:text-kurio-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao marketplace
        </Link>

        {/* APRESENTAÇÃO */}

        <header className="mb-8">
          <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.2em] text-kurio-accent">
            KURIO MARKETPLACE
          </p>

          <h1 className="text-[30px] font-bold">
            {mode === "login"
              ? "Bem-vindo de volta"
              : "Crie sua conta"}
          </h1>

          <p className="mt-3 text-[13px] leading-6 text-kurio-secondary">
            {mode === "login"
              ? "Entre na sua conta para explorar sua experiência como colecionador."
              : "Cadastre-se para começar sua jornada no universo dos NFTs."}
          </p>
        </header>

        {/* ALTERNAR LOGIN / CADASTRO */}

        <div
          role="group"
          aria-label="Tipo de autenticação"
          className="mb-6 grid grid-cols-2 gap-2 rounded-[14px] bg-kurio-card p-2"
        >
          <button
            type="button"
            disabled={isPending}
            onClick={() => changeMode("login")}
            aria-pressed={mode === "login"}
            className={`rounded-[10px] px-4 py-3 text-[13px] font-bold transition-colors ${
              mode === "login"
                ? "bg-kurio-primary text-kurio-bg"
                : "text-kurio-secondary hover:text-kurio-text"
            }`}
          >
            Entrar
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => changeMode("register")}
            aria-pressed={mode === "register"}
            className={`rounded-[10px] px-4 py-3 text-[13px] font-bold transition-colors ${
              mode === "register"
                ? "bg-kurio-primary text-kurio-bg"
                : "text-kurio-secondary hover:text-kurio-text"
            }`}
          >
            Criar conta
          </button>
        </div>

        {/* FORMULÁRIO */}

        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="space-y-6 rounded-[20px] border border-kurio-border bg-kurio-card p-6"
        >

          {/* NOME — APENAS CADASTRO */}

          {mode === "register" && (
            <div>
              <label
                htmlFor="auth-name"
                className="mb-2 block text-[13px] font-bold"
              >
                Nome
              </label>

              <div className="flex items-center gap-3 rounded-[12px] border border-kurio-border bg-kurio-bg px-4">
                <UserRound
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-kurio-secondary"
                />

                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  required
                  minLength={2}
                  disabled={isPending}
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Seu nome"
                  className="h-[50px] w-full min-w-0 bg-transparent text-[13px] outline-none"
                />
              </div>
            </div>
          )}

          {/* E-MAIL */}

          <div>
            <label
              htmlFor="auth-email"
              className="mb-2 block text-[13px] font-bold"
            >
              E-mail
            </label>

            <div className="flex items-center gap-3 rounded-[12px] border border-kurio-border bg-kurio-bg px-4">
              <Mail
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-kurio-secondary"
              />

              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                disabled={isPending}
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="voce@exemplo.com"
                className="h-[50px] w-full min-w-0 bg-transparent text-[13px] outline-none"
              />
            </div>
          </div>

          {/* SENHA */}

          <div>
            <label
              htmlFor="auth-password"
              className="mb-2 block text-[13px] font-bold"
            >
              Senha
            </label>

            <div className="flex items-center gap-3 rounded-[12px] border border-kurio-border bg-kurio-bg px-4">
              <LockKeyhole
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-kurio-secondary"
              />

              <input
                id="auth-password"
                type="password"
                autoComplete={
                  mode === "register"
                    ? "new-password"
                    : "current-password"
                }
                minLength={mode === "register" ? 8 : undefined}
                required
                disabled={isPending}
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Digite sua senha"
                className="h-[50px] w-full min-w-0 bg-transparent text-[13px] outline-none"
              />
            </div>

            {mode === "register" && (
              <p className="mt-2 text-[11px] text-kurio-secondary">
                Utilize pelo menos 8 caracteres.
              </p>
            )}
          </div>

          {/* ERRO */}

          {errorMessage && (
            <div
              role="alert"
              className="rounded-[10px] border border-kurio-border bg-kurio-bg p-4 text-[12px] leading-6 text-kurio-accent"
            >
              {errorMessage}
            </div>
          )}

          {/* ENVIO */}

          <button
            type="submit"
            disabled={isPending}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[12px] bg-kurio-primary px-5 text-[14px] font-bold text-kurio-bg transition-colors hover:bg-kurio-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <>
                <LoaderCircle
                  aria-hidden="true"
                  className="h-5 w-5 animate-spin"
                />
                Aguarde...
              </>
            ) : mode === "login" ? (
              "Entrar na minha conta"
            ) : (
              "Criar minha conta"
            )}
          </button>

          <p className="text-center text-[11px] leading-5 text-kurio-secondary">
            Autenticação demonstrativa com API simulada.
            Não utilize senhas pessoais.
          </p>
        </form>

        {/* USUÁRIO DEMONSTRATIVO */}

        <section className="mt-6 rounded-[14px] border border-kurio-border bg-kurio-card p-5">
          <h2 className="text-[13px] font-bold">
            Conta para demonstração
          </h2>

          <p className="mt-3 text-[12px] leading-6 text-kurio-secondary">
            E-mail: demo@kurio.test
          </p>

          <p className="text-[12px] leading-6 text-kurio-secondary">
            Senha: Demo12345!
          </p>
        </section>
      </div>
    </main>
  );
}
