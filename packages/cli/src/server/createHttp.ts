import { Express } from "express";
import { Graph, Node } from "@dep-spy/core";

export function createHttp(app: Express, graph: Graph) {
  //获取节点信息
  app.get<
    { id?: string; depth?: number },
    | string
    | {
        root: Node;
        circularDependency: Node[];
        codependency: Record<string, Node[]>;
      }
  >("/getNode", async (req, res) => {
    const id = req.query.id as string;
    const depth = Number(req.query.depth);
    // root节点
    if (!id) {
      const circularDependency = await graph.getCircularDependency();
      const codependency = await graph.getCodependency();
      const root = JSON.parse(graph.getNode(id, depth));
      return res.send({
        root,
        circularDependency,
        codependency,
      });
      return;
    }
    return res.send(graph.getNode(id, depth));
  });
  //搜索
  app.get<{ key: string }, Node[]>("/searchNode", async (req, res) => {
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

    return res.send(results);
  });
  //更新depth
  app.get<{ depth: number }>("/updateDepth", async (req, res) => {
    const newDepth = req.query.depth as unknown as number;
    await graph.update(Number(newDepth));
    res.send("ok");
  });
}
