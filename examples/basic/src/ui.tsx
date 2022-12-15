import React, { useState } from "react";
import * as ReactDOM from "react-dom";
import "./ui.css";
import { trpc } from "./trpc.ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { figmaUiLink } from "trpc-figma";

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
  const inputRef = React.useRef<HTMLInputElement>(null);

  const onCreate = () => {
    const count = Number(inputRef.current?.value || 0);
    parent.postMessage(
      { pluginMessage: { type: "create-rectangles", count } },
      "*"
    );
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
        <input id="input" type="number" min="0" ref={inputRef} />
        <label htmlFor="input">Rectangle Count</label>
      </section>
      <footer>
        <button className="brand" onClick={() => testMut.mutate()}>
          Create
        </button>
        <button onClick={onCancel}>Cancel</button>
      </footer>
    </main>
  );
}

ReactDOM.render(<App />, document.getElementById("react-page"));
