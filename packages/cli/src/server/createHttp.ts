import express, { Express } from "express";
import { Graph, Node } from "@dep-spy/core";
import { compose, toInfinity, jsonsToBuffer, reduceKey } from "@dep-spy/utils";
import {
  bufferHandler,
  errorHandler,
  nodesToBuffer,
  successHandler,
} from "../utils";

export function createHttp(app: Express, graph: Graph) {
  app.use(express.json());

  //获取节点信息
  app.post<{ id?: string; depth?: number; path: string }>(
    "/getNode",
    async (req, res) => {
      try {
        const id = req.body.id as string;
        const depth = Number(req.body.depth);
        const path = req.body.path;
        // root节点
        if (!id && !path) {
          const rootBuffer = await graph.getNode(id, depth);
          bufferHandler(res, nodesToBuffer(rootBuffer));
          return;
        }

        const nodes = await graph.getNode(id, depth, path);

        //没有该节点
        if (!nodes) {
          errorHandler(res, "there is no such node");
          return;
        }

        bufferHandler(res, nodesToBuffer(nodes));
      } catch (error) {
        errorHandler(res, error.toString());
      }
    },
  );
  //搜索
  app.get<{ key: string }>("/searchNode", async (req, res) => {
    try {
      const key = req.query.key as string;
      const results = graph.searchNodes(key);
      bufferHandler(res, nodesToBuffer(results));
    } catch (error) {
      errorHandler(res, error);
    }
  });
  //更新depth
  app.get<{ depth: number }>("/updateDepth", async (req, res) => {
    try {
      const newDepth = req.query.depth as unknown as number;
      await graph.update(Number(newDepth));
      successHandler(res, null);
    } catch (error) {
      errorHandler(res, error);
    }
  });
  // 获取沿路的所有节点
  app.post<{
    pathList: {
      start: string;
      path: string[];
    }[];
  }>("/getNodeByPath", (req, res) => {
    try {
      const pathList = req.body.pathList;
      const results = new Set<Node>();

      // 获取所有路径节点
      pathList.forEach(({ start, path }) => {
        const nodes = graph.getNodeByPath(start, path);
        nodes.forEach((node) => {
          results.add(node);
        });
      });

      bufferHandler(res, nodesToBuffer([...results]));
    } catch (error) {
      errorHandler(res, error);
    }
  });
  // 循环依赖
  app.get("/getCircularDependency", async (req, res) => {
    try {
      const circularDependency = await graph.getCircularDependency();

      const nodeJsons = circularDependency.map((node) => {
        return JSON.stringify(
          node,
          compose([toInfinity, reduceKey], {
            internalKeys: [
              "name",
              "declarationVersion",
              "version",
              "path",
              "circlePath",
            ],
          }),
        );
      });

      const buffer = jsonsToBuffer(nodeJsons);

      bufferHandler(res, buffer);
    } catch (error) {
      errorHandler(res, error);
    }
  });
  //相同依赖
  app.get("/getCodependency", async (req, res) => {
    try {
      const codependency = await graph.getCodependency();

      const nodeJsons = Object.entries(codependency).map((item) => {
        return JSON.stringify(
          item,
          compose([toInfinity, reduceKey], {
            internalKeys: ["name", "declarationVersion", "version", "path"],
          }),
        );
      });
      const buffer = jsonsToBuffer(nodeJsons);

      bufferHandler(res, buffer);
    } catch (error) {
      errorHandler(res, error);
    }
  });
}
