import { execSync, exec } from "child_process";
import chokidar from "chokidar";
import ora from "ora";
import path from "path";
import fs from "fs";
import chalk from "chalk";

const root = process.cwd();
const { green, yellow } = chalk;

const config = JSON.parse(
  fs.readFileSync(path.resolve(root, "depspy.script.json"), "utf8"),
);
const commands = Object.entries(config);

const watcher = chokidar.watch(path.resolve(root, "packages"), {
  ignored: ["**/node_modules/**", "**/dist/**"],
});

const spinner = ora(yellow("开始构建...\n")).start();

watcher.addListener("change", (changePath) => {
  commands.forEach(([packageName, commands]) => {
    const packagePath = path.resolve(root, "packages", packageName);
    if (changePath.includes(packagePath)) {
      commands.forEach((command) => {
        exec(command, { cwd: packagePath }, (err, stdout) => {
          if (err) {
            console.error(`${packageName} failed:`, err);
          } else {
            console.log(`${packageName} succeeded:`, stdout);
            console.log(green(`${packageName}包变动，已重新构建`));
          }
        });
      });
    }
  });
});

commands.forEach(([packageName, commands]) => {
  const packagePath = path.resolve(root, "packages", packageName);
  commands.forEach((command) => {
    execSync(command, { cwd: packagePath });
  });
});

spinner.succeed(green("构建成功，监听中..."));
