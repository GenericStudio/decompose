const path = require("path");
const ExportFilesPlugin = require("./ExportFilesPlugin");
const IncludeMainExportsPlugin = require("./IncludeMainExportsPlugin");
const RewriteImportsPlugin = require("./RewriteImportsPlugin");
const ExplodeGroupedImportsPlugin = require("./ExplodeGroupedImportsPlugin");
const DeIndexPlugin = require("./DeIndexPlugin");

module.exports = {
  mode: "production",
  devtool: "source-map", // Enable source maps for better debugging in production

  context: path.join(process.cwd(), "decompose_input"), // Define the root directory
  entry: "./example_entries/esmodules/index.js", // Entry file of the module

  output: {
    filename: "[name].bundle.js",
    path: "/Users/ecatlin/personal/extractor/decompose_output/webpack_build",
    clean: true,
  },
  optimization: {
    usedExports: true, // Tree Shake
    minimize: false, // Minify
    concatenateModules: false, // Optimize Webpack internals
  },
  plugins: [
    new ExportFilesPlugin({
      outputPath:
        "/Users/ecatlin/personal/extractor/decompose_output/0ExtractFilesPluginOutput",
    }), // relative to webpack output
    new IncludeMainExportsPlugin({
      outputPath:
        "/Users/ecatlin/personal/extractor/decompose_output/0ExtractFilesPluginOutput",
    }),
    new RewriteImportsPlugin({
      inputPath:
        "/Users/ecatlin/personal/extractor/decompose_output/0ExtractFilesPluginOutput",
      outputPath:
        "/Users/ecatlin/personal/extractor/decompose_output/1RewriteImportsPlugin",
    }),

    new ExplodeGroupedImportsPlugin({
      inputPath:
        "/Users/ecatlin/personal/extractor/decompose_output/1RewriteImportsPlugin",
      outputPath:
        "/Users/ecatlin/personal/extractor/decompose_output/2ExplodeGroupedImportsPlugin",
    }),
    new DeIndexPlugin({
      inputPath:
        "/Users/ecatlin/personal/extractor/decompose_output/2ExplodeGroupedImportsPlugin",
      outputPath:
        "/Users/ecatlin/personal/extractor/decompose_output/3DeIndexPlugin",
    }),
  ],
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      {
        test: /\.(js|jsx|mjs)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
            plugins: ["@babel/plugin-syntax-dynamic-import"],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
    ],
  },
  // Define big list of npm modules NOT to traverse.
  externals: {
    "@analytics/cookie-utils": "commonjs2 @analytics/cookie-utils",
    "@analytics/core": "commonjs2 @analytics/core",
    "@analytics/global-storage-utils":
      "commonjs2 @analytics/global-storage-utils",
    "@analytics/localstorage-utils": "commonjs2 @analytics/localstorage-utils",
    "@analytics/session-storage-utils":
      "commonjs2 @analytics/session-storage-utils",
    "@analytics/type-utils": "commonjs2 @analytics/type-utils",
    "@aws-sdk/client-eventbridge": "commonjs2 @aws-sdk/client-eventbridge",
    "@aws-sdk/credential-providers": "commonjs2 @aws-sdk/credential-providers",
    "@babel/eslint-parser": "commonjs2 @babel/eslint-parser",
    "@babel/preset-env": "commonjs2 @babel/preset-env",
    "@babel/preset-react": "commonjs2 @babel/preset-react",
    "@babel/runtime": "commonjs2 @babel/runtime",
    "@babel/runtime": "commonjs2 @babel/runtime",
    "@babel/types": "commonjs2 @babel/types",
    "@graphql-eslint/eslint-plugin": "commonjs2 @graphql-eslint/eslint-plugin",
    "@graphql-inspector/cli": "commonjs2 @graphql-inspector/cli",
    "@lingui/conf": "commonjs2 @lingui/conf",
    "@lingui/core": "commonjs2 @lingui/core",
    "@lingui/macro": "commonjs2 @lingui/macro",
    "@lingui/react": "commonjs2 @lingui/react",
    "@workspace/cosy-contentful-renderer":
      "commonjs2 @workspace/cosy-contentful-renderer",
    "@workspace/module-pattern-library-button":
      "commonjs2 @workspace/module-pattern-library-button",
    "@workspace/module-pattern-library-drawer":
      "commonjs2 @workspace/module-pattern-library-drawer",
    "@workspace/module-pattern-library-image":
      "commonjs2 @workspace/module-pattern-library-image",
    "@workspace/module-pattern-library-link":
      "commonjs2 @workspace/module-pattern-library-link",
    "@workspace/module-pattern-library-modal":
      "commonjs2 @workspace/module-pattern-library-modal",
    "@workspace/module-pattern-library-utils-hooks":
      "commonjs2 @workspace/module-pattern-library-utils-hooks",
    "@workspace/module-pattern-library":
      "commonjs2 @workspace/module-pattern-library",
    "@workspace/module-pattern-library/es6/components/drawer":
      "commonjs2 @workspace/module-pattern-library/es6/components/drawer",
    "@workspace/module-pattern-library/es6/components/modal":
      "commonjs2 @workspace/module-pattern-library/es6/components/modal",
    "@workspace/module-pattern-library/es6/utils/breakpoints":
      "commonjs2 @workspace/module-pattern-library/es6/utils/breakpoints",
    "@workspace/mwa-ab-testing": "commonjs2 @workspace/mwa-ab-testing",
    "@workspace/mwa-analytics-next": "commonjs2 @workspace/mwa-analytics-next",
    "@workspace/mwa-analytics-shared":
      "commonjs2 @workspace/mwa-analytics-shared",
    "@workspace/mwa-auth-session-manager":
      "commonjs2 @workspace/mwa-auth-session-manager",
    "@workspace/mwa-auth": "commonjs2 @workspace/mwa-auth",
    "@workspace/mwa-launch-darkly": "commonjs2 @workspace/mwa-launch-darkly",
    "@workspace/mwa-logger": "commonjs2 @workspace/mwa-logger",
    "@workspace/mwa-loyalty": "commonjs2 @workspace/mwa-loyalty",
    "@workspace/mwa-profile": "commonjs2 @workspace/mwa-profile",
    "@workspace/mwa-utils": "commonjs2 @workspace/mwa-utils",
    "@okta/okta-auth-js": "commonjs2 @okta/okta-auth-js",
    "@sentry-internal/tracing": "commonjs2 @sentry-internal/tracing",
    "@sentry/browser": "commonjs2 @sentry/browser",
    "@sentry/core": "commonjs2 @sentry/core",
    "@sentry/replay": "commonjs2 @sentry/replay",
    "@sentry/tracing": "commonjs2 @sentry/tracing",
    "@sentry/utils": "commonjs2 @sentry/utils",
    "analytics-utils": "commonjs2 analytics-utils",
    "array-flat-polyfill": "commonjs2 array-flat-polyfill",
    "babel-plugin-dynamic-import-node":
      "commonjs2 babel-plugin-dynamic-import-node",
    "babel-plugin-macros": "commonjs2 babel-plugin-macros",
    "broadcast-channel": "commonjs2 broadcast-channel",
    "cross-fetch": "commonjs2 cross-fetch",
    "css-loader": "commonjs2 css-loader",
    "css-loader": "commonjs2 css-loader",
    "decode-uri-component": "commonjs2 decode-uri-component",
    "detect-node": "commonjs2 detect-node",
    "eslint-config-airbnb": "commonjs2 eslint-config-airbnb",
    "eslint-config-next": "commonjs2 eslint-config-next",
    "eslint-config-prettier": "commonjs2 eslint-config-prettier",
    "eslint-plugin-cypress": "commonjs2 eslint-plugin-cypress",
    "eslint-plugin-import": "commonjs2 eslint-plugin-import",
    "eslint-plugin-jest": "commonjs2 eslint-plugin-jest",
    "eslint-plugin-jsx-a11y": "commonjs2 eslint-plugin-jsx-a11y",
    "eslint-plugin-prettier": "commonjs2 eslint-plugin-prettier",
    "eslint-plugin-react": "commonjs2 eslint-plugin-react",
    "filter-obj": "commonjs2 filter-obj",
    "hoist-non-react-statics": "commonjs2 hoist-non-react-statics",
    "identity-obj-proxy": "commonjs2 identity-obj-proxy",
    "import-fresh": "commonjs2 import-fresh",
    "isomorphic-cookie": "commonjs2 isomorphic-cookie",
    "isomorphic-fetch": "commonjs2 isomorphic-fetch",
    "isomorphic-unfetch": "commonjs2 isomorphic-unfetch",
    "istanbul-lib-coverage": "commonjs2 istanbul-lib-coverage",
    "istanbul-lib-report": "commonjs2 istanbul-lib-report",
    "istanbul-reports": "commonjs2 istanbul-reports",
    "jest-fetch-mock": "commonjs2 jest-fetch-mock",
    "jest-next-dynamic": "commonjs2 jest-next-dynamic",
    "js-cookie": "commonjs2 js-cookie",
    "jsonpath-plus": "commonjs2 jsonpath-plus",
    "jwt-decode": "commonjs2 jwt-decode",
    "lodash-es": "commonjs2 lodash-es",
    "lodash.pick": "commonjs2 lodash.pick",
    "lodash/camelCase": "commonjs2 lodash/camelCase",
    "lodash/cloneDeep": "commonjs2 lodash/cloneDeep",
    "lodash/cloneDeep": "commonjs2 lodash/cloneDeep",
    "lodash/flow": "commonjs2 lodash/flow",
    "lodash/get": "commonjs2 lodash/get",
    "lodash/isEqual": "commonjs2 lodash/isEqual",
    "lodash/merge": "commonjs2 lodash/merge",
    "lodash/set": "commonjs2 lodash/set",
    "lodash/startCase": "commonjs2 lodash/startCase",
    "lodash/zip": "commonjs2 lodash/zip",
    "memoized-node-fetch": "commonjs2 memoized-node-fetch",
    "mini-create-react-context": "commonjs2 mini-create-react-context",
    "next-compose-plugins": "commonjs2 next-compose-plugins",
    "next-router-mock": "commonjs2 next-router-mock",
    "next/dynamic": "commonjs2 next/dynamic",
    "node-fetch": "commonjs2 node-fetch",
    "oblivious-set": "commonjs2 oblivious-set",
    "p-cancelable": "commonjs2 p-cancelable",
    "pino-pretty": "commonjs2 pino-pretty",
    "prop-types": "commonjs2 prop-types",
    "query-string": "commonjs2 query-string",
    "react-dom": "commonjs2 react-dom",
    "react-fast-compare": "commonjs2 react-fast-compare",
    "react-idle-timer": "commonjs2 react-idle-timer",
    "react-is": "commonjs2 react-is",
    "react-select-event": "commonjs2 react-select-event",
    "react-text-mask": "commonjs2 react-text-mask",
    "ric-shim": "commonjs2 ric-shim",
    "split-on-first": "commonjs2 split-on-first",
    "strict-uri-encode": "commonjs2 strict-uri-encode",
    "style-loader": "commonjs2 style-loader",
    "style-loader": "commonjs2 style-loader",
    "stylelint-config-prettier": "commonjs2 stylelint-config-prettier",
    "stylelint-config-recommended": "commonjs2 stylelint-config-recommended",
    "stylelint-config-standard-scss":
      "commonjs2 stylelint-config-standard-scss",
    "stylelint-config-standard": "commonjs2 stylelint-config-standard",
    "stylelint-prettier": "commonjs2 stylelint-prettier",
    "tagged-template-noop": "commonjs2 tagged-template-noop",
    "tiny-emitter": "commonjs2 tiny-emitter",
    "tiny-invariant": "commonjs2 tiny-invariant",
    "tiny-warning": "commonjs2 tiny-warning",
    analytics: "commonjs2 analytics",
    classnames: "commonjs2 classnames",
    concurrently: "commonjs2 concurrently",
    cookie: "commonjs2 cookie",
    crypto: "commonjs2 crypto",
    cypress: "commonjs2 cypress",
    dlv: "commonjs2 dlv",
    doctoc: "commonjs2 doctoc",
    dotenv: "commonjs2 dotenv",
    eslint: "commonjs2 eslint",
    formik: "commonjs2 formik",
    graphql: "commonjs2 graphql",
    jest: "commonjs2 jest",
    lodash: "commonjs2 lodash",
    next: "commonjs2 next",
    nyc: "commonjs2 nyc",
    os: "commonjs2 os",
    postcss: "commonjs2 postcss",
    prettier: "commonjs2 prettier",
    react: "commonjs2 react",
    scheduler: "commonjs2 scheduler",
    path: "commonjs2 path",
    responselike: "commonjs2 responselike",
    stylelint: "commonjs2 stylelint",
    unfetch: "commonjs2 unfetch",
    unload: "commonjs2 unload",
    uuid: "commonjs2 uuid",
  },
};
