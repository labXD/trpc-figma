import { initTRPC } from "@trpc/server";
import { z } from "zod";
const t = initTRPC.create();

const appRouter = t.router({
  hello: t.procedure
    .input(
      z
        .object({
          name: z.string().nullish(),
        })
        .nullish()
    )
    .query((req) => {
      return `Hello ${req?.input?.name}`;
    }),
  hello2: t.procedure.mutation(() => {
    console.log(`Hello World!`);
  }),
});

export type AppRouter = typeof appRouter;
