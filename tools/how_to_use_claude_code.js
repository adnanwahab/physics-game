const proc = Bun.spawn(
  [
    "claude",
    "-p",
    "Summarize the changes in the last five commits",
    "--output-format",
    "json",
  ],
  { stdout: "pipe", stderr: "pipe" },
);

const [output, stderr, exitCode] = await Promise.all([
  new Response(proc.stdout).text(),
  new Response(proc.stderr).text(),
  proc.exited,
]);

if (exitCode !== 0) {
  console.error("Claude Code process failed:", stderr);
  process.exit(1);
}

// --output-format json produces JSONL; find the result line
const resultLine = output
  .trim()
  .split("\n")
  .reverse()
  .find((line) => {
    try {
      return JSON.parse(line).type === "result";
    } catch {
      return false;
    }
  });

if (!resultLine) {
  console.error("No result found in output:", output);
  process.exit(1);
}

const result = JSON.parse(resultLine);

if (result.subtype !== "success") {
  console.error("Claude Code reported an error:", result);
  process.exit(1);
}

console.log(result.result);
