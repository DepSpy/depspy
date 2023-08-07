import { describe, expect, test } from "vitest";
import { conformConfig } from "../src/conformConfig";
import path from "path";
import { CONFIG_FILE, defaultConfig } from "../src/constants";
import { pathToFileURL } from "url";
describe("处理 cli 输入参数,调用 core 包输出", () => {
  test("默认情况", async () => {
    const option = { "--": [] };
    const finalOption = await conformConfig(option);
    expect(finalOption).toMatchInlineSnapshot(`
      {
        "depth": 3,
        "online": false,
        "output": {
          "circularDependency": "ds.circular.json",
          "codependency": "ds.co.json",
          "graph": "ds.graph.json",
        },
        "size": false,
      }
    `);
  });
  test("指定参数", async () => {
    const option = {
      "--": [],
      depth: [2],
      size: [true],
      online: [true],
      circularDependency: ["circular.json"],
      codependency: ["codependency.json"],
      graph: ["graph.json"],
    };
    const finalOption = await conformConfig(option);
    expect(finalOption).toMatchInlineSnapshot(`
      {
        "depth": 2,
        "online": true,
        "output": {
          "circularDependency": "circular.json",
          "codependency": "codependency.json",
          "graph": "graph.json",
        },
        "size": true,
      }
    `);
  });
  test("读取配置文件", async () => {
    const localConfig = (
      await import(
        pathToFileURL(path.join("__tests__", CONFIG_FILE)).toString()
      )
    ).default;
    expect({
      ...defaultConfig,
      ...localConfig,
      output: {
        ...defaultConfig.output,
        ...localConfig.output,
      },
    }).toMatchInlineSnapshot(`
      {
        "depth": 100,
        "online": false,
        "output": {
          "circularDependency": "circular.json",
          "codependency": "ds.co.json",
          "graph": "graph.json",
        },
        "size": true,
      }
    `);
  });
});
