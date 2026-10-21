import { useRef, useState } from "react";
import { formatTeams, type Team, type Player } from "../domain/draw";
import { averageStars } from "../domain/balance";

export function TeamResults({
  teams,
  onRedraw,
  fixedGoalkeepers,
  balanced = false,
}: {
  teams: Team[];
  onRedraw: () => void;
  fixedGoalkeepers?: Player[];
  balanced?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [manual, setManual] = useState(false);
  const [copying, setCopying] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const text = formatTeams(teams, fixedGoalkeepers);
  async function copy() {
    setCopying(true);
    setCopied(false);
    setManual(false);
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setManual(true);
    } finally {
      setCopying(false);
    }
  }
  return (
    <section className="results" aria-labelledby="results-title">
      <div className="results-heading">
        <div>
          <p className="eyebrow">TURMA DIVIDIDA. BORA JOGAR.</p>
          <h2 id="results-title">Os times estão prontos.</h2>
        </div>
        <span className="result-pill">
          {teams.length} times ·{" "}
          {teams.reduce((total, team) => total + team.players.length, 0)}{" "}
          {fixedGoalkeepers ? "jogadores de linha" : "jogadores"}
        </span>
      </div>
      {balanced && (
        <div className="balance-summary">
          <strong>Sorteio equilibrado</strong>
          <p>
            Diferença entre as médias:{" "}
            {(
              Math.max(...teams.map(averageStars)) -
              Math.min(...teams.map(averageStars))
            ).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}{" "}
            estrela(s). O equilíbrio depende das avaliações; um jogador a mais
            também pode fazer diferença.
          </p>
          <p>
            As avaliações individuais não são incluídas no texto para WhatsApp.
          </p>
        </div>
      )}
      {fixedGoalkeepers && (
        <section
          className="fixed-keepers"
          aria-label="Goleiros fixos fora do sorteio"
        >
          <h3>🧤 Goleiros fixos</h3>
          <p>
            Os goleiros ficam fora dos times. Apenas os jogadores de linha
            revezam.
          </p>
          {!!fixedGoalkeepers.length && (
            <ul>
              {fixedGoalkeepers.map((player) => (
                <li key={player.id}>{player.name} (GK)</li>
              ))}
            </ul>
          )}
        </section>
      )}
      <div className="teams-grid">
        {teams.map((team, index) => (
          <article className="team-card" key={team.name}>
            <div className="team-card-heading">
              <span
                className={`team-number color-${index % 4}`}
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{team.name}</h3>
                <p>
                  {team.players.length}{" "}
                  {fixedGoalkeepers ? "jogadores de linha" : "jogadores"}
                </p>
                {balanced && (
                  <p className="team-average">
                    ★ Média{" "}
                    {averageStars(team).toLocaleString("pt-BR", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    de 5 estrelas
                  </p>
                )}
              </div>
            </div>
            <ul>
              {team.players.map((player) => (
                <li
                  className={player.goalkeeper ? "goalkeeper" : ""}
                  key={player.id}
                >
                  <span className="player-icon" aria-hidden="true">
                    {player.goalkeeper ? "🧤" : "·"}
                  </span>
                  <span>{player.name}</span>
                  {player.goalkeeper && <span className="gk-badge">GK</span>}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <div className="result-actions">
        <button className="button secondary" type="button" onClick={onRedraw}>
          ↻ Sortear novamente
        </button>
        <button
          className="button primary"
          type="button"
          disabled={copying}
          onClick={() => void copy()}
        >
          {copying ? "Copiando…" : "Enviar no WhatsApp"}
        </button>
      </div>
      <p className="share-help">
        Copie os times e cole na conversa do seu grupo.
      </p>
      {copied && (
        <p className="success-message" role="status">
          Times copiados! Abra o WhatsApp e cole na conversa desejada.
        </p>
      )}
      {manual && (
        <div className="manual-copy">
          <p role="status">
            Não foi possível copiar automaticamente. Selecione o texto abaixo e
            copie para colar no WhatsApp.
          </p>
          <label className="field">
            Texto dos times
            <textarea
              ref={textRef}
              value={text}
              readOnly
              rows={10}
              onFocus={(e) => e.currentTarget.select()}
            />
          </label>
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              textRef.current?.focus();
              textRef.current?.select();
            }}
          >
            Selecionar texto
          </button>
        </div>
      )}
    </section>
  );
}
