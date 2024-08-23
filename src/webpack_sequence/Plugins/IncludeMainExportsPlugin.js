const fs = require("fs");
const path = require("path");

class IncludeMainExportsPlugin {
  constructor(options) {
    this.options = options || {};
    this.outputPath = this.options.outputPath || path.join(__dirname, "output");
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync("IncludeMainExportsPlugin", (compilation, callback) => {
      // Ensure the output path directory exists
      if (!fs.existsSync(this.outputPath)) {
        fs.mkdirSync(this.outputPath, { recursive: true });
      }

      compilation.modules.forEach((module) => {
        if (module.resource && !module.resource.includes("node_modules")) {
          // If this module is part of an `module-*` package, include the main export and package.json
          if (module.resource.includes("module-")) {
            this.includeMainExport(module.resource, this.outputPath, compiler);
          }
        }
      });

      callback();
    });
  }

  includeMainExport(resourcePath, outputPath, compiler) {
    // Find the root directory of the `module-*` package
    let packageDir = resourcePath;
    while (packageDir !== path.dirname(packageDir) && !path.basename(packageDir).startsWith("module-")) {
      packageDir = path.dirname(packageDir);
    }

    // Check if the packageDir is a valid `module-*` directory
    if (!path.basename(packageDir).startsWith("module-")) {
      return;
    }

    // Locate the package.json file at the root of the `module-*` package
    const packageJsonPath = path.join(packageDir, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      // Copy the package.json file to the corresponding output directory
      const outputPackageJsonPath = path.join(outputPath, path.relative(compiler.context, packageDir), "package.json");
      fs.mkdirSync(path.dirname(outputPackageJsonPath), { recursive: true });
      fs.copyFileSync(packageJsonPath, outputPackageJsonPath);

      // If there's a main field, include the main file in the bundle
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      if (packageJson.main) {
        const mainFilePath = path.resolve(packageDir, packageJson.main);
        if (fs.existsSync(mainFilePath)) {
          const outputMainFilePath = path.join(outputPath, path.relative(compiler.context, mainFilePath));
          fs.mkdirSync(path.dirname(outputMainFilePath), { recursive: true });
          fs.copyFileSync(mainFilePath, outputMainFilePath);
        }
      }
    }
  }
}

module.exports = IncludeMainExportsPlugin;
