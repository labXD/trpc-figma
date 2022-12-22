import { TRPCClientError, TRPCLink } from "@trpc/client";
import type { AnyRouter } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import type { TRPCFigmaResponse, TRPCFigmaRequest } from "../types";

interface Options {
  targetOrigin?: string;
  pluginId?: string;
}

export const figmaUiLink =
  <TRouter extends AnyRouter>({
    targetOrigin = "*",
    pluginId,
  }: Options = {}): TRPCLink<TRouter> =>
  (runtime) =>
  ({ op }) =>
    observable((observer) => {
      const listeners: (() => void)[] = [];
      const { id, type, path } = op;

      try {
        const input = runtime.transformer.serialize(op.input);

        const onMessage = (
          e: MessageEvent<{ pluginMessage: TRPCFigmaResponse }>
        ) => {
          const message = e.data.pluginMessage;
          if (!("trpc" in message)) return;
          const { trpc } = message;
          if (!trpc) return;
          if (!("id" in trpc) || trpc.id === null || trpc.id === undefined)
            return;
          if (id !== trpc.id) return;

          if ("error" in trpc) {
            const error = runtime.transformer.deserialize(trpc.error);
            observer.error(TRPCClientError.from({ ...trpc, error }));
            return;
          }

          observer.next({
            result: {
              ...trpc.result,
              ...((!trpc.result.type || trpc.result.type === "data") && {
                type: "data",
                data: runtime.transformer.deserialize(trpc.result.data),
              }),
            } as any,
          });

          if (type !== "subscription" || trpc.result.type === "stopped") {
            observer.complete();
          }
        };

        window.addEventListener("message", onMessage);
        listeners.push(() => window.removeEventListener("message", onMessage));

        parent.postMessage(
          {
            pluginMessage: {
              trpc: {
                id,
                jsonrpc: undefined,
                method: type,
                params: { path, input },
              },
            } as TRPCFigmaRequest,
          },
          targetOrigin
        );
      } catch (cause) {
        observer.error(
          new TRPCClientError(
            cause instanceof Error ? cause.message : "Unknown error"
          )
        );
      }
      return () => {
        listeners.forEach((unsub) => unsub());

        if (type === "subscription") {
          parent.postMessage({
            pluginMessage: {
              trpc: {
                id,
                jsonrpc: undefined,
                method: "subscription.stop",
              },
            } as TRPCFigmaRequest,
            pluginId,
          });
        }
      };
    });
