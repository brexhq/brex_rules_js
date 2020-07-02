import * as path from 'path';
import * as fs from 'fs';
import * as utils from 'util';

const logStream = fs.createWriteStream('/tmp/buildlog', {
  flags: 'a',
})

export function trace(fmt, ...args: unknown[]) {
  logStream.write(utils.format(fmt + '\n', ...args))
}

export function traceTime(name: string) {
  trace('TRACE %s %d', name, new Date().getTime())
}

export function timeFunction<T>(name: string, fn: () => T): T {
  const start = new Date().getTime();
  const result = fn();
  const end = new Date().getTime();

  trace('TIME %s %dms', name, end - start)

  return result;
}

export async function timeAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = new Date().getTime();
  const result = await fn();
  const end = new Date().getTime();

  trace('TIME %s %dms', name, end - start)

  return result;
}

export function replaceExtension(file: string, ext: string) {
  return file.slice(0, -path.extname(file).length) + ext
}
