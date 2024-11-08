import { Node } from "~/types";

const baseUrl = "http://localhost:2023";

function getChildKey(node: Node, key: string) {
  return [...node.path, key].join("!");
}
// function getKey(node: Node) {
//   return node.path.join("!");
// }
function getParentkey(key: string) {
  return key.split("!").slice(0, -1).join("!");
}

const genarateFnByRoot = (node: Node, treeMap: Map<string, Node>) => {
  if (!node) return;
  const deplists = Object.keys(node.dependenciesList || {});
  deplists.forEach((key) => {
    if (treeMap.has(getChildKey(node, key))) {
      node.dependencies[key] = treeMap.get(getChildKey(node, key));
      node.dependencies[key].parent = node;
    }
    genarateFnByRoot(node.dependencies[key], treeMap);
  });
};

const genarateFnByUnion = (node: Node, treeMap: Map<string, Node>) => {
  const roots = [];

  for (const [key, value] of treeMap) {
    if (treeMap.has(getParentkey(key))) {
      const parent = treeMap.get(getParentkey(key));
      Object.keys(parent.dependenciesList).forEach((k) => {
        if (treeMap.has(getChildKey(parent, k))) {
          parent.dependencies[k] = treeMap.get(getChildKey(parent, k));
          parent.dependencies[k].parent = parent;
        }
      });
    } else {
      roots.push(value);
    }
  }

  return roots;
};

const GENARATE_FN = {
  BYROOT: genarateFnByRoot,
  BYUNION: genarateFnByUnion,
};

export const getNode = async (query: {
  id?: string;
  depth?: number;
  path?: string[] | string;
}) => {
  const res = await fetch(
    `${baseUrl}/getNode?${stringifyObjToParams({ ...query })}`,
  );
  // 读取readableStream
  const reader = await res.arrayBuffer();
  const treeLeaves = parseNodeBuffer(reader);

  // console.log(treeLeaves);
  const treeMap = new Map();
  treeLeaves.forEach((node) => {
    treeMap.set(node.path.join("!"), node);
  });

  const treeRoot = treeLeaves[0];
  genarateTree(GENARATE_FN.BYROOT, treeRoot, treeMap);

  return {
    data: treeRoot,
  };
};

export const searchNode = async (query: { key?: string }) => {
  const res = await fetch(
    `${baseUrl}/searchNode?${stringifyObjToParams(query)}`,
  );
  return res.json();
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
  const codeps = parseNodeBuffer(reader2);

  const result = {
    data: {
      codependency: {},
      circularDependency: cirDeps,
    },
  };
  for (const dep of codeps) {
    result.data.codependency[dep[0]] = dep[1];
  }

  return result;
};

function stringifyObjToParams(obj) {
  return Object.entries(obj)
    .map(([key, value]) => {
      if (typeof value === "object") return `${key}=${JSON.stringify(value)}`;
      return `${key}=${value}`;
    })
    .join("&");
}

export const getNodeByPath = async (query: {
  pathList: {
    name: string;
    path: string[];
  }[];
}) => {
  const res = await fetch(
    `${baseUrl}/getNodeByPath?${stringifyObjToParams(query)}`,
  );
  const reader = await res.arrayBuffer();
  const treeLeaves = parseNodeBuffer(reader);

  const treeMap = new Map();
  treeLeaves.forEach((node) => {
    treeMap.set(node.path.join("!"), node);
  });
  console.log(treeMap, "treeMap");

  const treeRoot = genarateTree(GENARATE_FN.BYUNION, null, treeMap);
  console.log(treeRoot, "asfasf");

  return {
    data: treeRoot,
  };
};

function genarateTree(
  fn: (node: Node, treeMap: Map<string, Node>) => void,
  node: Node,
  treeMap: Map<string, Node>,
) {
  return fn(node, treeMap);
}

function parseNodeBuffer(buffer) {
  if (!buffer) {
    throw new Error("buffer is empty");
  }
  const nodes = [];
  let offset = 0;

  while (offset < buffer.byteLength) {
    // 读取数据块的大小（前4个字节）
    const sizeView = new DataView(buffer, offset, 4);
    const nodeSize = sizeView.getInt32(0, true); // Little Endian
    offset += 4;

    // 读取实际的数据
    const nodeBuffer = new Uint8Array(buffer, offset, nodeSize);
    offset += nodeSize;

    // 将数据转换为字符串并解析为对象
    const nodeJson = new TextDecoder().decode(nodeBuffer);
    const node = JSON.parse(nodeJson);
    nodes.push(node);
  }

  return nodes;
}
