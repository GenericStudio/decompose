
const common = require("./common.webpack.config");

const ExportFilesPlugin = require("./ExportFilesPlugin");
const IncludeMainExportsPlugin = require("./IncludeMainExportsPlugin");

module.exports = merge(common, {
  entry: "./example_entries/esmodules/index.js", // Entry file of the module

  output: {
    filename: "[name].bundle.js",
    path: "/Users/ecatlin/personal/extractor/decompose_output/webpack_build",
    clean: true,
  },
 
  plugins: [
    new ExportFilesPlugin({
      outputPath:
        "/Users/ecatlin/personal/extractor/decompose_output/0ExtractFilesPluginOutput",
    }), // relative to webpack output
    new IncludeMainExportsPlugin({
      outputPath:
        "/Users/ecatlin/personal/extractor/decompose_output/0ExtractFilesPluginOutput",
    }),
  ],
});
