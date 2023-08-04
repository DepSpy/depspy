import path from "path";
import fs from "fs";
import { pathToFileURL } from "url";
import { CONFIG_FILE, defaultConfig, Config } from "./constants";
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
  const argsConfig = transformArgs(options);
  const localConfig = await getLocalConfig();
  return { ...defaultConfig, ...localConfig, ...argsConfig };
}

function transformArgs(options: Record<string, unknown[]>) {
  const overrideOptions: Config = {};
  for (const [key, value] of Object.entries(options)) {
    if (Array.isArray(value) && value[value.length - 1]) {
      const overrideValue = value[value.length - 1];
      if (Object.keys(defaultConfig.output).includes(key)) {
        if (options.output) {
          options.output[key] = overrideValue;
        } else {
          overrideOptions.output = { [key]: overrideValue };
        }
        continue;
      }
      overrideOptions[key] = overrideValue;
    }
  }
  return overrideOptions;
}
