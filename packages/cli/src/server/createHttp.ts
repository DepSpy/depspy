import { Express } from "express";
import { Graph, Node } from "@dep-spy/core";

export function createHttp(app: Express, graph: Graph) {
  //获取节点信息
  app.get<{ id?: string; depth?: number }, string>("/getNode", (req, res) => {
    const id = req.query.id as string;
    const depth = Number(req.query.depth);
    res.send(graph.getNode(id, depth));
  });
  //搜索
  app.get<{ key: string }, Node[]>("/search", async (req, res) => {
    const key = req.query.key as string;
    const results: Node[] = [];
    const codependency = await graph.getCodependency();
    const nodes = await graph.getCoMap();
    // 先扫描相同依赖
    for (const [id, nodes] of Object.entries(codependency)) {
      if (id.includes(key)) {
        results.push(
          ...nodes.map((node: Node) => ({ ...node, dependencies: {} })),
        );
      }
    }
    // 扫描其他依赖
    for (const [id, node] of Object.entries(nodes)) {
      if (id.includes(key) && !codependency[id]) {
        results.push({ ...node, dependencies: {} });
      }
    }

    res.send(results);
  });
  //获取循环依赖
  app.get("/circularDependency", (_, res) => {
    res.send(graph.getCircularDependency());
  });
  //获取相同依赖
  app.get("/codependency", (res, req) => {
    req.send(graph.getCodependency());
  });
}
