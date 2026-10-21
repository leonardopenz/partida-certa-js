import { useId } from "react";
import type { Player } from "../domain/draw";

const starLabel = (value: number) =>
  `${value.toLocaleString("pt-BR")} ${value === 1 ? "estrela" : "estrelas"}`;

function StarRating({
  player,
  onChange,
}: {
  player: Player;
  onChange: (value: number | null) => void;
}) {
  const id = useId();
  return (
    <fieldset className="star-rating">
      <legend>Nível de {player.name}</legend>
      <div className="star-controls">
        <label
          className={`zero-stars ${player.stars === 0 ? "selected" : ""}`}
          title="0 estrelas"
        >
          <input
            type="radio"
            name={id}
            value="0"
            aria-label="0 estrelas"
            checked={player.stars === 0}
            onChange={() => onChange(0)}
          />
          <span aria-hidden="true">0</span>
        </label>
        <div className="star-icons">
          {Array.from({ length: 10 }, (_, i) => {
            const value = (i + 1) / 2;
            return (
              <label
                className={`star-half ${i % 2 ? "right-half" : "left-half"} ${(player.stars ?? -1) >= value ? "filled" : ""}`}
                key={value}
                title={starLabel(value)}
              >
                <input
                  type="radio"
                  name={id}
                  value={value}
                  aria-label={starLabel(value)}
                  checked={player.stars === value}
                  onChange={() => onChange(value)}
                />
                <span className="star-glyph" aria-hidden="true">
                  ★
                </span>
              </label>
            );
          })}
        </div>
        <button
          type="button"
          className="clear-rating"
          aria-label={`Limpar avaliação de ${player.name}`}
          disabled={player.stars == null}
          onClick={() => onChange(null)}
        >
          Limpar
        </button>
      </div>
      <span className={`rating-value ${player.stars == null ? "unrated" : ""}`}>
        {player.stars == null
          ? "Sem avaliação"
          : `${starLabel(player.stars)} de 5`}
      </span>
    </fieldset>
  );
}

export function PlayerRatings({
  players,
  fixedGoalkeepers,
  onChange,
}: {
  players: Player[];
  fixedGoalkeepers: boolean;
  onChange: (player: Player, value: number | null) => void;
}) {
  const included = players.filter((p) => !fixedGoalkeepers || !p.goalkeeper);
  const rated = included.filter((p) => p.stars != null).length;
  return (
    <section className="player-ratings" aria-labelledby="ratings-title">
      <div className="ratings-heading">
        <h3 id="ratings-title">Avalie os participantes</h3>
        <span>
          {rated}/{included.length} avaliados
        </span>
      </div>
      <p className="field-help">
        Clique na metade esquerda ou direita de uma estrela para escolher meias
        estrelas ou estrelas inteiras. Zero é uma avaliação válida; vazio
        significa sem avaliação. Avalie cada pessoa pela habilidade na sua
        função.
      </p>
      {!included.length ? (
        <p className="field-help">
          Adicione jogadores de linha à lista para começar a avaliar.
        </p>
      ) : (
        included.map((player) => (
          <div
            className="rating-row"
            key={player.id}
          >
            <div className="rated-player-name">
              {player.name}
              {player.goalkeeper && <span className="gk-badge">GK</span>}
            </div>
            <StarRating
              player={player}
              onChange={(value) => onChange(player, value)}
            />
          </div>
        ))
      )}
      {fixedGoalkeepers && (
        <p className="field-help">
          Goleiros fixos não precisam de avaliação: eles ficam fora do cálculo.
        </p>
      )}
    </section>
  );
}
