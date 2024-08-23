const fs = require("fs");
const path = require("path");

class RewriteImportsPlugin {
  constructor(options) {
    this.options = options || {};
    this.inputPath = this.options.inputPath || path.join(__dirname, "output"); // Path to the extracted files
    this.outputPath =
      this.options.outputPath || path.join(__dirname, "rewrittenImports"); // Path to the rewritten files
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync(
      "RewriteImportsPlugin",
      (compilation, callback) => {
        // Ensure the extract path exists
        if (!fs.existsSync(this.inputPath)) {
          console.error(`Extract path ${this.inputPath} does not exist.`);
          callback();
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

        callback();
      }
    );
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
        const relativeImportPath = path
          .relative(dir, absoluteImportPath)
          .replace(/\\/g, "/");

        // If the relative path does not start with '.', add './'
        const finalImportPath = relativeImportPath.startsWith(".")
          ? relativeImportPath
          : `./${relativeImportPath}`;

        return `import ${p1} from "${finalImportPath}";`;
      }
    );
  }
}

module.exports = RewriteImportsPlugin;
