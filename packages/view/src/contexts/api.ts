import { Node } from "~/types";

const baseUrl = "http://localhost:2023";



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
  const treeLeaves = parseNodeBuffer(reader)

  // console.log(treeLeaves);
  const treeMap = new Map()
  treeLeaves.forEach((node) => {
    treeMap.set(node.path.join('/'), node)
  })

  const treeRoot = treeLeaves[0]
  genarateTree(treeRoot, treeMap)
  console.log(treeRoot);

  return {
    data: treeRoot
  }
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
  const cirDeps = parseNodeBuffer(reader)
  const reader2 = await res2.arrayBuffer();
  const codeps = parseNodeBuffer(reader2)
  console.log(cirDeps.length);
  
  const result = {
    data: {
      codependency: {},
      circularDependency: cirDeps
    }
  }
  for (const dep of codeps) {
    result.data.codependency[dep[0]] = dep[1]
  }
  console.log(result);
  
  return result
}

function stringifyObjToParams(obj: any) {
  return Object.entries(obj)
    .map(([key, value]) => {
      if (typeof value === "object") return `${key}=${JSON.stringify(value)}`;
      return `${key}=${value}`;
    })
    .join("&");
}

export const getNodeByPath = async (query: { name: string,path: string[] }) => {
  const res = await fetch(`${baseUrl}/getNodeByPath?${stringifyObjToParams(query)}`);
  const reader = await res.arrayBuffer();
  const treeLeaves = parseNodeBuffer(reader)
  console.log(treeLeaves, query.name,query.path);
  
  const treeMap = new Map()
  treeLeaves.forEach((node) => {
    treeMap.set(node.path.join('/'), node)
  })

  const treeRoot = treeLeaves[0]
  
  genarateTree(treeRoot, treeMap)
  console.log(treeRoot);
  
  return {
    data: treeRoot
  }

}

function genarateTree(node: Node, treeMap: Map<string, Node>) {

  if (!node) return;
  const deplists = Object.keys(node.dependenciesList || {});
  deplists.forEach(key => {
    if(treeMap.get([...node.path, key].join('/'))) {
      node.dependencies[key] = treeMap.get([...node.path, key].join('/'))
    }
    genarateTree(node.dependencies[key], treeMap);
  })
}

function parseNodeBuffer(buffer) {
  if(!buffer) {
    throw new Error('buffer is empty')
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