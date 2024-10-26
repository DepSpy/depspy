import { Express, Response } from "express";
import { Graph, Node } from "@dep-spy/core";
import { compose, toInfinity, limitDepth, jsonsToBuffer } from "@dep-spy/utils";

export type RES<T> = {
  code: number;
  message: string;
  data: T;
};

function successHandler(res: Response, data: unknown) {
  res.send({
    code: 200,
    message: "success",
    data,
  });
}

function bufferHandler(res: Response, buffer: Buffer) {
  res.set("Content-Type", "application/octet-stream");
  res.send(buffer);
}

function errorHandler(res: Response, data: unknown) {
  console.error(data);
  res.send({
    code: 0,
    message: "fail",
    data,
  });
}

//生产json数组
function generateNodeJsons(nodes: Node[]) {
  const nodeJsons = nodes.map((node) => {
    return JSON.stringify(
      node,
      compose([toInfinity, limitDepth], {
        depth: node.path.length,
      }),
    );
  });
  return nodeJsons;
}

function nodesToBuffer(nodes: Node[]) {
  const nodeJsons = generateNodeJsons(nodes);
  return jsonsToBuffer(nodeJsons);
}

export function createHttp(app: Express, graph: Graph) {
  //获取节点信息
  app.get<
    { id?: string; depth?: number; path: string },
    RES<{
      root: Node;
      circularDependency?: Node[];
      codependency?: Record<string, Node[]>;
    }>
  >("/getNode", async (req, res) => {
    try {
      const id = req.query.id as string;
      const depth = Number(req.query.depth);
      const path = req.query.path
        ? (JSON.parse(req.query.path as string) as string[])
        : undefined;
      // root节点
      if (!id && !path) {
        const rootBuffer = await graph.getNode(id, depth);
        bufferHandler(res, nodesToBuffer(rootBuffer));
        return;
      }

      const buffer = await graph.getNode(id, depth, path);

      //没有该节点
      if (!buffer) {
        errorHandler(res, "there is no such node");
        return;
      }

      bufferHandler(res, nodesToBuffer(buffer));
    } catch (error) {
      errorHandler(res, error.toString());
    }
  });
  //搜索
  app.get<{ key: string }, RES<Node[]>>("/searchNode", async (req, res) => {
    try {
      const key = req.query.key as string;
      const results: Node[] = [];
      const codependency = await graph.getCodependency();
      const nodes = await graph.getCoMap();
      // 先扫描相同依赖
      for (const [id, nodes] of Object.entries(codependency) as [
        id: string,
        nodes: Node[],
      ][]) {
        if (id.includes(key)) {
          results.push(
            ...nodes.map((node: Node) => ({ ...node, dependencies: {} })),
          );
        }
      }
      // 扫描其他依赖
      for (const [id, node] of Object.entries(nodes) as [
        id: string,
        node: Node,
      ][]) {
        if (id.includes(key) && !codependency[id]) {
          results.push({ ...node, dependencies: {} });
        }
      }

      bufferHandler(res, nodesToBuffer(results));
    } catch (error) {
      errorHandler(res, error);
    }
  });
  //更新depth
  app.get<{ depth: number }, RES<null>>("/updateDepth", async (req, res) => {
    try {
      const newDepth = req.query.depth as unknown as number;
      await graph.update(Number(newDepth));
      successHandler(res, null);
    } catch (error) {
      errorHandler(res, error);
    }
  });
  // 获取沿路的所有节点
  app.get<{ name: string; path: string }>("/getNodeByPath", (req, res) => {
    try {
      const path = JSON.parse(req.query.path as string) as string[];
      const name = req.query.name as string;

      const results = graph.getNodeByPath(name, path);

      bufferHandler(res, nodesToBuffer(results));
    } catch (error) {
      errorHandler(res, error);
    }
  });
  // 循环依赖
  app.get("/getCircularDependency", async (req, res) => {
    try {
      const circularDependency = await graph.getCircularDependency();

      const nodeJsons = circularDependency.map((node) => {
        return JSON.stringify(node, compose([toInfinity]));
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
      const nodeJsons = Object.entries(codependency).map(([id, nodes]) => {
        return JSON.stringify(
          [id, nodes.map((node: Node) => ({ ...node, dependencies: {} }))],
          compose([toInfinity]),
        );
      });
      const buffer = jsonsToBuffer(nodeJsons);

      bufferHandler(res, buffer);
    } catch (error) {
      errorHandler(res, error);
    }
  });
}
