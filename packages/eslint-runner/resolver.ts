import { isCore } from "resolve";
import {buildMockModule, ModuleLoader} from "@brex_rules_js/compiler-infra/module-loader";

type ResolveOptions = {
  loader: ModuleLoader,
}

export const interfaceVersion = 2;

export function resolve(modulePath: string, from: string, opts: ResolveOptions) {
  if (isCore(modulePath)) {
    return {
      path: null,
      found: true,
    };
  }

  try {
    const parent = buildMockModule(opts.loader, from);

    return {
      path: opts.loader.resolve(modulePath, parent),
      found: true,
    };
  } catch (e) {
    if (e.code == 'MODULE_NOT_FOUND') {
      return {
        found: false,
      }
    }

    throw e;
  }
}
