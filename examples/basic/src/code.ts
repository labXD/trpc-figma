import { createFigmaHandler } from "trpc-figma/adapter";
import { appRouter } from "./trpc.code";

createFigmaHandler({
  router: appRouter,
  createContext: () => ({}),
});

figma.showUI(__html__, { themeColors: true, height: 300 });
