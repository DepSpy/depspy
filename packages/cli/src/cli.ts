import cac from "cac";
import ora from "ora";
import { blue, green, yellow } from "chalk";
import { generateGraph } from "@dep-spy/core";
import { conformConfig } from "./conformConfig";
import { createServer } from "./server/createServer";
const cli = cac();
cli
  .command("[analysis,ana]", "解析本地项目依赖关系图")
  .option("--graph <graph>", "输出依赖图的文件路径", {
    type: ["string"],
  })
  .option("--co,--codependency <codependency>", "输出相同依赖的文件路径", {
    type: ["string"],
  })
  .option("--entry <entry>", "项目的入口路径", {
    type: ["string"],
  })
  .option(
    "--cir,--circularDependency <circularDependency>",
    "输出循环依赖的文件路径",
    {
      type: ["string"],
    },
  )
  .action(async (_, options) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Confirm, Input } = require("enquirer");

    options.depth = [
      Number(
        await new Input({
          name: "depth",
          message: "请输入依赖图最大深度",
          initial: 3,
        }).run(),
      ),
    ];
    // 判断 depth 是否为正整数
    if (!Number.isInteger(options.depth[0]) || options.depth[0] < 0) {
      throw new Error("depth 必须为正整数");
    }

    options.output = [
      await new Confirm({
        name: "json",
        message: "是否输出依赖树的文件?",
        initial: false,
      }).run(),
    ];

    options = await conformConfig(options);

    const startTime = Date.now();
    const graph = generateGraph("", options);

    const spinner = ora(blue("🕵️ 正在潜入\n")).start();
    //构建树
    await graph.ensureGraph();

    //是否输出依赖树文件
    if (options.output) {
      await graph.outputToFile();
    }

    spinner.stop();

    console.log(green(`破解完成,耗时 ${yellow(Date.now() - startTime)} ms`));

    // 启动可视化界面
    createServer(graph, options);
  });

cli.help();
cli.parse();
