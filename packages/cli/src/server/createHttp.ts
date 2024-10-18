import { Express, Response } from "express";
import { Graph, Node } from "@dep-spy/core";

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
        console.log(rootBuffer.slice(4 + 1091, 8+1091));
        
        bufferHandler(res, rootBuffer);
        return;
      }

      const buffer = await graph.getNode(id, depth, path);

      //没有该节点
      if (!buffer) {
        errorHandler(res, "there is no such node");
        return;
      }

      bufferHandler(res, buffer);
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
        node: Node[],
      ][]) {
        if (id.includes(key) && !codependency[id]) {
          results.push({ ...node, dependencies: {} });
        }
      }

      successHandler(res, results);
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

  app.get<{ key: string }>("/getNodeByPath", (req, res) => {
    try {
      const path = JSON.parse(req.query.path as string) as string[];
      bufferHandler(res, graph.getNodeByPath(path));
    } catch (error) {
      errorHandler(res, error);
    }
  });

  app.get("/getDependency", async (req, res) => {
    try {
      const circularDependency = await graph.getCircularDependency();
      const codependency = await graph.getCodependency();

      successHandler(res, {
        circularDependency,
        codependency,
      });
    } catch (error) {
      errorHandler(res, error);
    }
  });
}
