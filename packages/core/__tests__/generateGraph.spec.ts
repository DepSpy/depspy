import { describe, expect, test } from "vitest";
import { generateGraph } from "../src";
import path from "path";

// TODO: 循环依赖下的 size，不管开启与否，都会显示，关闭时值为 undefined
describe("生成依赖树", () => {
  test("生成 graph", async () => {
    process.chdir(path.join(__dirname, "npm"));
    const graph = await generateGraph("", {
      depth: 5,
      size: false,
      output: {
        graph: "ds.graph.json",
        circularDependency: "ds.circular.json",
        codependency: "ds.co.json",
      },
      online: false,
    });
    expect(await graph.getGraph()).toMatchInlineSnapshot(`
      GraphNode {
        "dependencies": {
          "pkg-a": GraphNode {
            "declarationVersion": "^1.0.0",
            "dependencies": {
              "pkg-b": GraphNode {
                "cache": "pkg-b1.0.0",
                "declarationVersion": "^1.0.0",
                "dependencies": {
                  "pkg-a": GraphNode {
                    "circlePath": [
                      "test",
                      "pkg-a",
                      "pkg-b",
                      "pkg-a",
                    ],
                    "declarationVersion": "^1.0.0",
                    "dependencies": {},
                    "description": "pkg-a",
                    "name": "pkg-a",
                    "size": undefined,
                    "version": "1.0.0",
                  },
                },
                "description": "pkg-b",
                "name": "pkg-b",
                "version": "1.0.0",
              },
            },
            "description": "pkg-a",
            "name": "pkg-a",
            "version": "1.0.0",
          },
          "pkg-b": GraphNode {
            "cache": "pkg-b1.0.0",
            "declarationVersion": "^1.0.0",
            "dependencies": {
              "pkg-a": GraphNode {
                "circlePath": [
                  "test",
                  "pkg-a",
                  "pkg-b",
                  "pkg-a",
                ],
                "declarationVersion": "^1.0.0",
                "dependencies": {},
                "description": "pkg-a",
                "name": "pkg-a",
                "size": undefined,
                "version": "1.0.0",
              },
            },
            "description": "pkg-b",
            "name": "pkg-b",
            "version": "1.0.0",
          },
          "pkg-c": GraphNode {
            "declarationVersion": "^1.0.0",
            "dependencies": {
              "pkg-a": GraphNode {
                "declarationVersion": "^1.2.3",
                "dependencies": {
                  "pkg-b": GraphNode {
                    "cache": "pkg-b1.0.0",
                    "declarationVersion": "^1.0.0",
                    "dependencies": {
                      "pkg-a": GraphNode {
                        "circlePath": [
                          "test",
                          "pkg-a",
                          "pkg-b",
                          "pkg-a",
                        ],
                        "declarationVersion": "^1.0.0",
                        "dependencies": {},
                        "description": "pkg-a",
                        "name": "pkg-a",
                        "size": undefined,
                        "version": "1.0.0",
                      },
                    },
                    "description": "pkg-b",
                    "name": "pkg-b",
                    "version": "1.0.0",
                  },
                },
                "description": "pkg-a",
                "name": "pkg-a",
                "version": "1.2.3",
              },
            },
            "description": "pkg-c",
            "name": "pkg-c",
            "version": "1.0.0",
          },
        },
        "description": "test",
        "name": "test",
        "version": "1.0.0",
      }
    `);
    expect(await graph.getCircularDependency()).toMatchInlineSnapshot(`
      [
        GraphNode {
          "circlePath": [
            "test",
            "pkg-a",
            "pkg-b",
            "pkg-a",
          ],
          "declarationVersion": "^1.0.0",
          "dependencies": {},
          "description": "pkg-a",
          "name": "pkg-a",
          "size": undefined,
          "version": "1.0.0",
        },
      ]
    `);
    expect(await graph.getCodependency()).toMatchInlineSnapshot(`
      [
        GraphNode {
          "cache": "pkg-b1.0.0",
          "declarationVersion": "^1.0.0",
          "dependencies": {
            "pkg-a": GraphNode {
              "circlePath": [
                "test",
                "pkg-a",
                "pkg-b",
                "pkg-a",
              ],
              "declarationVersion": "^1.0.0",
              "dependencies": {},
              "description": "pkg-a",
              "name": "pkg-a",
              "size": undefined,
              "version": "1.0.0",
            },
          },
          "description": "pkg-b",
          "name": "pkg-b",
          "version": "1.0.0",
        },
      ]
    `);
  });
});
