const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;
const t = require("@babel/types");

// Helper function to parse a file into an AST
function parseFile(filePath) {
  const code = fs.readFileSync(filePath, "utf8");
  return {
    code,
    ast: parser.parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    }),
  };
}

// Helper function to check if the file matches the given extensions
function matchesFileExtension(
  filePath,
  extensions = [".js", ".jsx", ".ts", ".tsx"]
) {
  const regex = new RegExp(`(${extensions.join("|").replace(/\./g, "\\.")})$`);
  return regex.test(filePath);
}

// Helper function to find the file with a wildcard match
function findFileWithExtension(
  resolvedPath,
  extensions = [".js", ".jsx", ".ts", ".tsx"]
) {
  for (const ext of extensions) {
    const fullPath = `${resolvedPath}${ext}`;
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

// Recursive function to find the terminal file and export type
// Recursive function to find the terminal file and export type
function findTerminalFileAndExport(importPath, directory, importedName, context) {
    // Resolve the file path
    context.currentPath = path.resolve(directory, importPath);
    context.importPath = importPath;
  
    // Attempt to resolve the file with possible extensions
    let resolvedFile = findFileWithExtension(context.currentPath);
    if (!resolvedFile && fs.existsSync(context.currentPath) && fs.lstatSync(context.currentPath).isDirectory()) {
      // If it's a directory, look for an index file with an extension
      resolvedFile = findFileWithExtension(path.join(context.currentPath, "index"));
    }
  
    // If we still don't have a resolved file, give up
    if (!resolvedFile) {
      console.warn(`[DeIndexPlugin] Warning: File or directory not found: ${context.currentPath}`);
      return null;
    }
  
    // Set the resolved file path and capture the extension
    context.currentPath = resolvedFile;
    context.fileExtension = path.extname(resolvedFile); // Capture the file extension
    console.log("Found file", { context });
  
    // At this point, the file has been resolved, and we can check the extension
    if (!matchesFileExtension(resolvedFile)) {
      console.warn(`[DeIndexPlugin] Skipping non-JS file: ${resolvedFile}`);
      return null;
    }
  
    // Parse the resolved file
    const { ast } = parseFile(context.currentPath);
    let exportType = null;
    let matchedExport = null;
  
    // Traverse the AST to find the matching export
    traverse(ast, {
      ExportNamedDeclaration(innerPath) {
        if (innerPath.node.declaration) {
          const declarations = innerPath.node.declaration.declarations;
          if (declarations) {
            declarations.forEach((declaration) => {
              if (declaration.id.name === importedName) {
                exportType = "named";
                matchedExport = declaration.id.name;
              }
            });
          }
        }
        if (innerPath.node.specifiers) {
          innerPath.node.specifiers.forEach((specifier) => {
            if (specifier.exported.name === importedName) {
              exportType = "named";
              matchedExport = specifier.exported.name;
            }
          });
        }
      },
      ExportDefaultDeclaration(innerPath) {
        if (importedName === "default") {
          exportType = "default";
          matchedExport = "default";
        }
      },
    });
  
    // If a matching export is found, follow its import chain
    if (matchedExport) {
      traverse(ast, {
        ImportDeclaration(innerPath) {
          const source = innerPath.node.source.value;
          if (innerPath.node.specifiers) {
            innerPath.node.specifiers.forEach((specifier) => {
              if (specifier.local.name === matchedExport) {
                context.importedName = matchedExport;
                const result = findTerminalFileAndExport(
                  source,
                  path.dirname(context.currentPath),
                  specifier.imported ? specifier.imported.name : "default",
                  context
                );
                if (result) {
                  context.currentPath = result.filePath;
                  exportType = result.exportType;
                }
              }
            });
          }
        },
      });
    }
  
    return { filePath: context.currentPath, exportType };
  }
  

  function rewriteImports(outputPath, context) {
    context.filePath = outputPath;
    console.log(`[DeIndexPlugin] Rewriting imports in: ${outputPath}`);
  
    const { code, ast } = parseFile(outputPath);
    let updated = false;
  
    traverse(ast, {
      ImportDeclaration(importPath) {
        const source = importPath.node.source.value;
  
        // Skip non-relative paths (e.g., NPM module imports)
        if (!source.startsWith('.') && !source.startsWith('/')) {
          console.log(`[DeIndexPlugin] Skipping non-relative import: ${source}`);
          return;
        }
  
        const specifiers = importPath.node.specifiers;
  
        specifiers.forEach((specifier) => {
          const importedName = specifier.imported
            ? specifier.imported.name
            : "default";
  
          context.importedName = importedName;
          context.importedAs = specifier.local.name; // Capture the alias
          context.importSource = source;
  
          // Start recursive resolution
          const result = findTerminalFileAndExport(
            source,
            context.outputDirectory,
            importedName,
            context
          );
  
          console.log({ result, context });
          if (result) {
            let relativePath = path
              .relative(path.dirname(outputPath), result.filePath)
              .replace(/\\/g, "/");
  
            // Add the correct extension from context
            if (!relativePath.endsWith(context.fileExtension)) {
              relativePath += context.fileExtension;
            }
  
            if (
              specifier.type === "ImportDefaultSpecifier" &&
              result.exportType === "default"
            ) {
              importPath.node.source.value = `./${relativePath}`;
            } else if (
              specifier.type === "ImportSpecifier" &&
              result.exportType === "named"
            ) {
              importPath.node.source.value = `./${relativePath}`;
            } else if (
              specifier.type === "ImportDefaultSpecifier" &&
              result.exportType === "named"
            ) {
              importPath.node.specifiers = [
                t.importSpecifier(
                  t.identifier(context.importedAs),
                  t.identifier(importedName)
                ),
              ];
              importPath.node.source.value = `./${relativePath}`;
            } else if (
              specifier.type === "ImportSpecifier" &&
              result.exportType === "default"
            ) {
              importPath.node.specifiers = [
                t.importDefaultSpecifier(t.identifier(context.importedAs)),
              ];
              importPath.node.source.value = `./${relativePath}`;
            }
            updated = true;
          } else {
            if (importPath && importPath.node) {
              console.warn(
                `[DeIndexPlugin] Removing unresolved import: ${importPath.node.source.value}`
              );
              importPath.remove();
            }
          }
        });
      },
    });
  
    if (updated) {
      const output = generate(ast, {}, code);
      fs.writeFileSync(outputPath, output.code, "utf8");
      console.log(`[DeIndexPlugin] Rewritten imports in ${outputPath}`);
    }
  }

// Function to recursively copy all files and create directories (including subdirectories)
function copyAllFiles(inputDirectory, outputDirectory) {
  fs.readdirSync(inputDirectory).forEach((file) => {
    const inputPath = path.join(inputDirectory, file);
    const outputPath = path.join(outputDirectory, file);

    if (fs.lstatSync(inputPath).isDirectory()) {
      // Create the corresponding directory in the output path
      fs.mkdirSync(outputPath, { recursive: true });
      // Recursively copy all files in the subdirectory
      copyAllFiles(inputPath, outputPath);
    } else {
      // Copy files as-is
      fs.copyFileSync(inputPath, outputPath);
    }
  });
}

// Function to recursively process all JS files in a directory and rewrite imports
function processDirectoryForImports(outputDirectory) {
  fs.readdirSync(outputDirectory).forEach((file) => {
    const outputPath = path.join(outputDirectory, file);

    if (fs.lstatSync(outputPath).isDirectory()) {
      // Recursively process the subdirectory
      processDirectoryForImports(outputPath);
    } else if (matchesFileExtension(outputPath)) {
      // Process JS files to rewrite imports
      rewriteImports(outputPath, {
        topLevelFile: outputPath,
        filePath: outputPath,
        directory: outputDirectory,
        outputDirectory,
      });
    }
  });
}

class DeIndexPlugin {
  constructor(options) {
    this.options = options || {};
    this.inputPath = this.options.inputPath || path.join(__dirname, "input");
    this.outputPath = this.options.outputPath || path.join(__dirname, "output");
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync("DeIndexPlugin", (compilation, callback) => {
      console.log(`[DeIndexPlugin] Starting to process files...`);

      if (!fs.existsSync(this.inputPath)) {
        console.error(
          `[DeIndexPlugin] Input path does not exist: ${this.inputPath}`
        );
        callback();
        return;
      }

      if (!fs.existsSync(this.outputPath)) {
        fs.mkdirSync(this.outputPath, { recursive: true });
        console.log(
          `[DeIndexPlugin] Created output directory at: ${this.outputPath}`
        );
      }

      // First pass: Copy all files and create directories
      copyAllFiles(this.inputPath, this.outputPath);

      // Second pass: Process the directory and rewrite imports
      processDirectoryForImports(this.outputPath);

      console.log(`[DeIndexPlugin] Completed processing all files.`);
      callback();
    });
  }
}

module.exports = DeIndexPlugin;
