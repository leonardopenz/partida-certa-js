import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
});
Object.defineProperties(globalThis, {
  window: { value: dom.window, configurable: true },
  document: { value: dom.window.document, configurable: true },
  navigator: { value: dom.window.navigator, configurable: true },
  HTMLElement: { value: dom.window.HTMLElement, configurable: true },
  requestAnimationFrame: {
    value: (fn: FrameRequestCallback) => {
      fn(0);
      return 0;
    },
    configurable: true,
  },
  matchMedia: { value: () => ({ matches: true }), configurable: true },
});
const { render, fireEvent, screen, cleanup, waitFor, within } = await import(
  "@testing-library/react"
);
const { default: App } = await import("../src/App");
afterEach(cleanup);
const names = "João (GK)\nCarlos (GK)\nLeonardo\nLucas\nPedro";
function fill(value = names) {
  fireEvent.change(screen.getByLabelText("Quem vai jogar?"), {
    target: { value },
  });
}
function draw() {
  fireEvent.click(screen.getByRole("button", { name: "Sortear times" }));
}

test("formulário oferece campo personalizado e impede falta de goleiros", () => {
  render(<App />);
  assert.equal(screen.queryByLabelText("Quantidade de times"), null);
  fireEvent.click(screen.getByLabelText("Preciso de mais times"));
  assert.equal(
    (screen.getByLabelText("Quantidade de times") as HTMLInputElement).value,
    "4",
  );
  fill();
  draw();
  assert.match(
    screen.getByRole("alert").textContent ?? "",
    /Marque mais 2 jogadores/,
  );
  assert.equal(
    screen.queryByRole("button", { name: /Sortear novamente/ }),
    null,
  );
  fireEvent.change(screen.getByLabelText("Quantidade de times"), {
    target: { value: "2" },
  });
  draw();
  assert.match(screen.getByRole("alert").textContent ?? "", /pelo menos 4/);
});

test("sorteia, sorteia novamente, preserva lista e invalida resultado ao editar", () => {
  render(<App />);
  fill();
  draw();
  assert.equal(screen.getAllByRole("article").length, 2);
  assert.equal(screen.getAllByText("GK", { exact: true }).length, 2);
  fireEvent.click(screen.getByRole("button", { name: /Sortear novamente/ }));
  assert.equal(screen.getAllByRole("article").length, 2);
  assert.equal(
    (screen.getByLabelText("Quem vai jogar?") as HTMLTextAreaElement).value,
    names,
  );
  fill(`${names}\nRafael`);
  assert.equal(
    screen.queryByRole("heading", { name: "Os times estão prontos." }),
    null,
  );
});

test("cópia confirmada somente após sucesso; falha oferece seleção manual", async () => {
  let copiedText = "";
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: async (text: string) => {
        copiedText = text;
      },
    },
  });
  render(<App />);
  fill();
  draw();
  fireEvent.click(screen.getByRole("button", { name: "Enviar no WhatsApp" }));
  await waitFor(() =>
    assert.match(
      screen.getByRole("status").textContent ?? "",
      /Times copiados!/,
    ),
  );
  assert.match(copiedText, /PARTIDA CERTA/);
  assert.match(copiedText, /João \(GK\)/);
  fireEvent.click(screen.getByRole("button", { name: /Sortear novamente/ }));
  assert.equal(screen.queryByText(/Times copiados!/), null);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: async () => {
        throw new Error("Denied");
      },
    },
  });
  fireEvent.click(screen.getByRole("button", { name: "Enviar no WhatsApp" }));
  await waitFor(() => assert.ok(screen.getByLabelText("Texto dos times")));
  assert.equal(screen.queryByText(/Times copiados!/), null);
  fireEvent.click(screen.getByRole("button", { name: "Selecionar texto" }));
  const manual = screen.getByLabelText(
    "Texto dos times",
  ) as HTMLTextAreaElement;
  assert.equal(manual.selectionEnd, manual.value.length);
});

test("goleiros fixos: 3 times de linha, cópia separada, novo sorteio e retorno ao modo normal", async () => {
  let copied = "";
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: async (text: string) => {
        copied = text;
      },
    },
  });
  render(<App />);
  fireEvent.click(screen.getByLabelText("3 times"));
  const toggle = screen.getByRole("button", { name: /Goleiros fixos/ });
  assert.equal(toggle.getAttribute("aria-pressed"), "false");
  fireEvent.click(toggle);
  assert.equal(toggle.getAttribute("aria-pressed"), "true");
  fill(`${names}\nRafael\nBruno\nMarcos`);
  draw();
  const cards = screen.getAllByRole("article");
  assert.equal(cards.length, 3);
  assert.ok(cards.every((card) => !card.textContent?.includes("GK")));
  assert.ok(
    screen.getByRole("region", { name: "Goleiros fixos fora do sorteio" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Enviar no WhatsApp" }));
  await waitFor(() => assert.match(copied, /GOLEIROS FIXOS/));
  assert.equal(copied.match(/João \(GK\)/g)?.length, 1);
  fireEvent.click(screen.getByRole("button", { name: /Sortear novamente/ }));
  assert.equal(screen.getAllByRole("article").length, 3);
  assert.ok(screen.getByText("João (GK)"));
  fireEvent.click(toggle);
  assert.equal(
    screen.queryByRole("heading", { name: "Os times estão prontos." }),
    null,
  );
  draw();
  assert.match(
    screen.getByRole("alert").textContent ?? "",
    /Marque mais 1 jogador/,
  );
});

test("modo fixo também permite informar somente a lista dos jogadores de linha", () => {
  render(<App />);
  fireEvent.click(screen.getByLabelText("3 times"));
  fireEvent.click(screen.getByRole("button", { name: /Goleiros fixos/ }));
  fill("A\nB\nC\nD\nE\nF");
  draw();
  assert.equal(screen.getAllByRole("article").length, 3);
  assert.equal(screen.queryByRole("alert"), null);
});

function setStars(name: string, value: string) {
  const group = screen.getByRole("group", { name: `Nível de ${name}` });
  fireEvent.click(within(group).getByRole("radio", { name: value }));
}

test("modo equilibrado exige avaliações, aceita meia estrela e zero, e copia sem divulgá-las", async () => {
  let copied = "";
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: async (text: string) => {
        copied = text;
      },
    },
  });
  render(<App />);
  fireEvent.click(screen.getByLabelText(/Sorteio equilibrado/));
  fill("João (GK)\nCarlos (GK)\nAna\nPedro");
  draw();
  assert.match(screen.getByRole("alert").textContent ?? "", /Avalie todos/);
  setStars("João", "0 estrelas");
  setStars("Carlos", "5 estrelas");
  setStars("Ana", "3,5 estrelas");
  setStars("Pedro", "1,5 estrelas");
  assert.ok(screen.getByText("4/4 avaliados"));
  draw();
  assert.equal(screen.getAllByRole("article").length, 2);
  assert.ok(screen.getByText(/Diferença entre as médias/));
  fireEvent.click(screen.getByRole("button", { name: "Enviar no WhatsApp" }));
  await waitFor(() => assert.match(copied, /PARTIDA CERTA/));
  assert.doesNotMatch(copied, /estrela|★|média|3[.,]5/);
  fireEvent.click(screen.getByRole("button", { name: /Sortear novamente/ }));
  assert.equal(screen.getAllByRole("article").length, 2);
  assert.equal(
    (
      within(screen.getByRole("group", { name: "Nível de Ana" })).getByRole(
        "radio",
        { name: "3,5 estrelas" },
      ) as HTMLInputElement
    ).checked,
    true,
  );
});

test("preserva estrelas ao alternar modo e editar outros jogadores, removendo avaliações de excluídos", () => {
  render(<App />);
  fireEvent.click(screen.getByLabelText(/Sorteio equilibrado/));
  fireEvent.click(screen.getByRole("button", { name: /Goleiros fixos/ }));
  fill("Ana\nPedro\nGoleiro (GK)");
  assert.equal(screen.queryByRole("group", { name: "Nível de Goleiro" }), null);
  setStars("Ana", "0 estrelas");
  setStars("Pedro", "4,5 estrelas");
  draw();
  assert.equal(screen.getAllByRole("article").length, 2);
  fireEvent.click(screen.getByLabelText(/Sorteio aleatório/));
  assert.equal(
    screen.queryByRole("heading", { name: "Os times estão prontos." }),
    null,
  );
  fireEvent.click(screen.getByLabelText(/Sorteio equilibrado/));
  fill("Pedro\nNovo\nANA\nGoleiro (GK)");
  assert.equal(
    (
      within(screen.getByRole("group", { name: "Nível de ANA" })).getByRole(
        "radio",
        { name: "0 estrelas" },
      ) as HTMLInputElement
    ).checked,
    true,
  );
  assert.equal(
    (
      within(screen.getByRole("group", { name: "Nível de Pedro" })).getByRole(
        "radio",
        { name: "4,5 estrelas" },
      ) as HTMLInputElement
    ).checked,
    true,
  );
  fill("Ana\nGoleiro (GK)");
  fill("Ana\nPedro\nGoleiro (GK)");
  assert.ok(
    within(screen.getByRole("group", { name: "Nível de Pedro" })).getByText(
      "Sem avaliação",
    ),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Limpar avaliação de Ana" }),
  );
  assert.ok(
    within(screen.getByRole("group", { name: "Nível de Ana" })).getByText(
      "Sem avaliação",
    ),
  );
});
