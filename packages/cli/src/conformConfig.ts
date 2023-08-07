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

function transformArgs(options: Record<string, unknown[]>) {
  const overrideOptions: Config = {};
  for (const [key, value] of Object.entries(options)) {
    if (Array.isArray(value) && value[value.length - 1]) {
      const overrideValue = value[value.length - 1];
      if (Object.keys(defaultConfig.output).includes(key)) {
        // if (options.output) 永远不满足
        // 原来的写法: overrideOptions.output = { [key]: overrideValue };
        // 每次都会覆盖掉原来的值，导致只有最后一个值生效
        overrideOptions.output = {
          ...overrideOptions.output,
          [key]: overrideValue,
        };
        continue;
      }
      overrideOptions[key] = overrideValue;
    }
  }
  return overrideOptions;
}

export async function conformConfig(options: Record<string, unknown[]>) {
  const argsConfig = transformArgs(options);
  const localConfig = await getLocalConfig();
  return { ...defaultConfig, ...localConfig, ...argsConfig };
}
