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
const { render, fireEvent, screen, cleanup, waitFor } = await import(
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
