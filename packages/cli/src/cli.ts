import cac from "cac";
import ora from "ora";
import { blue, green, yellow } from "chalk";
import { generateGraph } from "@dep-spy/core";
import { conformConfig } from "./conformConfig";
import { createServer } from "./createServer";
const cli = cac();
cli
  .command("[analysis,ana]", "解析本地项目依赖关系图")
  .option("--graph <graph>", "输出依赖图的文件路径", {
    type: ["string"],
  })
  .option("--co,--codependency <codependency>", "输出相同依赖的文件路径", {
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
          initial: 10,
        }).run(),
      ),
    ];
    // 判断 depth 是否为正整数
    if (!Number.isInteger(options.depth[0]) || options.depth[0] < 0) {
      throw new Error("depth 必须为正整数");
    }

    options.size = [
      await new Confirm({
        name: "size",
        message: "是否计算文件大小?",
        initial: true,
      }).run(),
    ];

    options.ui = [
      await new Confirm({
        name: "ui",
        message: "是否启动可视化界面?",
        initial: true,
      }).run(),
    ];

    options = await conformConfig(options);

    const spinner = ora(blue("🕵️ 正在潜入\n")).start();
    const startTime = Date.now();

    const graph = generateGraph("", options);
    await graph.outputToFile();

    spinner.stop();
    console.log(green(`破解完成,耗时 ${yellow(Date.now() - startTime)} ms`));
    // 如果开启 ui，则启动可视化界面
    if (options.ui) {
      createServer(graph, options);
    }
  });

cli.help();
cli.parse();
