const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;
const t = require("@babel/types");

// Default extensions list
const defaultExtensions = [".js", ".jsx", ".ts", ".tsx"];

// Helper function to read and parse a file into AST
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
function matchesFileExtension(filePath, extensions = defaultExtensions) {
  const regex = new RegExp(`(${extensions.join("|").replace(/\./g, "\\.")})$`);
  return regex.test(filePath);
}

// Helper function to find the file with a wildcard match
function findFileWithExtension(resolvedPath, extensions = defaultExtensions) {
  for (const ext of extensions) {
    const fullPath = `${resolvedPath}${ext}`;
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

// Recursive function to find the terminal file and export type (loop "b")
function findTerminalFileAndExport(
  importPath,
  directory,
  importedName,
  context,
  extensions = defaultExtensions
) {
  context.currentPath = path.resolve(directory, importPath);
  context.importPath = importPath;

  logContext(context, "findTerminalFileAndExport");

  // Skip if the file does not match the allowed extensions
  if (!matchesFileExtension(context.currentPath, extensions)) {
    console.warn(`Skipping non-JS file: ${context.currentPath}`);
    return null; // Return null to indicate a dead end for non-JS files
  }

  let resolvedFile = findFileWithExtension(context.currentPath, extensions);
  if (resolvedFile) {
    context.currentPath = resolvedFile;
  } else if (
    fs.existsSync(context.currentPath) &&
    fs.lstatSync(context.currentPath).isDirectory()
  ) {
    resolvedFile = findFileWithExtension(
      path.join(context.currentPath, "index"),
      extensions
    );
    if (resolvedFile) {
      context.currentPath = resolvedFile;
    } else {
      console.warn(`Skipping directory without index.js: ${context.currentPath}`);
      return null; // Return null for directories without a valid index file
    }
  }

  if (!fs.existsSync(context.currentPath)) {
    console.warn(`Warning: File or directory not found: ${context.currentPath}`);
    return null; // Return null to indicate a dead end
  }

  const { code, ast } = parseFile(context.currentPath);
  let exportType = null;
  let matchedExport = null;

  // First, find the export that matches the imported name
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

  // If an export is matched, proceed to find the corresponding import
  if (matchedExport) {
    traverse(ast, {
      ImportDeclaration(innerPath) {
        const source = innerPath.node.source.value;
        if (innerPath.node.specifiers) {
          innerPath.node.specifiers.forEach((specifier) => {
            if (specifier.local.name === matchedExport) {
              // Recurse further into the import path
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

// Function to rewrite imports in a file (loop "a")
function rewriteImports(outputPath, context) {
  context.filePath = outputPath;
  logContext(context, "rewriteImports");

  const { code, ast } = parseFile(outputPath);
  let updated = false;

  traverse(ast, {
    ImportDeclaration(importPath) {
      const source = importPath.node.source.value;
      const specifiers = importPath.node.specifiers;

      specifiers.forEach((specifier) => {
        const importedName = specifier.imported
          ? specifier.imported.name
          : "default";

        // Track the alias (renamed import) in the context
        context.importedName = importedName;
        context.importedAs = specifier.local.name; // Capture the alias
        context.importSource = source;

        // Start recursive resolution (loop "b")
        const result = findTerminalFileAndExport(
          source,
          context.outputDirectory, // Use outputDirectory for resolution
          importedName,
          context
        );

        if (result) {
          const relativePath = path
            .relative(path.dirname(outputPath), result.filePath)
            .replace(/\\/g, "/");

          // Determine the appropriate import type and update the import statement
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
                t.identifier(context.importedAs), // Use the alias here
                t.identifier(importedName)
              ),
            ];
            importPath.node.source.value = `./${relativePath}`;
          } else if (
            specifier.type === "ImportSpecifier" &&
            result.exportType === "default"
          ) {
            importPath.node.specifiers = [
              t.importDefaultSpecifier(t.identifier(context.importedAs)), // Use the alias here
            ];
            importPath.node.source.value = `./${relativePath}`;
          }
          updated = true;
        } else {
          // If the result is null (dead end), ensure the node is valid before removing
          if (importPath && importPath.node) {
            console.warn(`Removing unresolved import: ${importPath.node.source.value}`);
            importPath.remove();
          }
        }
      });
    },
  });

  if (updated) {
    const output = generate(ast, {}, code);
    fs.writeFileSync(outputPath, output.code, "utf8");
    console.log(`Rewritten imports in ${outputPath}`);
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

// Function to recursively process all JS files in a directory and rewrite imports (loop "a")
function processDirectoryForImports(outputDirectory) {
  fs.readdirSync(outputDirectory).forEach((file) => {
    const outputPath = path.join(outputDirectory, file);

    if (fs.lstatSync(outputPath).isDirectory()) {
      // Recursively process the subdirectory
      processDirectoryForImports(outputPath);
    } else if (matchesFileExtension(outputPath, defaultExtensions)) {
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

// Helper function to log the context object
function logContext(context, loc) {
  console.log("Context:", loc, JSON.stringify(context, null, 2));
}

// Run the script on a target directory
const originalDirectory =
  "/Users/ecatlin/code/module-checkout-client/packages/extractor/decompose_output/Step3"; // Original directory
const copiedDirectory =
  "/Users/ecatlin/code/module-checkout-client/packages/extractor/decompose_output/Step4"; // Output directory

// Ensure the output directory exists
fs.mkdirSync(copiedDirectory, { recursive: true });

// First pass: Copy all files and create directories (including subdirectories)
copyAllFiles(originalDirectory, copiedDirectory);

// Second pass: Process the directory and rewrite imports
processDirectoryForImports(copiedDirectory);

console.log("Processing complete");
