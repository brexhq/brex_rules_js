import * as babel from "@babel/core";
import { Config } from "../config";

// Just so babel gets our dependencies
import "@babel/preset-env";
import "@babel/preset-typescript";
import "@babel/plugin-transform-typescript";
import "@babel/plugin-proposal-decorators";
import "@babel/plugin-proposal-class-properties";
import "@babel/plugin-proposal-optional-chaining";
import "@babel/plugin-proposal-object-rest-spread";
import "@babel/plugin-proposal-nullish-coalescing-operator";
import "babel-plugin-transform-typescript-metadata";

export type BabelConfig = {
    options: babel.TransformOptions,
}

export function buildBabelConfig(config: Config, filename: string): BabelConfig {
    const userOptions = loadUserOptions(config);

    const allOptions: babel.TransformOptions[] = [
        {
            presets: [
                ["@babel/preset-env", {
                    targets: { node: true }
                }],
            ],
        },
        {
            test: /\.tsx?$/,
            presets: [
                ["@babel/preset-typescript"],
            ],
            plugins: [
                ["babel-plugin-transform-typescript-metadata"],
                ["@babel/plugin-proposal-decorators", {
                    legacy: true,
                }],
                ["@babel/plugin-proposal-class-properties", {
                    loose: true,
                }],
                ["@babel/plugin-proposal-optional-chaining"],
                ["@babel/plugin-proposal-object-rest-spread"],
                ["@babel/plugin-proposal-nullish-coalescing-operator"],
                ["@babel/plugin-proposal-numeric-separator"],
            ],
        },
        {
            plugins: userOptions.plugins,
            presets: userOptions.presets,
        },
    ];

    preprocessConfigs(config, allOptions)

    const options = babel.loadOptions({
        root: config.root,
        sourceMaps: 'inline',
        filename: filename,
        overrides: allOptions,
    });

    if (!options) {
        throw new Error("failed to load babel config")
    }

    return { options };
};

function loadUserOptions(config: Config): babel.TransformOptions {
    if (!config.babelConfig) {
        return {}
    }

    return require(config.babelConfig);
}

function preprocessConfigs(config: Config, options: babel.TransformOptions[]) {
    options.forEach(o => preprocessConfig(config, o))
}

function preprocessConfig(config: Config, options: babel.TransformOptions) {
    options.plugins = (options.plugins || []).map(p => {
        return babel.createConfigItem(p, {
            dirname: config.nodeModulesPrefix,
            type: 'plugin',
        })
    })

    options.presets = (options.presets || []).map(p => {
        return babel.createConfigItem(p, {
            dirname: config.nodeModulesPrefix,
            type: 'preset',
        })
    })

    preprocessConfigs(config, options.overrides || [])
}
