import { useId, type FormEvent } from "react";
import type { ParsedPlayers } from "../domain/draw";

interface Props {
  choice: string;
  customCount: string;
  names: string;
  parsed: ParsedPlayers;
  errors: string[];
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
          <strong>{props.parsed.players.length}</strong> jogadores
        </span>
        <span>
          <strong>{goalkeepers}</strong>{" "}
          {goalkeepers === 1 ? "goleiro" : "goleiros"}
        </span>
        <span>1 goleiro por time</span>
      </div>
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
