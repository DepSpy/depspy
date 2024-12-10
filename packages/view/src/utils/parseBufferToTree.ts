import { Node } from "~/types.ts";

function getParentKey(key: string) {
  return key.split("!").slice(0, -1).join("!");
}

export function parseNodeBuffer(buffer) {
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
    const node = JSON.parse(nodeJson, (key, value) => {
      if (key === "childrenNumber" && (value === "Infinity" || value === null))
        return Infinity;
      return value;
    });
    nodes.push(node);
  }

  return nodes;
}

export const generateTree = (treeMap: Map<string, Node>) => {
  const roots = [];

  for (const [key, node] of treeMap) {
    if (treeMap.has(getParentKey(key))) {
      const parent = treeMap.get(getParentKey(key));
      const name = node.path[node.path.length - 1];
      parent.dependencies[name] = node;
      node.parent = parent;
    } else {
      roots.push(node);
    }
  }

  return roots;
};
