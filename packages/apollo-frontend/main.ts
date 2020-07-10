import * as fs from 'fs';
import * as path from 'path';
import * as worker from '@bazel/worker';
import { URI } from "vscode-uri";
import { Kind, DocumentNode } from "graphql";
import { GraphQLClientProject, ClientConfig, DefaultClientConfig, DefaultEngineConfig } from "apollo-language-server";
import {
  compileToIR,
} from "apollo-codegen-core/lib/compiler";
import {
  generateLocalSource,
  generateGlobalSource,
} from "apollo-codegen-typescript";
import { parseCli, buildConfig } from './config';

async function runOneBuild(args: string[], manifest?: any) {
  const cli = parseCli(args);
  const config = buildConfig(cli);

  const userConfig = require(config.config);

  const rawConfig = {
    client: Object.assign({}, DefaultClientConfig, userConfig.client),
    engine: Object.assign({}, DefaultEngineConfig, userConfig.engine),
  };
 
  rawConfig.client.includes = config.inputFiles;
  rawConfig.client.excludes = [];
  rawConfig.client.service = Object.assign({}, rawConfig.client.service, {
    localSchemaFile: config.schema,
  });

  const apolloConfig = new ClientConfig(rawConfig, URI.file(path.join(config.root, 'fake')));

  const project = new GraphQLClientProject({
    loadingHandler: {
      handle<T>(message: string, value: Promise<T>): Promise<T> {
        console.error(message);
        return value
      },

      handleSync<T>(message: string, value: () => T): T {
        console.error(message);
        return value()
      },

      showError(message: string): void {
        console.error(message)
      },
    },

    rootURI: null,

    config: apolloConfig,
  });

  await project.scanAllIncludedFiles();

  if (!project.schema) {
    throw new Error('missing schema')
  }

  await project.validate();

  if (config.global) {
    const operations = Object.values(project.operations);
    const fragments = Object.values(project.fragments);
    const document: DocumentNode = {
      kind: Kind.DOCUMENT,
      definitions: [...operations, ...fragments]
    };

    const context = compileToIR(project.schema, document)
    const globalFile = generateGlobalSource(context);

    fs.writeFileSync(path.join(config.output, 'globalTypes.ts'), globalFile.fileContents, 'utf-8');
  }

  if (config.inputFiles.length > 0) {
    const operations = Object.values(project.operations);
    const fragments = Object.values(project.fragments);
    const document: DocumentNode = {
      kind: Kind.DOCUMENT,
      definitions: [...operations, ...fragments]
    };

    const context = compileToIR(project.schema, document)
    const generatedFiles = generateLocalSource(context);

    for (let file of generatedFiles) {
      const generated = file.content({
        outputPath: '.',
        globalSourcePath: '__GLOBAL_TYPES__/globalTypes',
      })
      
      const contents = generated.fileContents.replace('./__GLOBAL_TYPES__', config.globalTypesPackage)

      fs.writeFileSync(path.join(config.output, file.fileName), contents, 'utf-8');
    }
  }

  return true;
}

if (require.main === module) {
  const run = async (args: string[], manifest?: any) => {
    try {
      return runOneBuild(args, manifest);
    } catch (e) {
      console.error('Error:', e)
      return false;
    }
  };

  if (worker.runAsWorker(process.argv)) {
    // Patch console.log, just to make sure
    console.log = console.error;

    worker.log('Running as a Bazel worker');

    worker.runWorkerLoop(run);
  } else {
    runOneBuild(process.argv.slice(2))
      .then((ok) => {
        if (ok) {
          process.exit(0);
        } else {
          process.exit(1);
        }
      })
      .catch((e) => {
        console.log(e);
        process.exit(1);
      })
  }
}

