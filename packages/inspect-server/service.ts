import * as fs from 'fs';
import { RpcMethod, RpcService } from "./rpc";
import inspectCode from "./code";
import * as lockfile from "@yarnpkg/lockfile";

type InspectCodeRequest = {
  filename: string,
}

type InspectCodeResponse = {
  imports: string[],
}

type InspectYarnRequest = {
  filename: string,
}

type InspectYarnResponse = {
  deps: any,
}

export type InspectService = {
  code: RpcMethod<InspectCodeRequest, InspectCodeResponse>,
  yarn: RpcMethod<InspectYarnRequest, InspectYarnResponse>,
}

export function buildService(): RpcService<InspectService> {
  return {
    async code(req) {
      return inspectCode(req.filename)
    },

    async yarn(req) {
      const file = fs.readFileSync(req.filename, 'utf8');
      const lock = lockfile.parse(file, req.filename);
      const deps: any = {}

      if (lock.type != 'success') {
        throw new Error('error parsing lock file')
      }

      for (let key of Object.keys(lock.object)) {
        const d = lock.object[key];
        const parts = key.split("@")
        let packageName = parts[0]

        if (!packageName) {
          // Scoped packages
          packageName = `@${parts[1]}`
        }

        deps[packageName] = {
          version: d.version,
          resolved: d.resolved,
          integrity: d.integrity,
        }
      }

      return {
        deps,
      }
    },
  }
}
