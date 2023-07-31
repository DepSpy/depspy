import { describe, expect, test } from "vitest";
import { filterDuplicateOptions } from "../src/conformConfig";
describe("处理cli输入参数,调用core包输出", () => {
  test("转换cac包的输出", () => {
    const option = { depth: [1], online: [true] };
    filterDuplicateOptions(option);
    expect(option).toEqual({ depth: 1, online: true });
  });
});
