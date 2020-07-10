import * as readline from "readline";
import { isMainThread, parentPort } from "worker_threads";
import { StaticPool } from "node-worker-threads-pool";

export type RpcMethod<Request, Response> = {
  request: Request,
  response: Response,
}

export type RpcHandler<M extends RpcMethod<any, any>> = (req: M["request"]) => Promise<M["response"]>

export type RpcDefinition<Methods extends string = any> = {
  [k in Methods]: RpcMethod<any, any>
}

export type RpcService<Def extends RpcDefinition> = {
  [k in keyof Def]: RpcHandler<Def[k]>
}

export type RpcRequest<Def extends RpcDefinition> = {
  id: string,
  request: {
    [k in keyof Def]?: Def[k]["request"]
  },
}

export type RpcResponse<Def extends RpcDefinition> = {
  id: string,
  response: Def[keyof Def]["response"],
} | {
  id: string,
  error: string,
}

export type RpcServerOptions = {
  input: NodeJS.ReadableStream,
  output: NodeJS.WritableStream,
  workerCount: number,
  workerEntry: string,
}

export function runRpcServer<T extends RpcDefinition<Methods>, Methods extends string>(impl: RpcService<T>, opts: RpcServerOptions) {
  if (isMainThread) {
    const pool = new StaticPool({
      size: opts.workerCount,
      task: opts.workerEntry,
    })

    const rl = readline.createInterface({
      input: opts.input,
      terminal: false,
    })

    rl.on('line', async (line) => {
      try {
        const request = JSON.parse(line) as RpcRequest<T>;
        const response = (await pool.exec(request)) as RpcResponse<T>;

        opts.output.write(JSON.stringify(response) + '\n')
      } catch (e) {
        console.error('error handling rpc request', e)
      }
    })
  } else {
    const port = buildRpcPort<T, Methods>(parentPort)

    port.onMessage(async (req, reply) => {
      try {
        const calls = typedKeys(req.request)

        if (calls.length != 1) {
          throw new Error("malformed rpc request")
        }

        const method = calls[0]

        if (!impl[method]) {
          throw new Error("method not implemented")
        }

        const res = await impl[method](req.request[method])

        reply({
          id: req.id,
          response: res,
        })
      } catch (e) {
        reply({
          id: req.id,
          error: e.toString(),
        })
      }
    })
  }
}

function buildRpcPort<T extends RpcDefinition<Methods>, Methods extends string>(port: typeof parentPort) {
  if (!port) {
    throw new Error("no parent port")
  }

  return {
    onMessage(handler: (req: RpcRequest<T>, reply: (res: RpcResponse<T>) => void) => void) {
      port.on('message', (msg: any) => {
        handler(msg as RpcRequest<T>, (res) => {
          port.postMessage(res)
        })
      })
    },
  }
}

function typedKeys<T>(obj: T): Array<keyof T> {
  const keys: Array<keyof T> = []

  for (let key in obj) {
    keys.push(key)
  }

  return keys
}
