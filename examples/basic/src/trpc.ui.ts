import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "./trpc.code";

export const trpc = createTRPCReact<AppRouter>();
