import { initTRPC } from "@trpc/server";
import { z } from "zod";
const t = initTRPC.create();

export const appRouter = t.router({
  hello: t.procedure
    .input(
      z
        .object({
          text: z.string().nullish(),
        })
        .nullish()
    )
    .query((req) => {
      return `Hello ${req.input?.text}`;
    }),
  hello2: t.procedure.mutation(() => {
    console.log(`Hello World!`);
  }),
});

export type AppRouter = typeof appRouter;
