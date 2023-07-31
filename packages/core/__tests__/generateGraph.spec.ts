import { describe, expect, test } from "vitest";
import { generateGraph } from "../src";
describe("输入一个模块info和配置,输出该模块完整依赖图", () => {
  test("主函数", async () => {
    expect(await generateGraph("")).toMatchSnapshot();
  });
});
