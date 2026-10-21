import { useId, type FormEvent } from "react";
import type { ParsedPlayers, DrawMode, Player } from "../domain/draw";
import { PlayerRatings } from "./PlayerRatings";

interface Props {
  mode: DrawMode;
  onMode: (mode: DrawMode) => void;
  onStars: (player: Player, value: number | null) => void;
  choice: string;
  customCount: string;
  names: string;
  parsed: ParsedPlayers;
  errors: string[];
  fixedGoalkeepers: boolean;
  onFixedGoalkeepers: (value: boolean) => void;
  onChoice: (value: string) => void;
  onCount: (value: string) => void;
  onNames: (value: string) => void;
  onSubmit: () => void;
}

export function DrawForm(props: Props) {
  const id = useId();
  const goalkeepers = props.parsed.players.filter((p) => p.goalkeeper).length;
  function submit(event: FormEvent) {
    event.preventDefault();
    props.onSubmit();
  }
  return (
    <form className="draw-form" onSubmit={submit} noValidate>
      <div className="section-heading">
        <span className="step">01</span>
        <div>
          <h2>Monte a sua partida</h2>
          <p>Escolha os times e reúna a turma.</p>
        </div>
      </div>
      <fieldset className="draw-modes">
        <legend>Tipo de sorteio</legend>
        {[
          {
            value: "random" as const,
            title: "Sorteio aleatório",
            description: "Distribua sem considerar habilidade.",
          },
          {
            value: "balanced" as const,
            title: "Sorteio equilibrado",
            description: "Use estrelas para aproximar a força dos times.",
          },
        ].map((option) => (
          <label
            className={`draw-mode ${props.mode === option.value ? "selected" : ""}`}
            key={option.value}
          >
            <input
              type="radio"
              name="drawMode"
              value={option.value}
              checked={props.mode === option.value}
              onChange={() => props.onMode(option.value)}
            />
            <span>
              <strong>{option.title}</strong>
              <small>{option.description}</small>
            </span>
          </label>
        ))}
      </fieldset>
      <fieldset className="team-options">
        <legend>Quantos times vão jogar?</legend>
        {[
          { value: "2", label: "2 times" },
          { value: "3", label: "3 times" },
          { value: "more", label: "Preciso de mais times" },
        ].map((option) => (
          <label
            className={`team-option ${props.choice === option.value ? "selected" : ""}`}
            key={option.value}
          >
            <input
              type="radio"
              name="teamCount"
              value={option.value}
              checked={props.choice === option.value}
              onChange={() => props.onChoice(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
      {props.choice === "more" && (
        <label className="field custom-count">
          Quantidade de times
          <input
            type="number"
            min={4}
            step={1}
            required
            inputMode="numeric"
            value={props.customCount}
            onChange={(e) => props.onCount(e.target.value)}
          />
        </label>
      )}
      <div className="fixed-mode">
        <button
          type="button"
          className={`fixed-toggle ${props.fixedGoalkeepers ? "enabled" : ""}`}
          aria-pressed={props.fixedGoalkeepers}
          aria-describedby={`${id}-fixed-help`}
          onClick={() => props.onFixedGoalkeepers(!props.fixedGoalkeepers)}
        >
          <span aria-hidden="true">🧤</span> Goleiros fixos{" "}
          <span className="toggle-state">
            {props.fixedGoalkeepers ? "Ativado" : "Desativado"}
          </span>
        </button>
        <p id={`${id}-fixed-help`} className="field-help">
          {props.fixedGoalkeepers
            ? "Sorteie apenas os jogadores de linha. Os goleiros ficam fora dos times e não precisam ser informados. Se quiser listá-los, use (GK)."
            : "Ative para manter os goleiros fora do sorteio e montar apenas times de linha."}
        </p>
      </div>
      <label className="field" htmlFor={`${id}-players`}>
        Quem vai jogar?
      </label>
      <p id={`${id}-help`} className="field-help">
        Um jogador por linha. Identifique cada goleiro com <strong>(GK)</strong>{" "}
        após o nome.
      </p>
      <textarea
        id={`${id}-players`}
        aria-describedby={`${id}-help ${id}-counts`}
        aria-invalid={props.errors.length ? true : undefined}
        placeholder={"João (GK)\nPedro\nLeonardo\nCarlos (GK)\nLucas\nRafael"}
        value={props.names}
        onChange={(e) => props.onNames(e.target.value)}
        spellCheck={false}
        rows={9}
      />
      <div id={`${id}-counts`} className="player-counts" aria-live="polite">
        <span>
          <strong>
            {props.fixedGoalkeepers
              ? props.parsed.players.length - goalkeepers
              : props.parsed.players.length}
          </strong>{" "}
          {props.fixedGoalkeepers ? "jogadores de linha" : "jogadores"}
        </span>
        <span>
          <strong>{goalkeepers}</strong>{" "}
          {goalkeepers === 1 ? "goleiro" : "goleiros"}
        </span>
        <span>
          {props.fixedGoalkeepers
            ? "Goleiros fora do sorteio"
            : "1 goleiro por time"}
        </span>
      </div>
      {props.mode === "balanced" && (
        <PlayerRatings
          players={props.parsed.players}
          fixedGoalkeepers={props.fixedGoalkeepers}
          onChange={props.onStars}
        />
      )}
      {!!props.errors.length && (
        <div className="validation" role="alert">
          <strong>Confira antes de sortear</strong>
          <ul>
            {props.errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      <button className="button primary draw-button" type="submit">
        Sortear times <span aria-hidden="true">↗</span>
      </button>
      <p className="privacy-note">
        Os nomes ficam apenas nesta página. Sem cadastro, sem envio ao servidor.
      </p>
    </form>
  );
}
