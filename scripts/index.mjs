import { exec } from "child_process";
import path from "path";
import fs from "fs";

const root = process.cwd();

const config = JSON.parse(
  fs.readFileSync(path.resolve(root, "depspy.script.json"), "utf8"),
);
const env = process.argv[2];
const commands = Object.entries(config[env]);

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
