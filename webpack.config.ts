import type webpack from "webpack";
import { RunAt, UserscriptPlugin } from "webpack-userscript";
import { readFile } from "node:fs/promises";
const { version } = JSON.parse(await readFile(new URL("package.json", import.meta.url), "utf8")) as { version: string; };

const mode: "none" | "development" | "production" = "production" as never;
export default {
    mode,
    devtool: mode === "development" ? "inline-source-map" : false,
    entry:   new URL("src/index.ts", import.meta.url).pathname,
    output:  {
        path:     new URL("dist", import.meta.url).pathname,
        filename: "script.js"
    },
    plugins: [
        new UserscriptPlugin({
            headers: {
                "name":        "E621 Pool Tag Search",
                "description": "A way to search pools by tags.",
                version,
                "license":     "MIT",
                "supportURL":  "https://github.com/DonovanDMC/E621PoolTagSearch/issues",
                "match":       [
                    "https://e621.net/pools*",
                    "https://e926.net/pools*"
                ],
                "run-at":  RunAt.DocumentBody,
                "connect": [
                    "pools.e621.ws",
                    "websites4.containers.local"
                ],
                "grant": [
                    "GM.xmlHttpRequest",
                    "GM.getValue",
                    "GM.setValue"
                ],
                "icon":        "https://www.google.com/s2/favicons?sz=64&domain=e621.net",
                "updateURL":   "https://github.com/DonovanDMC/E621PoolTagSearch/releases/latest/download/script.meta.js",
                "downloadURL": "https://github.com/DonovanDMC/E621PoolTagSearch/releases/latest/download/script.user.js"
            }
        })
    ],
    module: {
        rules: [
            {
                test: /\.m?ts/,
                use:  [
                    {
                        loader:  "ts-loader",
                        options: {
                            transpileOnly: true
                        }
                    }
                ],
                exclude: /node_modules/
            }
        ]
    },
    watch:       mode === "development",
    experiments: {
        topLevelAwait: true
    }
} satisfies webpack.Configuration;
