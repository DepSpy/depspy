import { exec } from "child_process";
import chokidar from "chokidar";
import path from "path";
import fs from "fs";

const root = process.cwd();

const config = JSON.parse(
  fs.readFileSync(path.resolve(root, "depspy.script.json"), "utf8"),
);
const commands = Object.entries(config);

const watcher = chokidar.watch(path.resolve(root, "packages"), {
  ignored: ["**/node_modules/**", "**/dist/**"],
});
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
          }
        });
      });
    }
  });
});
commands.forEach(([packageName, commands]) => {
  const packagePath = path.resolve(root, "packages", packageName);
  commands.forEach((command) => {
    exec(command, { cwd: packagePath }, (err, stdout) => {
      if (err) {
        console.error(`${packageName} failed:`, err);
      } else {
        console.log(`${packageName} succeeded:`, stdout);
      }
    });
  });
});
