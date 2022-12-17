import { createFigmaHandler } from "trpc-figma";
import { appRouter } from "./trpc.code";

createFigmaHandler({
  router: appRouter,
  createContext: () => ({}),
});

const test = undefined;

const test2 = test ?? "hello";
console.log(test2);

figma.showUI(__html__, { themeColors: true, height: 300 });
