import { Node } from "~/types";
export const searchNode = (root: Node, target: string) => {
  const queue = [root];
  const res = [];
  while (queue.length > 0) {
    const currentNode = queue.shift();
    if (currentNode.name.includes(target)) {
      res.push(currentNode);
    }
    const deps = Object.entries(currentNode.dependencies).map((v) => v[1]);
    queue.push(...deps);
  }

  if (res.length <= 10) return res;
  else {
    for (let i = res.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [res[i], res[j]] = [res[j], res[i]]; // Swap elements
    }
    return res.slice(0, 10);
  }
};
