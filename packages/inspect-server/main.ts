import { buildService } from "./service";
import { runRpcServer } from "./rpc";

if (require.main === module) {
  const service = buildService()

  runRpcServer(service, {
    input: process.stdin,
    output: process.stdout,
    workerCount: 4,
    workerEntry: __filename,
  })
}
