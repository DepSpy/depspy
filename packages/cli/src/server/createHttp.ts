import { Express } from "express";
import { Graph } from "@dep-spy/core";

export function createHttp(app: Express, graph: Graph) {
  app.get<{ id?: string; depth: number }, string>(
    "/getNode",
    async (req, res) => {
      const id = String(req.query.id);
      const depth = Number(req.query.depth);
      res.send(graph.getNode(id, depth));
    },
  );
}
