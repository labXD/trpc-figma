import React, { useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./ui.css";
import { trpc } from "./trpc.ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { figmaUiLink } from "trpc-figma/link";

export function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [figmaUiLink({ pluginId: "qwerty" })],
    })
  );
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {/* Your app here */}
        <AppBak />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

declare function require(path: string): any;
function AppBak() {
  const testMut = trpc.hello2.useMutation();
  const t = trpc.hello.useQuery({ text: "World" });

  const onCreate = () => {
    testMut.mutate();
  };

  const onCancel = () => {
    parent.postMessage({ pluginMessage: { type: "cancel" } }, "*");
  };

  return (
    <main>
      <header>
        <img src={require("./logo.svg")} />
        <h2>Rectangle Creator</h2>
      </header>
      <section>
        <input id="input" type="number" min="0" />
        <label htmlFor="input">Rectangle Count</label>
        <h3>{t.data}</h3>
      </section>
      <footer>
        <button className="brand" onClick={() => onCreate()}>
          Create
        </button>
        <button onClick={onCancel}>Cancel</button>
      </footer>
    </main>
  );
}

const container = document.getElementById("react-page");
if (container) {
  const root = createRoot(container);

  root.render(<App />);
}
