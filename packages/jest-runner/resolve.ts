import * as path from "path";
import { createRequire } from "module";

export function resolve(modulePath: string, config: any) {
  if (/^\.\.?\//.test(modulePath)) {
    modulePath = path.resolve(config.basedir, modulePath);
  }

  return createRequire(config.basedir).resolve(modulePath);
}
