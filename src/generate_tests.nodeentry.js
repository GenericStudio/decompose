const fs = require("fs");
const path = require("path");

// Directory structure
const baseDir = path.join(
  process.cwd(),
  "decompose_input/example_entries/esmodules"
);
const nestedDir = path.join(baseDir, "nested");

// Ensure directories exist
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
}

if (!fs.existsSync(nestedDir)) {
  fs.mkdirSync(nestedDir, { recursive: true });
}

// File content templates with explanations

// Create a package.json file with "type": "module"
const packageJsonContent = JSON.stringify({
  type: "module",
});

console.log("package.json file has been generated in the esmodules directory.");

const defaultExportFile = `
// Default Export: Common when exporting a single main functionality from a module.
const myFunction = () => {
    console.log('Default export function');
};
export default myFunction;
`;

const namedExportFile = `
// Named Export: Useful when exporting multiple functions, variables, or classes from a module.
export const myFunction = () => {
    console.log('Named export function');
};
export const myVariable = 42;
`;

const renamedExportFile = `
// Renamed Export: Allows you to change the export name when you want to prevent naming conflicts or provide more context.
const anotherFunction = () => {
    console.log('Renamed export function');
};
export { anotherFunction as renamedFunction };
`;

const reExportFile = `
// Re-export: Facilitates modularization by allowing you to re-export from another module without importing first.
export { myFunction } from './named-export.js';
`;

const reExportRenameFile = `
// Re-export with Rename: Combines re-exporting and renaming to provide further flexibility in managing module interfaces.
export { myFunction as renamedFunction } from './named-export.js';
`;

const exportAllFile = `
// Export All: Useful for consolidating and forwarding all exports from another module.
export * from './named-export.js';
`;

const exportAllWithRenameFile = `
// Export All with Rename: Enhances export flexibility by forwarding all exports and selectively renaming specific ones.
export * from './named-export.js';
export { myFunction as anotherName } from './named-export.js';
`;

const defaultAndNamedExportFile = `
// Default and Named Export Together: Combines both default and named exports, common in larger modules with a primary export and several secondary ones.
const myDefaultFunction = () => {
    console.log('Default function');
};
export default myDefaultFunction;
export const myVariable = 42;
`;

const defaultImportFile = `
// Default Import: Common case for importing the main functionality of a module.
import myFunction from './default-export.js';
myFunction();
`;

const namedImportFile = `
// Named Import: Allows selective importing of specific parts of a module, useful for importing only what's needed.
import { myFunction, myVariable } from './named-export.js';
console.log(myVariable);
myFunction();
`;

const renamedImportFile = `
// Renamed Import: Useful when the imported name conflicts with local names or when a more descriptive name is desired.
import { myFunction as anotherFunction } from './named-export.js';
anotherFunction();
`;

const importAllAsNamespaceFile = `
// Import All as Namespace: Helpful when you want access to everything in a module under a single namespace, often used in libraries or utility modules.
import * as myModule from './named-export.js';
console.log(myModule.myVariable);
myModule.myFunction();
`;

const defaultWithNamedImportFile = `
// Default Import with Named Imports: Common in larger modules where you want the primary export along with specific named exports.
import myDefaultFunction, { myVariable } from './default-and-named-export.js';
console.log(myVariable);
myDefaultFunction();
`;

const dynamicImportFile = `
// Dynamic Import: Useful for code-splitting and lazy-loading, often used in large applications or performance-critical scenarios.
import('./named-export.js').then(module => {
    module.myFunction();
});
`;

const sideEffectImportFile = `
// Import with Side Effect: Used when importing a module for its side effects (e.g., polyfills, global modifications), without importing any specific bindings.
import './side-effect-module.js';
`;

const commonjsFile = `
// CommonJS Export: Standard in Node.js, particularly for legacy code and modules that still use CommonJS.
const myFunction = () => {
    console.log('CommonJS function');
};
module.exports = myFunction;
`;

const commonjsNamedExportFile = `
// CommonJS Named Export: Common pattern in Node.js, allowing multiple exports similar to named exports in ESM.
exports.myFunction = () => {
    console.log('CommonJS named function');
};
exports.myVariable = 42;
`;

const commonjsImportFile = `
// CommonJS Import: Standard for importing CommonJS modules, widely used in Node.js.
const myFunction = require('./commonjs-export.js');
myFunction();
`;

const commonjsDestructuredImportFile = `
// Destructuring CommonJS Import: A common practice to extract specific properties or functions from a CommonJS module.
const { myFunction, myVariable } = require('./commonjs-named-export.js');
console.log(myVariable);
myFunction();
`;

const indexFile = `
// Importing and executing default export
import defaultFunction from './default-export.js';
defaultFunction();

// Importing and using named exports
import { myFunction as namedFunction, myVariable } from './named-export.js';
namedFunction();
console.log('Named variable:', myVariable);

// Importing and using renamed exports
import { renamedFunction } from './renamed-export.js';
renamedFunction();

// Importing and using re-exported functions
import { myFunction as reExportedFunction } from './re-export.js';
reExportedFunction();

// Importing and using re-exported renamed functions
import { renamedFunction as reExportedRenamedFunction } from './re-export-rename.js';
reExportedRenamedFunction();

// Importing and using everything from a module (namespace import)
import * as everything from './export-all.js';
everything.myFunction();
console.log('Everything variable:', everything.myVariable);

// Using imports from nested files
import { nestedFunction } from './nested/nested-file.js';
nestedFunction();

// Using exports from group import files
import './grouped-imports.js';
`;

const nestedFile = `
// Nested File: Demonstrates nested folder structures, important for testing relative imports.
export const nestedFunction = () => {
    console.log('Nested function');
};
`;

const unusedFileA = `
import { unusedFunctionB } from './unused-file-b.js';

export const unusedFunctionA = () => {
  console.log('This is unusedFunctionA from unused-file-a.js');
  unusedFunctionB();
};
`;

const unusedFileB = `
import { unusedFunctionC } from './unused-file-c.js';

export const unusedFunctionB = () => {
  console.log('This is unusedFunctionB from unused-file-b.js');
  unusedFunctionC();
};
`;

const unusedFileC = `
export const unusedFunctionC = () => {
  console.log('This is unusedFunctionC from unused-file-c.js');
};
`;

const groupImportsFile = `
import { myFunction, myVariable } from './named-export.js';
console.log('Group Import #1:', myFunction(), myVariable);

import { myFunction as renamedFunction, myVariable as renamedVariable } from './named-export.js';
console.log('Group Import #2:', renamedFunction(), renamedVariable);

import * as myModule from './named-export.js';
console.log('Group Import #3:', myModule.myFunction(), myModule.myVariable);

import defaultFunction, { myVariable as variable2 } from './default-and-named-export.js';
console.log('Group Import #4:', defaultFunction(), variable2);

import { myFunction as function1 } from './named-export.js';
import { myFunction as function2 } from './re-export.js';
import { nestedFunction as function3 } from './nested/nested-file.js';
console.log('Group Import #5:', function1(), function2(), function3());

export {function1, function2, function3}
`;

const files = [
  // Write files
  { name: "default-export.js", content: defaultExportFile },
  { name: "named-export.js", content: namedExportFile },
  { name: "renamed-export.js", content: renamedExportFile },
  { name: "re-export.js", content: reExportFile },
  { name: "re-export-rename.js", content: reExportRenameFile },
  { name: "export-all.js", content: exportAllFile },
  { name: "export-all-with-rename.js", content: exportAllWithRenameFile },
  { name: "default-and-named-export.js", content: defaultAndNamedExportFile },
  { name: "default-import.js", content: defaultImportFile },
  { name: "named-import.js", content: namedImportFile },
  { name: "renamed-import.js", content: renamedImportFile },
  { name: "import-all-as-namespace.js", content: importAllAsNamespaceFile },
  { name: "default-with-named-import.js", content: defaultWithNamedImportFile },
  { name: "dynamic-import.js", content: dynamicImportFile },
  { name: "side-effect-module.js", content: sideEffectImportFile },
  { name: "commonjs-export.js", content: commonjsFile },
  { name: "commonjs-named-export.js", content: commonjsNamedExportFile },
  { name: "commonjs-import.js", content: commonjsImportFile },
  {
    name: "commonjs-destructured-import.js",
    content: commonjsDestructuredImportFile,
  },
  { name: "index.js", content: indexFile },
  { name: "package.json", content: packageJsonContent },

  { name: path.join("nested", "nested-file.js"), content: nestedFile },

  { name: "unused-file-a.js", content: unusedFileA },
  { name: "unused-file-b.js", content: unusedFileB },
  { name: "unused-file-c.js", content: unusedFileC },
  { name: "grouped-imports.js", content: groupImportsFile },
];

files.forEach((file) => {
  // Function to write files
  const filePath = path.join(baseDir, file.name);
  fs.writeFileSync(filePath, file.content.trim());
});

console.log("Files have been generated in the esmodules directory.");
