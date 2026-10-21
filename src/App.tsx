import { useMemo, useRef, useState } from "react";
import { DrawForm } from "./components/DrawForm";
import { TeamResults } from "./components/TeamResults";
import {
  drawTeams,
  parsePlayers,
  validateDraw,
  type Team,
} from "./domain/draw";

export default function App() {
  const [choice, setChoice] = useState("2");
  const [customCount, setCustomCount] = useState("4");
  const [names, setNames] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [drawId, setDrawId] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);
  const parsed = useMemo(() => parsePlayers(names), [names]);
  const count = choice === "more" ? Number(customCount) : Number(choice);
  function invalidate() {
    setTeams(null);
    setErrors([]);
  }
  function draw() {
    const issues = validateDraw(parsed, count);
    if (choice === "more" && (!Number.isSafeInteger(count) || count < 4))
      issues.unshift(
        "Na opção de mais times, informe uma quantidade inteira de pelo menos 4.",
      );
    setErrors(issues);
    if (issues.length) {
      setTeams(null);
      return;
    }
    setTeams(drawTeams(parsed, count));
    setDrawId((id) => id + 1);
    requestAnimationFrame(() =>
      resultsRef.current?.scrollIntoView?.({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      }),
    );
  }
  return (
    <>
      <header className="site-header">
        <a href="./" className="brand" aria-label="Partida Certa, início">
          <span className="brand-icon" aria-hidden="true">
            ⚽
          </span>
          <span>
            partida<span className="brand-accent">certa</span>
          </span>
        </a>
        <span className="header-note">
          <span aria-hidden="true">●</span> Futebol sem complicação
        </span>
      </header>
      <main>
        <section className="intro">
          <p className="eyebrow">O RACHÃO COMEÇA AQUI</p>
          <h1>
            A turma você reúne.
            <br />
            Os times, <em>a gente sorteia.</em>
          </h1>
          <p>
            Um goleiro de cada lado, jogadores bem distribuídos e mais tempo com
            a bola rolando.
          </p>
          <div className="intro-tags">
            <span>Sem cadastro</span>
            <span>Sorteio na hora</span>
            <span>Pronto para o grupo</span>
          </div>
        </section>
        <div className="setup-layout">
          <DrawForm
            choice={choice}
            customCount={customCount}
            names={names}
            parsed={parsed}
            errors={errors}
            onChoice={(value) => {
              invalidate();
              setChoice(value);
            }}
            onCount={(value) => {
              invalidate();
              setCustomCount(value);
            }}
            onNames={(value) => {
              invalidate();
              setNames(value);
            }}
            onSubmit={draw}
          />
          <aside className="how-it-works">
            <div className="pitch" aria-hidden="true">
              <div className="pitch-circle" />
              <div className="goal left" />
              <div className="goal right" />
              <span className="pitch-player p1" />
              <span className="pitch-player p2" />
              <span className="pitch-player p3" />
              <span className="pitch-player p4" />
            </div>
            <p className="eyebrow">SIMPLES COMO FUTEBOL DE RUA</p>
            <h2>Da lista para o campo.</h2>
            <ol>
              <li>
                <span>01</span>
                <div>
                  <strong>Escolha os times</strong>
                  <p>Dois, três ou quantos sua turma precisar.</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Liste a galera</strong>
                  <p>Um nome por linha. Use (GK) para os goleiros.</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Sorteie e compartilhe</strong>
                  <p>Copie a escalação e leve para o WhatsApp.</p>
                </div>
              </li>
            </ol>
            <div className="keeper-note">
              <span aria-hidden="true">🧤</span>
              <p>
                <strong>Goleiro tem lugar certo.</strong>
                <br />
                Cada time recebe exatamente um. Os demais jogadores são
                distribuídos aleatoriamente.
              </p>
            </div>
          </aside>
        </div>
        <div ref={resultsRef} className="results-anchor">
          {teams && <TeamResults key={drawId} teams={teams} onRedraw={draw} />}
        </div>
      </main>
      <footer>
        <span className="footer-brand">partidacerta</span>
        <span>Menos organização. Mais futebol.</span>
      </footer>
    </>
  );
}
