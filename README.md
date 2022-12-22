## **[Figma plugin](https://www.figma.com/plugin-docs/) support for [tRPC](https://trpc.io/)** 🔌

_Mostly adapted from [trpc-chrome](https://github.com/jlalmes/trpc-chrome)_

#### 1. Install `trpc-figma`

We are presuming usage with React but `trpc-figma` can be used with any framework with `trpc` support or even vanilla js.

```shell
pnpm install zod @trpc/client @trpc/server @trpc/react-query @tanstack/react-query
```

#### 2. Compile pkgs

Once installation is complete, we need to configure our bundlers to compile `trpc` pkgs. To ensure best experience, we recommend using
`webpack-post-compile-plugin`.

```shell
pnpm add -D webpack-post-compile-plugin
```

Then add the following to to the `webpack.config.js` file in the plugins array

```js
const PostCompilePlugin = require("webpack-post-compile-plugin");

const config = {
  plugins: [
    new PostCompilePlugin({
      compilePaths: ["node_modules/@trpc", "node_modules/zod"],
    }),
  ],
};
```

Check out the `examples/basic` directory for a complete example

Please ensure there is also a loader to compile js files. If using `ts-loader` is being used in conjuction with `webpack`,
then make sure to add `"allowJs": true` to the `compilerOptions` in the `tsconfig.json` file and ensure that the `ts-loader` is
setup to test against both js and ts files using regex like `test: /\.(tsx?|jsx?)$/`.

#### 3. Usage

Setup `createFigmaHandler` in the main thread:

```ts
import { initTRPC } from "@trpc/server";
import { createFigmaHandler } from "trpc-figma";

const t = initTRPC.create({
  isServer: false,
  allowOutsideOfServer: true,
});

const appRouter = t.router({
  // ...procedures
});

export type AppRouter = typeof appRouter;

createFigmaHandler({
  router: appRouter,
});
```

Add `figmaUiLink` to the `trpc` configuration in the UI thread:

```ts
import { createTRPCClient } from "@trpc/client";
import { figmaUiLink } from "trpc-figma";

import type { AppRouter } from "./background";

export const trpcClient = createTRPCClient<AppRouter>({
  links: [figmaUiLink({ pluginId: "hjgjhg6yughg" })],
});
```

### License

Distributed under the MIT License

### Inspired by

- [comlink](https://github.com/GoogleChromeLabs/comlink)
- [comlink-figma](https://github.com/martynaskadisa/figma-comlink)
