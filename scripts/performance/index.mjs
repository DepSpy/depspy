// 使用pnpm run pm调用
import { exec } from "child_process";
import ora from "ora";
import chalk from "chalk";
import fs from "fs";

const COUNT = 30;
const results = []
const {yellow, red} = chalk


async function executePerformance() {
  //检测是否存在（调用目录是否正确）
  if(!fs.existsSync("./scripts/performance/performance.mjs")){
    throw new Error(red("使用 pnpm run pm 调用！！！"))
  }
  const spinner = ora("测算开始").start()
  for (let i = 0; i < COUNT; i++) {
    spinner.start(yellow(`完成度${(i / COUNT * 100).toFixed(2)}%...`))
    const result = await new Promise((resolve,reject) => {
      exec("node ./scripts/performance/performance.mjs",(error, stdout) => {
        if (error) {
          console.log(error);
          resolve(error)
        }
        resolve(Number(stdout))
      });
    })
    typeof result === "number" && results.push(result);
  }
  return spinner;
}
executePerformance().then((spinner) => {
  spinner.succeed(yellow("完成"))
    const success = ((results.length / COUNT) * 100).toFixed(2);
    console.log(`🥳成功率：${success}%`);
    const average =
      results.reduce((sum, curr) => (sum += curr), 0) / results.length;
    console.log(`🚄平均耗时：${average}ms`);
    results.sort();
    const center =
      (results[Math.ceil((results.length - 1) / 2)] +
        results[Math.floor((results.length - 1) / 2)]) /
      2;
    console.log(`🕐中位数：${center}ms`);
  }
)
