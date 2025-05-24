import { Node } from "~/types";
import { FunctionPool, FunctionWorker, parseNodeBuffer } from "@dep-spy/utils";
import { generateTree } from "@/utils/parseBufferToTree.ts";
import { stringifyObjToParams } from "@/utils/stringifyObjToParams.ts";
import { INJECT_MODE } from "../../constant";
import { DEP_SPY_WINDOW_VAR } from "@dep-spy/core";

const baseUrl = "http://localhost:2023";
const staticBaseUrl =
  import.meta.env.MODE === "development" ? "/api" : "http://localhost:2027";

const maxPoolSize = 12;
// 限制全展开时的并发数量
const getNodePool = new FunctionPool(maxPoolSize, (index: number) => {
  async function getNode(query: {
    id?: string;
    depth?: number;
    path?: string[] | string;
  }) {
    return await fetch(`${baseUrl}/getNode`, {
      method: "POST",
      body: JSON.stringify(query),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
  return new FunctionWorker({ fn: getNode, key: String(index) });
});

export const getNode = async (query: {
  id?: string;
  depth?: number;
  path?: string[];
}) => {
  const [res, error] = await getNodePool.addTask(query);

  if (error) {
    return {
      data: null,
    };
  }

  // 读取readableStream
  const reader = await res.arrayBuffer();
  const treeLeaves = parseNodeBuffer(reader);

  const treeMap = new Map();
  treeLeaves.forEach((node) => {
    treeMap.set(node.path.join("!"), node);
  });

  const [root] = generateTree(treeMap);
  return {
    data: root,
  };
};

export const searchNode = async (query: { key?: string }) => {
  const res = await fetch(
    `${baseUrl}/searchNode?${stringifyObjToParams(query)}`,
  );
  const reader = await res.arrayBuffer();
  const treeLeaves = parseNodeBuffer(reader);
  return treeLeaves;
};

export const updateDepth = async (query: { depth: number }) => {
  const res = await fetch(
    `${baseUrl}/updateDepth?${stringifyObjToParams(query)}`,
  );
  return res;
};

export const getDependency = async () => {
  const res = await fetch(`${baseUrl}/getCircularDependency`);
  const res2 = await fetch(`${baseUrl}/getCodependency`);
  const reader = await res.arrayBuffer();
  const cirDeps = parseNodeBuffer(reader);
  const reader2 = await res2.arrayBuffer();
  const coDeps = parseNodeBuffer(reader2);

  const result = {
    data: {
      codependency: {},
      circularDependency: cirDeps,
    },
  };
  for (const dep of coDeps) {
    result.data.codependency[dep[0]] = dep[1];
  }

  return result;
};

export const getNodeByPath = async (query: {
  pathList: {
    name: string;
    path: string[];
  }[];
}): Promise<{ data: Node[] }> => {
  const res = await fetch(`${baseUrl}/getNodeByPath`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(query),
  });
  const reader = await res.arrayBuffer();
  const treeLeaves = parseNodeBuffer(reader);

  const treeMap = new Map();
  treeLeaves.forEach((node) => {
    treeMap.set(node.path.join("!"), node);
  });

  const treeRoot = generateTree(treeMap);

  return {
    data: treeRoot as Node[],
  };
};

export const getStaticGraph = async () => {
  if (import.meta.env.MODE === INJECT_MODE) {
    return window[DEP_SPY_WINDOW_VAR];
  }
  const res = await fetch(`${staticBaseUrl}/getStaticTree`, {
    method: "GET",
  });
  const reader = await res.arrayBuffer();
  const treeLeaves = parseNodeBuffer(reader);
  return treeLeaves;
};
