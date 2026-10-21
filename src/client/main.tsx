import React, {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import { api, ApiError } from "./api";
import type { User, GroupSummary, Group, Match, PublicMatch } from "./types";
import "./styles.css";

const money = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const date = (value: string) =>
  new Date(value).toLocaleString("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
const text = (data: FormData, key: string) => String(data.get(key) ?? "");
const number = (data: FormData, key: string) => Number(data.get(key));

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [registering, setRegistering] = useState(false);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [publicMatch, setPublicMatch] = useState<PublicMatch | null>(null);
  const params = new URLSearchParams(location.search);
  const groupId = params.get("group");
  const matchId = params.get("match");
  const publicToken = location.pathname.match(
    /^\/presenca\/([a-f0-9-]+)$/,
  )?.[1];
  const inviteToken = location.pathname.match(/^\/convite\/([a-f0-9-]+)$/)?.[1];
  const guestKey = `partida-certa:cancel:${publicToken}`;
  const [cancelToken, setCancelToken] = useState(() =>
    publicToken ? localStorage.getItem(guestKey) : null,
  );

  async function load() {
    if (publicToken) {
      setPublicMatch(await api(`/presence/${publicToken}`));
      return;
    }
    const me = await api<User>("/auth/me");
    setUser(me);
    setGroups(await api("/groups"));
    if (groupId) setGroup(await api(`/groups/${groupId}`));
    if (groupId && matchId)
      setMatch(await api(`/groups/${groupId}/matches/${matchId}`));
  }

  useEffect(() => {
    load()
      .catch((e) => {
        if (!(e instanceof ApiError && e.status === 401)) setError(e.message);
      })
      .finally(() => setLoading(false));
  }, []);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocorreu um erro.");
    } finally {
      setBusy(false);
    }
  }

  function form(
    event: FormEvent<HTMLFormElement>,
    action: (data: FormData) => Promise<void>,
  ) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void run(() => action(data));
  }

  async function share(path: string) {
    const url = new URL(path, location.origin).href;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setNotice("Link copiado!");
    } else setNotice(url);
  }

  const matchPath = `/groups/${groupId}/matches/${matchId}`;
  const admin = group?.myRole === "admin";
  const active =
    match?.status === "scheduled" && new Date(match.scheduledAt) > new Date();

  return (
    <>
      <header className="topbar">
        <a className="brand" href="/">
          ⚽{" "}
          <span>
            partida<span className="accent">certa</span>
          </span>
        </a>
        <nav>
          {user && (
            <>
              <span>{user.name}</span>
              <button
                className="quiet"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await api("/auth/logout", "POST");
                    location.assign("/");
                  })
                }
              >
                Sair
              </button>
            </>
          )}
        </nav>
      </header>
      <main>
        {error && (
          <div className="message error" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className="message" role="status">
            {notice}
          </div>
        )}
        {loading ? (
          <p role="status">Carregando sua próxima partida…</p>
        ) : publicToken ? (
          <>
            {publicMatch && (
              <>
                <p className="eyebrow">
                  {publicMatch.groupName} · Lista de presença
                </p>
                <h1>{publicMatch.title}</h1>
                <p className="lead">
                  {date(publicMatch.scheduledAt)} · {publicMatch.location}
                </p>
                <div className="stats">
                  <div>
                    <strong>
                      {publicMatch.presences.length}/{publicMatch.maxPlayers}
                    </strong>
                    <span>jogadores confirmados</span>
                  </div>
                  <div>
                    <strong>{money(publicMatch.priceCents)}</strong>
                    <span>por jogador</span>
                  </div>
                </div>
                {publicMatch.status === "canceled" ? (
                  <p className="message error">Partida cancelada.</p>
                ) : new Date(publicMatch.scheduledAt) <= new Date() ? (
                  <p>Esta partida já começou.</p>
                ) : (
                  <section className="panel">
                    {cancelToken ? (
                      <>
                        <h2>Sua presença está confirmada</h2>
                        <p>
                          O cancelamento é permitido até 30 minutos antes. Este
                          navegador guarda seu acesso para cancelar.
                        </p>
                        <button
                          disabled={busy}
                          className="danger"
                          onClick={() =>
                            void run(async () => {
                              await api(`/presence/${publicToken}`, "DELETE", {
                                cancelToken,
                              });
                              localStorage.removeItem(guestKey);
                              setCancelToken(null);
                              await load();
                            })
                          }
                        >
                          Cancelar minha presença
                        </button>
                      </>
                    ) : (
                      <form
                        onSubmit={(e) =>
                          form(e, async (data) => {
                            const result = await api<{ cancelToken: string }>(
                              `/presence/${publicToken}`,
                              "POST",
                              { name: text(data, "name") },
                            );
                            localStorage.setItem(guestKey, result.cancelToken);
                            setCancelToken(result.cancelToken);
                            await load();
                          })
                        }
                      >
                        <h2>Vai jogar?</h2>
                        <p>
                          Seu nome ficará visível para quem receber este link.
                        </p>
                        <Field label="Seu nome">
                          <input
                            name="name"
                            required
                            minLength={2}
                            maxLength={100}
                            autoComplete="name"
                          />
                        </Field>
                        <button
                          disabled={
                            busy ||
                            publicMatch.presences.length >=
                              publicMatch.maxPlayers
                          }
                        >
                          Confirmar presença
                        </button>
                      </form>
                    )}
                  </section>
                )}
                <section className="panel">
                  <h2>Confirmados</h2>
                  {publicMatch.presences.length ? (
                    <ol>
                      {publicMatch.presences.map((p) => (
                        <li key={p.id}>{p.name}</li>
                      ))}
                    </ol>
                  ) : (
                    <p>Nenhum jogador confirmado ainda.</p>
                  )}
                </section>
                <div className="grid">
                  {publicMatch.teams.map((t) => (
                    <section className="panel" key={t.name}>
                      <h2>{t.name}</h2>
                      <ul>
                        {t.players.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </>
            )}
          </>
        ) : !user ? (
          <section className="auth-layout">
            <div>
              <p className="eyebrow">Menos organização. Mais futebol.</p>
              <h1>
                O jogo começa
                <br />
                com a turma certa.
              </h1>
              <p className="lead">
                Reúna seu grupo, organize as partidas e deixe a lista de
                presença em dia.
              </p>
              <div className="pitch" aria-hidden="true">
                <div />
              </div>
            </div>
            <div className="panel">
              <h2>{registering ? "Crie sua conta" : "Entre em campo"}</h2>
              <p>
                {inviteToken
                  ? "Entre ou cadastre-se para aceitar o convite do grupo."
                  : "Sua próxima partida começa aqui."}
              </p>
              <form
                onSubmit={(e) =>
                  form(e, async (data) => {
                    await api(
                      `/auth/${registering ? "register" : "login"}`,
                      "POST",
                      {
                        name: text(data, "name"),
                        email: text(data, "email"),
                        password: text(data, "password"),
                      },
                    );
                    await load();
                  })
                }
              >
                {registering && (
                  <Field label="Nome">
                    <input
                      name="name"
                      autoComplete="name"
                      minLength={2}
                      maxLength={100}
                      required
                    />
                  </Field>
                )}
                <Field label="E-mail">
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    required
                  />
                </Field>
                <Field label="Senha (mínimo 10 caracteres)">
                  <input
                    name="password"
                    type="password"
                    autoComplete={
                      registering ? "new-password" : "current-password"
                    }
                    minLength={10}
                    maxLength={128}
                    required
                  />
                </Field>
                <button disabled={busy}>
                  {busy ? "Aguarde…" : registering ? "Criar conta" : "Entrar"}
                </button>
              </form>
              <button
                className="quiet"
                onClick={() => {
                  setRegistering(!registering);
                  setError("");
                }}
              >
                {registering ? "Já tenho uma conta" : "Ainda não tenho conta"}
              </button>
            </div>
          </section>
        ) : inviteToken ? (
          <section className="panel">
            <h1>Você foi convidado!</h1>
            <p>Ao aceitar, você se tornará membro deste grupo.</p>
            <button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const result = await api<{ id: string }>(
                    "/groups/join",
                    "POST",
                    { token: inviteToken },
                  );
                  location.assign(`/?group=${result.id}`);
                })
              }
            >
              Aceitar convite
            </button>
          </section>
        ) : match && group ? (
          <>
            <a className="back" href={`/?group=${group.id}`}>
              ← {group.name}
            </a>
            <p className="eyebrow">
              {match.type} ·{" "}
              {match.status === "canceled" ? "Cancelada" : "Partida"}
            </p>
            <h1>{match.title}</h1>
            <p className="lead">
              {date(match.scheduledAt)} · {match.location}
            </p>
            <div className="stats">
              <div>
                <strong>
                  {match.presences.length}/{match.maxPlayers}
                </strong>
                <span>confirmados · mínimo {match.minPlayers}</span>
              </div>
              <div>
                <strong>{money(match.priceCents)}</strong>
                <span>por jogador</span>
              </div>
            </div>
            {match.notes && <p>{match.notes}</p>}
            <div className="actions">
              <button
                disabled={busy || !active}
                onClick={() =>
                  void run(async () => {
                    const confirmed = match.presences.some(
                      (p) => p.userId === user.id,
                    );
                    await api(
                      `${matchPath}/presence`,
                      confirmed ? "DELETE" : "POST",
                    );
                    await load();
                  })
                }
              >
                {match.presences.some((p) => p.userId === user.id)
                  ? "Cancelar minha presença"
                  : "Confirmar minha presença"}
              </button>
              <button
                className="secondary"
                onClick={() =>
                  void run(() => share(`/presenca/${match.presenceToken}`))
                }
              >
                Copiar link de presença
              </button>
              {admin && (
                <button
                  className="secondary"
                  disabled={busy || !active}
                  onClick={() =>
                    void run(async () => {
                      await api(`${matchPath}/teams`, "POST");
                      await load();
                    })
                  }
                >
                  Sortear e salvar times
                </button>
              )}
            </div>
            <p className="hint">
              Cancelar presença até 30 minutos antes. Alterações na lista apagam
              o sorteio anterior.
            </p>
            <div className="grid">
              <section className="panel">
                <h2>Lista de presença</h2>
                {match.presences.length ? (
                  <ol>
                    {match.presences.map((p) => (
                      <li key={p.id}>
                        {p.user?.name ?? p.guestName}{" "}
                        {!p.userId && <small>avulso</small>}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p>Seja o primeiro a confirmar.</p>
                )}
              </section>
              {match.teams.map((t) => (
                <section className="panel" key={t.id}>
                  <h2>{t.name}</h2>
                  <ul>
                    {t.players.map((p) => (
                      <li key={p.presence.id}>
                        {p.presence.user?.name ?? p.presence.guestName}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            {admin && active && (
              <details className="panel">
                <summary>Cancelar partida</summary>
                <p>Os jogadores verão que esta partida foi cancelada.</p>
                <button
                  className="danger"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await api(`${matchPath}/cancel`, "POST");
                      await load();
                    })
                  }
                >
                  Confirmar cancelamento da partida
                </button>
              </details>
            )}
          </>
        ) : group ? (
          <>
            <a className="back" href="/">
              ← Meus grupos
            </a>
            <p className="eyebrow">
              {group.city || "Seu grupo"} · {group.members.length} membros
            </p>
            <h1>{group.name}</h1>
            <p className="lead">
              {group.description || "A turma reunida para a próxima partida."}
            </p>
            {admin && group.inviteToken && (
              <button
                className="secondary"
                onClick={() =>
                  void run(() => share(`/convite/${group.inviteToken}`))
                }
              >
                Copiar convite do grupo
              </button>
            )}
            <h2>Agenda de partidas</h2>
            <div className="grid">
              {group.matches.map((m) => (
                <a
                  className="panel match-card"
                  href={`/?group=${group.id}&match=${m.id}`}
                  key={m.id}
                >
                  <span className="tag">
                    {m.status === "canceled" ? "Cancelada" : m.type}
                  </span>
                  <h3>{m.title}</h3>
                  <p>{date(m.scheduledAt)}</p>
                  <p>{m.location}</p>
                  <strong>
                    {m._count?.presences}/{m.maxPlayers} jogadores ·{" "}
                    {money(m.priceCents)}
                  </strong>
                </a>
              ))}
            </div>
            {!group.matches.length && (
              <p>Nenhuma partida cadastrada. Vamos marcar a primeira?</p>
            )}
            {admin && (
              <details className="panel">
                <summary>Agendar partida</summary>
                <form
                  onSubmit={(e) =>
                    form(e, async (data) => {
                      const result = await api<{ id: string }>(
                        `/groups/${group.id}/matches`,
                        "POST",
                        {
                          title: text(data, "title"),
                          type: text(data, "type"),
                          scheduledAt: new Date(
                            text(data, "scheduledAt"),
                          ).toISOString(),
                          location: text(data, "location"),
                          minPlayers: number(data, "minPlayers"),
                          maxPlayers: number(data, "maxPlayers"),
                          priceCents: Math.round(number(data, "price") * 100),
                          notes: text(data, "notes"),
                        },
                      );
                      location.assign(`/?group=${group.id}&match=${result.id}`);
                    })
                  }
                >
                  <div className="form-grid">
                    <Field label="Título">
                      <input
                        name="title"
                        required
                        minLength={2}
                        maxLength={100}
                      />
                    </Field>
                    <Field label="Modalidade">
                      <select name="type">
                        <option value="society">Society</option>
                        <option value="futsal">Futsal</option>
                        <option value="campo">Campo</option>
                      </select>
                    </Field>
                    <Field label="Data e hora (horário local)">
                      <input
                        type="datetime-local"
                        name="scheduledAt"
                        required
                      />
                    </Field>
                    <Field label="Local / endereço">
                      <input
                        name="location"
                        required
                        minLength={2}
                        maxLength={300}
                      />
                    </Field>
                    <Field label="Mínimo de jogadores">
                      <input
                        type="number"
                        name="minPlayers"
                        min={2}
                        max={100}
                        defaultValue={10}
                        required
                      />
                    </Field>
                    <Field label="Máximo de jogadores">
                      <input
                        type="number"
                        name="maxPlayers"
                        min={2}
                        max={100}
                        defaultValue={20}
                        required
                      />
                    </Field>
                    <Field label="Valor por jogador (R$)">
                      <input
                        type="number"
                        name="price"
                        min={0}
                        max={10000}
                        step="0.01"
                        defaultValue={0}
                        required
                      />
                    </Field>
                    <Field label="Observações">
                      <textarea name="notes" maxLength={1000} />
                    </Field>
                  </div>
                  <button disabled={busy}>Agendar partida</button>
                </form>
              </details>
            )}
            <section className="panel">
              <h2>Membros</h2>
              <ul>
                {group.members.map((m) => (
                  <li key={m.user.id}>
                    {m.user.name}{" "}
                    {m.role === "admin" && <small>administrador</small>}
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : (
          <>
            <p className="eyebrow">Seu futebol, organizado</p>
            <h1>Bora marcar o próximo?</h1>
            <p className="lead">Seus grupos, sua turma, suas partidas.</p>
            <div className="stats">
              <div>
                <strong>{groups.length}</strong>
                <span>grupos na sua conta</span>
              </div>
            </div>
            <h2>Meus grupos</h2>
            <div className="grid">
              {groups.map((g) => (
                <a
                  className="panel match-card"
                  href={`/?group=${g.id}`}
                  key={g.id}
                >
                  <span className="tag">{g.city || "Futebol amador"}</span>
                  <h3>{g.name}</h3>
                  <p>{g.description}</p>
                  <strong>
                    {g._count.members} membros · {g._count.matches} partidas
                  </strong>
                </a>
              ))}
            </div>
            {!groups.length && (
              <p>Crie seu primeiro grupo ou abra um convite recebido.</p>
            )}
            <details className="panel">
              <summary>Criar grupo</summary>
              <form
                onSubmit={(e) =>
                  form(e, async (data) => {
                    const result = await api<{ id: string }>(
                      "/groups",
                      "POST",
                      {
                        name: text(data, "name"),
                        description: text(data, "description"),
                        city: text(data, "city"),
                        teamCount: number(data, "teamCount"),
                      },
                    );
                    location.assign(`/?group=${result.id}`);
                  })
                }
              >
                <div className="form-grid">
                  <Field label="Nome do grupo">
                    <input name="name" minLength={2} maxLength={100} required />
                  </Field>
                  <Field label="Cidade">
                    <input name="city" maxLength={100} />
                  </Field>
                  <Field label="Descrição">
                    <textarea name="description" maxLength={1000} />
                  </Field>
                  <Field label="Quantidade de times no sorteio">
                    <input
                      name="teamCount"
                      type="number"
                      min={2}
                      max={8}
                      defaultValue={2}
                      required
                    />
                  </Field>
                </div>
                <button disabled={busy}>Criar grupo</button>
              </form>
            </details>
          </>
        )}
      </main>
      <footer>Partida Certa · Futebol amador, turma organizada.</footer>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
