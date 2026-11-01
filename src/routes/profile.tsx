
import { useState, type FormEvent } from "react";
import axios from "axios";

import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  ArrowLeft,
  CircleAlert,
  LoaderCircle,
  LogOut,
  UserRound,
  Wallet as WalletIcon,
  Pencil,
  Plus,
  X,
} from "lucide-react";

import {
  authService,
  getAccessToken,
} from "@/services/authService";

import {
  walletService,
  type Wallet,
  type WalletNetwork,
  type CreateWalletInput,
} from "@/services/walletService";

// ==========================================
// ROTA
// ==========================================

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

// ==========================================
// FORMULÁRIO
// ==========================================

type WalletForm = CreateWalletInput;

type SaveWalletArgs = {
  walletId: string | null;
  values: WalletForm;
};

type ConnectionArgs = {
  walletId: string;
  connect: boolean;
};

const emptyWalletForm: WalletForm = {
  label: "",
  address: "",
  network: "ethereum",
  isPrimary: false,
};

function getApiError(error: unknown): string {
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

    return "Não foi possível concluir a operação.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocorreu um erro inesperado.";
}

function networkLabel(
  network: WalletNetwork
): string {
  const labels: Record<WalletNetwork, string> = {
    ethereum: "Ethereum",
    polygon: "Polygon",
    base: "Base",
  };

  return labels[network];
}

// eslint-disable-next-line react-refresh/only-export-components
function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const token = getAccessToken();

  const [form, setForm] = useState<WalletForm>({
    ...emptyWalletForm,
  });

  const [editingWalletId, setEditingWalletId] =
    useState<string | null>(null);

  const [showWalletForm, setShowWalletForm] =
    useState(false);

  const [actionError, setActionError] = useState("");
  const [actionFeedback, setActionFeedback] =
    useState("");

  // ========================================
  // SESSÃO
  // ========================================

  const sessionQuery = useQuery({
    queryKey: ["auth", "session"],
    queryFn: authService.getSession,
    enabled: Boolean(token),
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const session = sessionQuery.data;
  const userId = session?.user.id;

  // ========================================
  // CARTEIRAS DO USUÁRIO
  // ========================================

  const walletQuery = useQuery({
    queryKey: ["wallets", userId],
    queryFn: walletService.getWallets,
    enabled: Boolean(userId) && !sessionQuery.isError,
    retry: false,
  });

  const wallets = walletQuery.data ?? [];

  // ========================================
  // CADASTRAR / EDITAR
  // ========================================

  const saveWalletMutation = useMutation({
    mutationFn: async ({
      walletId,
      values,
    }: SaveWalletArgs): Promise<Wallet> => {
      if (walletId) {
        return walletService.updateWallet(
          walletId,
          values
        );
      }

      return walletService.createWallet(values);
    },

    onSuccess: (_wallet, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["wallets", userId],
      });

      setActionError("");
      setActionFeedback(
        variables.walletId
          ? "Carteira atualizada com sucesso."
          : "Carteira cadastrada com sucesso."
      );

      setForm({ ...emptyWalletForm });
      setEditingWalletId(null);
      setShowWalletForm(false);
    },

    onError: (error) => {
      setActionFeedback("");
      setActionError(getApiError(error));
    },
  });

  // ========================================
  // CONECTAR / DESCONECTAR
  // ========================================

  const connectionMutation = useMutation({
    mutationFn: async ({
      walletId,
      connect,
    }: ConnectionArgs): Promise<Wallet> => {
      return connect
        ? walletService.connectWallet(walletId)
        : walletService.disconnectWallet(walletId);
    },

    onSuccess: (wallet) => {
      void queryClient.invalidateQueries({
        queryKey: ["wallets", userId],
      });

      setActionError("");

      setActionFeedback(
        wallet.connectionStatus === "connected"
          ? "Carteira conectada na simulação."
          : "Carteira desconectada."
      );
    },

    onError: (error) => {
      setActionFeedback("");
      setActionError(getApiError(error));
    },
  });

  // ========================================
  // LOGOUT
  // ========================================

  const logoutMutation = useMutation({
    mutationFn: authService.logout,

    onSettled: () => {
      queryClient.removeQueries({
        queryKey: ["auth"],
      });

      queryClient.removeQueries({
        queryKey: ["wallets"],
      });

      void navigate({
        to: "/login",
      });
    },
  });

  // ========================================
  // FUNÇÕES DO FORMULÁRIO
  // ========================================

  function openCreateForm(): void {
    setEditingWalletId(null);
    setForm({ ...emptyWalletForm });
    setActionError("");
    setActionFeedback("");
    setShowWalletForm(true);
  }

  function openEditForm(wallet: Wallet): void {
    setEditingWalletId(wallet.id);

    setForm({
      label: wallet.label,
      address: wallet.address,
      network: wallet.network,
      isPrimary: wallet.isPrimary,
    });

    setActionError("");
    setActionFeedback("");
    setShowWalletForm(true);
  }

  function closeForm(): void {
    setShowWalletForm(false);
    setEditingWalletId(null);
    setForm({ ...emptyWalletForm });
    setActionError("");
  }

  function handleSaveWallet(
    event: FormEvent<HTMLFormElement>
  ): void {
    event.preventDefault();

    setActionError("");
    setActionFeedback("");

    saveWalletMutation.mutate({
      walletId: editingWalletId,
      values: {
        label: form.label.trim(),
        address: form.address.trim(),
        network: form.network,
        isPrimary: form.isPrimary,
      },
    });
  }

  const editingPrimaryWallet = wallets.some(
    (wallet) =>
      wallet.id === editingWalletId &&
      wallet.isPrimary
  );

  const isWalletBusy =
    saveWalletMutation.isPending ||
    connectionMutation.isPending;

  // ========================================
  // INTERFACE
  // ========================================

  return (
    <main className="min-h-screen bg-kurio-bg px-5 py-8 text-kurio-text">
      <div className="mx-auto w-full max-w-[640px]">

        <Link
          to="/"
          search={{ tab: "all" }}
          className="mb-9 inline-flex items-center gap-2 text-[13px] text-kurio-secondary hover:text-kurio-accent"
        >
          <ArrowLeft
            aria-hidden="true"
            className="h-4 w-4"
          />
          Voltar ao marketplace
        </Link>

        <header className="mb-8">
          <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-kurio-accent">
            KURIO MARKETPLACE
          </p>

          <h1 className="mt-3 text-[30px] font-bold">
            Meu perfil
          </h1>

          <p className="mt-2 text-[13px] text-kurio-secondary">
            Gerencie sua conta e suas carteiras.
          </p>
        </header>

        {/* CARREGAMENTO DA SESSÃO */}

        {token && sessionQuery.isPending && (
          <div
            role="status"
            className="flex items-center justify-center gap-3 rounded-[16px] bg-kurio-card p-10"
          >
            <LoaderCircle className="h-5 w-5 animate-spin text-kurio-accent" />
            Recuperando sua sessão...
          </div>
        )}

        {/* SESSÃO AUSENTE OU INVÁLIDA */}

        {(!token || sessionQuery.isError) && (
          <section className="rounded-[18px] border border-kurio-border bg-kurio-card p-7 text-center">
            <CircleAlert className="mx-auto h-12 w-12 text-kurio-accent" />

            <h2 className="mt-5 text-[20px] font-bold">
              Entre na sua conta
            </h2>

            <p className="mt-3 text-[13px] leading-6 text-kurio-secondary">
              Você precisa estar autenticado para
              gerenciar suas carteiras.
            </p>

            <Link
              to="/login"
              className="mt-6 inline-flex h-[48px] items-center justify-center rounded-[12px] bg-kurio-primary px-8 text-[13px] font-bold text-kurio-bg"
            >
              Ir para o login
            </Link>
          </section>
        )}

        {session && !sessionQuery.isError && (
          <div className="space-y-6">

            {/* PERFIL */}

            <section className="rounded-[18px] border border-kurio-border bg-kurio-card p-6">
              <div className="mb-7 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-kurio-bg text-kurio-accent">
                  <UserRound className="h-8 w-8" />
                </div>

                <div className="min-w-0">
                  <h2 className="break-words text-[20px] font-bold">
                    {session.user.name}
                  </h2>

                  <p className="mt-1 text-[12px] text-kurio-secondary">
                    Colecionador KURIO
                  </p>
                </div>
              </div>

              <dl className="space-y-5">
                <div>
                  <dt className="text-[12px] text-kurio-secondary">
                    Nome
                  </dt>
                  <dd className="mt-1 text-[14px] font-bold">
                    {session.user.name}
                  </dd>
                </div>

                <div>
                  <dt className="text-[12px] text-kurio-secondary">
                    E-mail
                  </dt>
                  <dd className="mt-1 break-all text-[14px] font-bold">
                    {session.user.email}
                  </dd>
                </div>

                <div>
                  <dt className="text-[12px] text-kurio-secondary">
                    Identificador
                  </dt>
                  <dd className="mt-1 break-all text-[12px]">
                    {session.user.id}
                  </dd>
                </div>

                <div>
                  <dt className="text-[12px] text-kurio-secondary">
                    Sessão válida até
                  </dt>
                  <dd className="mt-1 text-[13px]">
                    {new Date(
                      session.expiresAt
                    ).toLocaleString("pt-BR")}
                  </dd>
                </div>
              </dl>
            </section>

            {/* CARTEIRAS */}

            <section className="rounded-[18px] border border-kurio-border bg-kurio-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <WalletIcon className="h-6 w-6 text-kurio-accent" />

                  <h2 className="text-[18px] font-bold">
                    Minhas carteiras
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={openCreateForm}
                  disabled={isWalletBusy}
                  className="inline-flex items-center gap-2 rounded-[10px] bg-kurio-primary px-4 py-3 text-[12px] font-bold text-kurio-bg disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  Nova carteira
                </button>
              </div>

              <p className="mt-3 text-[12px] leading-6 text-kurio-secondary">
                Gerencie carteiras demonstrativas
                vinculadas à sua conta.
              </p>

              {/* MENSAGENS */}

              {actionError && (
                <p
                  role="alert"
                  className="mt-5 rounded-[10px] border border-kurio-border bg-kurio-bg p-4 text-[12px] text-kurio-accent"
                >
                  {actionError}
                </p>
              )}

              {actionFeedback && (
                <p
                  role="status"
                  className="mt-5 rounded-[10px] border border-kurio-border bg-kurio-bg p-4 text-[12px]"
                >
                  {actionFeedback}
                </p>
              )}

              {/* FORMULÁRIO */}

              {showWalletForm && (
                <form
                  onSubmit={handleSaveWallet}
                  className="mt-6 space-y-5 rounded-[14px] border border-kurio-border bg-kurio-bg p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[15px] font-bold">
                      {editingWalletId
                        ? "Editar carteira"
                        : "Cadastrar carteira"}
                    </h3>

                    <button
                      type="button"
                      onClick={closeForm}
                      disabled={saveWalletMutation.isPending}
                      aria-label="Fechar formulário"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div>
                    <label
                      htmlFor="wallet-label"
                      className="mb-2 block text-[12px] font-bold"
                    >
                      Nome da carteira
                    </label>

                    <input
                      id="wallet-label"
                      type="text"
                      required
                      minLength={2}
                      maxLength={50}
                      value={form.label}
                      disabled={isWalletBusy}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          label: event.target.value,
                        }))
                      }
                      placeholder="Minha carteira Ethereum"
                      className="h-[48px] w-full rounded-[10px] border border-kurio-border bg-kurio-card px-3 text-[12px] outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="wallet-address"
                      className="mb-2 block text-[12px] font-bold"
                    >
                      Endereço EVM
                    </label>

                    <input
                      id="wallet-address"
                      type="text"
                      required
                      pattern="0x[a-fA-F0-9]{40}"
                      title="Digite 0x seguido de 40 caracteres hexadecimais."
                      spellCheck={false}
                      autoComplete="off"
                      value={form.address}
                      disabled={isWalletBusy}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          address: event.target.value,
                        }))
                      }
                      placeholder="0x..."
                      className="h-[48px] w-full rounded-[10px] border border-kurio-border bg-kurio-card px-3 text-[12px] outline-none"
                    />

                    <p className="mt-2 text-[11px] leading-5 text-kurio-secondary">
                      Utilize apenas endereços fictícios.
                      Nunca informe chaves privadas.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="wallet-network"
                      className="mb-2 block text-[12px] font-bold"
                    >
                      Rede
                    </label>

                    <select
                      id="wallet-network"
                      value={form.network}
                      disabled={isWalletBusy}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          network:
                            event.target
                              .value as WalletNetwork,
                        }))
                      }
                      className="h-[48px] w-full rounded-[10px] border border-kurio-border bg-kurio-card px-3 text-[12px]"
                    >
                      <option value="ethereum">
                        Ethereum
                      </option>
                      <option value="polygon">
                        Polygon
                      </option>
                      <option value="base">
                        Base
                      </option>
                    </select>
                  </div>

                  <label className="flex items-center gap-3 text-[12px]">
                    <input
                      type="checkbox"
                      checked={form.isPrimary}
                      disabled={
                        isWalletBusy ||
                        editingPrimaryWallet
                      }
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          isPrimary:
                            event.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-amber-600"
                    />

                    Definir como carteira principal
                  </label>

                  <p className="text-[11px] leading-5 text-kurio-secondary">
                    A primeira carteira cadastrada
                    torna-se principal automaticamente.
                    Para trocar a principal, edite outra
                    carteira e selecione essa opção.
                  </p>

                  <button
                    type="submit"
                    disabled={isWalletBusy}
                    className="flex h-[48px] w-full items-center justify-center gap-2 rounded-[10px] bg-kurio-primary text-[13px] font-bold text-kurio-bg disabled:opacity-50"
                  >
                    {saveWalletMutation.isPending && (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    )}

                    {editingWalletId
                      ? "Salvar alterações"
                      : "Cadastrar carteira"}
                  </button>
                </form>
              )}

              {/* LISTAGEM */}

              {walletQuery.isPending && (
                <p
                  role="status"
                  className="mt-6 text-[12px] text-kurio-secondary"
                >
                  Carregando carteiras...
                </p>
              )}

              {walletQuery.isError && (
                <p
                  role="alert"
                  className="mt-6 text-[12px] text-kurio-secondary"
                >
                  {getApiError(walletQuery.error)}
                </p>
              )}

              {walletQuery.isSuccess &&
                wallets.length === 0 && (
                  <p className="mt-6 text-[12px] leading-6 text-kurio-secondary">
                    Nenhuma carteira cadastrada.
                    Utilize o botão Nova carteira
                    para começar.
                  </p>
                )}

              <div className="mt-6 space-y-4">
                {wallets.map((wallet) => (
                  <article
                    key={wallet.id}
                    className="rounded-[14px] border border-kurio-border bg-kurio-bg p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-[14px] font-bold">
                          {wallet.label}
                        </h3>

                        <p className="mt-1 text-[11px] text-kurio-secondary">
                          {networkLabel(wallet.network)}
                        </p>
                      </div>

                      <span className="text-[11px] font-bold text-kurio-accent">
                        {wallet.isPrimary
                          ? "Principal"
                          : "Secundária"}
                      </span>
                    </div>

                    <p className="mt-4 break-all font-mono text-[11px] leading-5">
                      {wallet.address}
                    </p>

                    <p className="mt-3 text-[11px] text-kurio-secondary">
                      Status:{" "}
                      {wallet.connectionStatus ===
                      "connected"
                        ? "Conectada (simulação)"
                        : "Desconectada"}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isWalletBusy}
                        onClick={() =>
                          openEditForm(wallet)
                        }
                        className="inline-flex items-center gap-2 rounded-[10px] border border-kurio-border px-4 py-2 text-[12px] disabled:opacity-50"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </button>

                      <button
                        type="button"
                        disabled={isWalletBusy}
                        onClick={() =>
                          connectionMutation.mutate({
                            walletId: wallet.id,
                            connect:
                              wallet.connectionStatus !==
                              "connected",
                          })
                        }
                        className="rounded-[10px] bg-kurio-primary px-4 py-2 text-[12px] font-bold text-kurio-bg disabled:opacity-50"
                      >
                        {wallet.connectionStatus ===
                        "connected"
                          ? "Desconectar"
                          : "Conectar"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <p className="mt-6 text-[11px] leading-5 text-kurio-secondary">
                As carteiras e conexões são
                demonstrativas. Nenhuma transação
                blockchain é realizada.
              </p>
            </section>

            {/* LOGOUT */}

            <button
              type="button"
              disabled={logoutMutation.isPending}
              onClick={() =>
                logoutMutation.mutate()
              }
              className="flex h-[50px] w-full items-center justify-center gap-3 rounded-[12px] border border-kurio-border bg-kurio-card text-[14px] font-bold disabled:opacity-50"
            >
              {logoutMutation.isPending ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <LogOut className="h-5 w-5" />
              )}

              {logoutMutation.isPending
                ? "Encerrando sessão..."
                : "Sair da conta"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
