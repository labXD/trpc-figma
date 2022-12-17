import {
  AnyProcedure,
  AnyRouter,
  ProcedureType,
  TRPCError,
} from "@trpc/server";
import type { NodeHTTPCreateContextOption } from "@trpc/server/dist/adapters/node-http/types";
import type { BaseHandlerOptions } from "@trpc/server/dist/internals/types";
import { Unsubscribable, isObservable } from "@trpc/server/observable";

import type { TRPCFigmaRequest, TRPCFigmaResponse } from "./types";

export type CreateFigmaContextOptions = {
  req: typeof figma.pluginId;
  res: undefined;
};

export type CreateFigmaHandlerOptions<TRouter extends AnyRouter> = Pick<
  BaseHandlerOptions<TRouter, CreateFigmaContextOptions["req"]> &
    NodeHTTPCreateContextOption<
      TRouter,
      CreateFigmaContextOptions["req"],
      CreateFigmaContextOptions["res"]
    >,
  "router" | "createContext" | "onError"
>;

export const createFigmaHandler = <TRouter extends AnyRouter>(
  opts: CreateFigmaHandlerOptions<TRouter>
) => {
  const { router, createContext, onError } = opts;
  const { transformer } = router._def._config;

  const subscriptions = new Map<number | string, Unsubscribable>();
  const listeners: (() => void)[] = [];

  const onMessage = async (message: TRPCFigmaRequest) => {
    if (!("trpc" in message)) return;
    const { trpc } = message;
    if (!("id" in trpc) || trpc.id === null || trpc.id === undefined) return;
    if (!trpc) return;

    const { id, jsonrpc, method } = trpc;

    const sendResponse = (response: TRPCFigmaResponse["trpc"]) => {
      figma.ui.postMessage({
        trpc: { id, jsonrpc, ...response },
      } as TRPCFigmaResponse);
    };

    let params: { path: string; input: unknown } | undefined;
    let input: any;
    let ctx: any;

    try {
      if (method === "subscription.stop") {
        const subscription = subscriptions.get(id);
        if (subscription) {
          subscription.unsubscribe();
          sendResponse({
            result: {
              type: "stopped",
            },
          });
        }
        subscriptions.delete(id);
        return;
      }

      params = trpc.params;

      input = transformer.input.deserialize(params?.input);

      ctx = await createContext?.({ req: figma.pluginId, res: undefined });
      const caller = router.createCaller(ctx);

      const segments = params?.path.split(".");
      const procedureFn = segments?.reduce(
        (acc, segment) => acc[segment],
        caller as any
      ) as AnyProcedure;

      const result = await procedureFn(input);

      if (method !== "subscription") {
        const data = transformer.output.serialize(result);
        sendResponse({
          result: {
            type: "data",
            data,
          },
        });
        return;
      }

      if (!isObservable(result)) {
        throw new TRPCError({
          message: "Subscription ${params.path} did not return an observable",
          code: "INTERNAL_SERVER_ERROR",
        });
      }

      const subscription = result.subscribe({
        next: (data) => {
          sendResponse({
            result: {
              type: "data",
              data,
            },
          });
        },
        error: (cause) => {
          const error = getErrorFromUnknown(cause);

          onError?.({
            error,
            type: method,
            path: params?.path,
            input,
            ctx,
            req: figma.pluginId,
          });

          sendResponse({
            error: router.getErrorShape({
              error,
              type: method,
              path: params?.path,
              input,
              ctx,
            }),
          });
        },
        complete: () => {
          sendResponse({
            result: {
              type: "stopped",
            },
          });
        },
      });

      if (subscriptions.has(id)) {
        subscription.unsubscribe();
        sendResponse({
          result: {
            type: "stopped",
          },
        });
        throw new TRPCError({
          message: `Duplicate id ${id}`,
          code: "BAD_REQUEST",
        });
      }
      listeners.push(() => subscription.unsubscribe());

      subscriptions.set(id, subscription);

      sendResponse({
        result: {
          type: "started",
        },
      });
      return;
    } catch (cause) {
      const error = getErrorFromUnknown(cause);

      onError?.({
        error,
        type: method as ProcedureType,
        path: params?.path,
        input,
        ctx,
        req: figma.pluginId,
      });

      sendResponse({
        error: router.getErrorShape({
          error,
          type: method as ProcedureType,
          path: params?.path,
          input,
          ctx,
        }),
      });
    }
  };

  figma.ui.on("message", onMessage);
  listeners.push(() => figma.ui.off("message", onMessage));
};

export function getErrorFromUnknown(cause: unknown): TRPCError {
  if (cause instanceof Error && cause.name === "TRPCError") {
    return cause as TRPCError;
  }

  let errorCause: Error | undefined = undefined;
  let stack: string | undefined = undefined;

  if (cause instanceof Error) {
    errorCause = cause;
    stack = cause.stack;
  }

  const error = new TRPCError({
    message: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
    cause: errorCause,
  });

  if (stack) {
    error.stack = stack;
  }

  return error;
}
