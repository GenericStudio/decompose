const fs = require("fs");
const path = require("path");

class RewriteImports {
  constructor(options) {
    this.options = options || {};
    this.inputPath = this.options.inputPath || path.join(__dirname, "output"); // Path to the extracted files
    this.outputPath = this.options.outputPath || path.join(__dirname, "rewrittenImports"); // Path to the rewritten files
    this.depth = this.options.depth || 1; // Depth parameter for controlling relative paths
  }

  // Entry point to start the rewriting process
  run() {
    // Ensure the extract path exists
    if (!fs.existsSync(this.inputPath)) {
      console.error(`Extract path ${this.inputPath} does not exist.`);
      return;
    }

    // Ensure the output directory exists
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }

    // Get all the files in the extracted directory
    const files = this.getFilesRecursively(this.inputPath);

    files.forEach((file) => {
      // Read the file content
      let content = fs.readFileSync(file, "utf8");

      // Rewrite the @workspace/module-* imports
      content = this.rewriteImports(content, file);

      // Determine the corresponding output path
      const relativePath = path.relative(this.inputPath, file);
      const outputFilePath = path.join(this.outputPath, relativePath);

      // Ensure the necessary directory structure exists in the output path
      fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });

      // Write the modified content to the new output file
      fs.writeFileSync(outputFilePath, content);
    });

    console.log("Import rewriting complete.");
  }

  // Helper function to recursively get all files in a directory
  getFilesRecursively(directory) {
    let files = [];

    fs.readdirSync(directory).forEach((file) => {
      const fullPath = path.join(directory, file);

      if (fs.statSync(fullPath).isDirectory()) {
        files = files.concat(this.getFilesRecursively(fullPath));
      } else {
        files.push(fullPath);
      }
    });

    return files;
  }

  // Function to rewrite @workspace/module-* imports to relative paths
rewriteImports(content, filePath) {
  const dir = path.dirname(filePath);

  // Calculate how deeply nested the file is
  const fileDepth = dir.split(path.sep).length;
  const baseDepth = this.inputPath.split(path.sep).length;

  return content.replace(
    /import\s+([\s\S]+?)\s+from\s+['"](@workspace\/module-(?!pattern-library)[^'"]+)['"]\s*;?/g,
    (match, p1, importPath) => {
      const cleanedImportPath = importPath.replace(
        "@workspace/module-",
        "module-"
      );

      // Calculate the absolute path to the target file
      const absoluteImportPath = path.join(this.inputPath, cleanedImportPath);

      // Get the relative path from the current file to the import target
      let relativeImportPath = path.relative(dir, absoluteImportPath);

      // Adjust the depth of the relative path based on how nested the file is
      const relativeDepth = Math.max(fileDepth - baseDepth + this.depth, 0);
      const pathSegments = relativeImportPath.split(path.sep);

      // Adjust the path segments based on the calculated relative depth
      if (relativeDepth > 0 && pathSegments.length > relativeDepth) {
        relativeImportPath = pathSegments.slice(-relativeDepth).join("/");
      }

      // Normalize the path and replace backslashes with forward slashes
      relativeImportPath = path.normalize(relativeImportPath).replace(/\\/g, "/");

      // If the relative path does not start with '.', add './'
      const finalImportPath = relativeImportPath.startsWith(".")
        ? relativeImportPath
        : `./${relativeImportPath}`;

      return `import ${p1} from "${finalImportPath}";`;
    }
  );
}
}

// Usage example
const options = {
  inputPath: "/Users/ecatlin/personal/extractor/output/Step1", // Set your input path here
  outputPath: "/Users/ecatlin/personal/extractor/output/Step2", // Set your output path here
  depth: 3// Set the desired depth here
};

const rewriter = new RewriteImports(options);
rewriter.run();
