import yargs from "yargs";

export type Options = {
  [k: string]: yargs.Options;
};

export function parseArgs<T>(options: Options, argv: string[]): T {
  return (yargs
    .parserConfiguration(({
      "camel-case-expansion": true,
      "greedy-arrays": false,
      "populate--": true,
      "strip-dashed": true,
    } as unknown) as yargs.ParserConfigurationOptions)
    .exitProcess(false)
    .options(options)
    .parse(argv) as unknown) as T;
}
