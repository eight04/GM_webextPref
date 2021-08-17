import readline from "readline";
const rl = readline.createInterface({
  input: process.stdin
});

rl.on("line", line => {
  if (line.includes("@grant")) {
    console.log(line.trim());
  }
});

rl.on("SIGTSTP", () => {
  rl.close();
});
