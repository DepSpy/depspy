import path from "path";
import fs from "fs";
import { pathToFileURL } from "url";
import { CONFIG_FILE } from "./constants";
async function getLocalConfig() {
  const resolvePath = path.join(process.cwd(), CONFIG_FILE);
  if (fs.existsSync(resolvePath)) {
    const localConfig = (await import(pathToFileURL(CONFIG_FILE).toString()))
      .default;
    return localConfig;
  } else {
    return {};
  }
}

export async function conformConfig(options) {
  filterDuplicateOptions(options);
  const localConfig = await getLocalConfig();
  return { ...localConfig, ...options };
}

export const filterDuplicateOptions = <T extends object>(options: T) => {
  for (const [key, value] of Object.entries(options)) {
    if (Array.isArray(value)) {
      options[key as keyof T] = value[value.length - 1];
    }
  }
};
