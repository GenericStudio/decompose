const fs = require("fs");
const path = require("path");

class ExportFilesPlugin {
  constructor(options) {
    this.options = options || {};
    this.outputPath = this.options.outputPath || path.join(__dirname, "output");
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync(
      "ExportFilesPlugin",
      (compilation, callback) => {
        if (!fs.existsSync(this.outputPath)) {
          fs.mkdirSync(this.outputPath, { recursive: true });
        }

        const modulesToExclude = [];

        // Handle all modules
        compilation.modules.forEach((module) => {
          this.processModule(module, compiler.context, modulesToExclude);
        });

        // Handle entry points separately using `compilation.options.entry`
        const entryPoints = compilation.options.entry;

        // If entryPoints is an object (multiple entries)
        if (typeof entryPoints === "object") {
          Object.values(entryPoints).forEach((entry) => {
            if (typeof entry === "string") {
              this.processEntry(entry, compiler.context, modulesToExclude);
            } else if (typeof entry === "object" && entry.import) {
              entry.import.forEach((importPath) => {
                this.processEntry(
                  importPath,
                  compiler.context,
                  modulesToExclude
                );
              });
            }
          });
        } else if (typeof entryPoints === "string") {
          // If entryPoints is a string (single entry)
          this.processEntry(entryPoints, compiler.context, modulesToExclude);
        }

        if (modulesToExclude.length > 0) {
          console.log(
            "Add these to extractor.webpack.config > { externals:[] } to optimize extracted bundle by excluding these from the source graph:"
          );
          modulesToExclude.forEach((moduleName) => {
            console.log(`"${moduleName}": "commonjs2 ${moduleName}",`);
          });
        }

        callback();
      }
    );
  }

  processModule(module, context, modulesToExclude) {
    if (module.resource && !module.resource.includes("node_modules")) {
      const isNodeModule = module.resource.includes("node_modules");
      if (isNodeModule) {
        const moduleName = this.getNodeModuleName(module.resource);
        if (moduleName && !modulesToExclude.includes(moduleName)) {
          modulesToExclude.push(moduleName);
        }
      }

      const relativePath = path.relative(context, module.resource);
      const targetPath = path.join(this.outputPath, relativePath);

      // Ensure the necessary directory structure exists in the output path
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });

      // Copy the file directly to the new location in the output directory
      fs.copyFileSync(module.resource, targetPath);
    }
  }

  processEntry(entry, context, modulesToExclude) {
    console.log({ context, entry });

    const entryPath = path.resolve(context, entry);
    const relativePath = path.relative(context, entryPath);
    const targetPath = path.join(this.outputPath, relativePath);

    // Ensure the necessary directory structure exists in the output path
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    // Copy the file directly to the new location in the output directory
    fs.copyFileSync(entryPath, targetPath);
  }

  getNodeModuleName(resourcePath) {
    const parts = resourcePath.split(path.sep);
    const nodeModulesIndex = parts.indexOf("node_modules");

    if (nodeModulesIndex !== -1 && parts[nodeModulesIndex + 1]) {
      const modulePart = parts[nodeModulesIndex + 1];

      if (modulePart.startsWith("@") && parts[nodeModulesIndex + 2]) {
        return `${modulePart}/${parts[nodeModulesIndex + 2]}`;
      } else {
        return modulePart;
      }
    }
    return null;
  }
}

module.exports = ExportFilesPlugin;
