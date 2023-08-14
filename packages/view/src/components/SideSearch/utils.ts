import { Node } from "~/types";

export const searchNode = (root: Node, target: string) => {
  const queue = [root];
  while (queue.length > 0) {
    const currentNode = queue.shift();
    if (currentNode.name === target) {
      return currentNode;
    }
    const deps = Object.entries(currentNode.dependencies).map((v) => v[1]);
    queue.push(...deps);
  }

  return null;
};
