import * as path from "path";

export function replaceExtension(file: string, ext: string) {
  return file.slice(0, -path.extname(file).length) + ext;
}
