import { generateGraph } from "../../packages/core/dist/index.js";
async function performance() {
    const start = Date.now();
    const graph = generateGraph("", {
      depth: 20,
    });
    await graph.getGraph(); //生成图
    const end = Date.now();
    console.log(end - start);
}

performance().then(() => {
    process.exit(0)
})




