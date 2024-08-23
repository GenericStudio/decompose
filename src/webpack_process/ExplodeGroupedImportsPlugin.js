const fs = require("fs");
const path = require("path");
const { parse } = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;

class ExplodeGroupedImportsPlugin {
  constructor(options) {
    this.options = options || {};
    this.inputPath = this.options.inputPath || path.join(__dirname, "input");
    this.outputPath = this.options.outputPath || path.join(__dirname, "output");
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync(
      "ExplodeGroupedImportsPlugin",
      (compilation, callback) => {
        console.log(
          `[ExplodeGroupedImportsPlugin] Starting to process files...`
        );

        if (!fs.existsSync(this.inputPath)) {
          console.error(
            `[ExplodeGroupedImportsPlugin] Input path does not exist: ${this.inputPath}`
          );
          callback();
          return;
        }
        if (!fs.existsSync(this.outputPath)) {
          fs.mkdirSync(this.outputPath, { recursive: true });
          console.log(
            `[ExplodeGroupedImportsPlugin] Created output directory at: ${this.outputPath}`
          );
        }

        const files = this.getFiles(this.inputPath);
        console.log(
          `[ExplodeGroupedImportsPlugin] Found ${files.length} files to process.`
        );
        files.forEach((file) => {
          if (this.isJavaScriptFile(file)) {
            console.log(`Processing JS/TS file: ${file}`);
            const content = fs.readFileSync(file, "utf8");
            const modifiedContent = this.processContent(content, file);
            const outputPath = file.replace(this.inputPath, this.outputPath);
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.writeFileSync(outputPath, modifiedContent);
          } else {
            console.log(`Copying non-JS file: ${file}`);
            const outputPath = file.replace(this.inputPath, this.outputPath);
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.copyFileSync(file, outputPath);
          }
        });

        console.log(
          `[ExplodeGroupedImportsPlugin] Completed processing all files.`
        );
        callback();
      }
    );
  }

  getFiles(dir) {
    let files = [];
    const items = fs.readdirSync(dir);
    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        files = files.concat(this.getFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    });
    return files;
  }

  isJavaScriptFile(filePath) {
    // Only process .js, .jsx, .ts, .tsx, .mjs, etc.
    const validExtensions = [".js", ".jsx", ".ts", ".tsx", ".mjs"];
    return validExtensions.includes(path.extname(filePath));
  }

  processContent(content, filePath) {
    const ast = parse(content, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });
  
    // Use an array to collect import statements for replacement
    let newImports = [];
  
    traverse(ast, {
      ImportDeclaration(path) {
        const { specifiers, source } = path.node;
  
        if (specifiers.length > 1) {
          // Create individual import statements for each specifier
          specifiers.forEach((specifier) => {
            if (specifier.type === "ImportDefaultSpecifier") {
              newImports.push(
                `import ${specifier.local.name} from '${source.value}';`
              );
            } else if (specifier.type === "ImportNamespaceSpecifier") {
              newImports.push(
                `import * as ${specifier.local.name} from '${source.value}';`
              );
            } else if (specifier.type === "ImportSpecifier") {
              const importedName =
                specifier.imported.name === specifier.local.name
                  ? specifier.imported.name
                  : `${specifier.imported.name} as ${specifier.local.name}`;
              newImports.push(
                `import { ${importedName} } from '${source.value}';`
              );
            }
          });
  
          // Remove the original grouped import
          path.remove();
        }
      },
    });
  
    // Generate the updated code from the modified AST
    const { code } = generate(ast, {}, content);
  
    // Prepend the new import statements to the transformed code
    const transformedContent = newImports.join("\n") + "\n" + code;
  
    return transformedContent;
  }
}

module.exports = ExplodeGroupedImportsPlugin;
