export function lineTag(input: string): string {
  // Split the input string into an array of lines
  const lines = input.split("\n");

  // Map over each line, adding the line number tag
  const taggedLines = lines.map((line, index) => {
    const lineNumber = index + 1;
    return `L${lineNumber}: ${line}`;
  });

  // Join the tagged lines back into a single string
  return taggedLines.join("\n");
}

export function removeLineTag(input: string): string {
  const lines = input.split("\n");
  const untaggedLines = lines.map((line) => {
    // Use a regular expression to match and remove the line tag
    return line.replace(/^L\d+:\s*/, "");
  });
  return untaggedLines.join("\n");
}
