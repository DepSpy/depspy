import { Express } from "express";
import { Graph, Node } from "@dep-spy/core";

interface Response<T> {
  code: number;
  data: T;
  msg: string;
}

export function createHttp(app: Express, graph: Graph) {
  app.get<{ id?: string; depth: number }, Response<Node>>(
    "/getNode",
    async (req, res) => {
      const id = req.query.id;
      const depth = Number(req.query.depth);
      res.send(graph.getNode(id, depth));
    },
  );
}
