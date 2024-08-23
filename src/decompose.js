const { exec } = require('child_process');
const path = require('path');

// List your webpack configurations here
const webpackConfigs = [
    path.join(__dirname, 'webpack_process/src/webpack_process/infiltrate.webpack.config.js'),
    path.join(__dirname, 'webpack_process/src/webpack_process/destroy.webpack.config.js'),
    path.join(__dirname, 'webpack_process/src/webpack_process/rebuild.webpack.config.js'),
];

function runWebpack(configPath) {
    return new Promise((resolve, reject) => {
        const command = `npx webpack --config ${configPath}`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                reject(error);
                return;
            }
            if (stderr) {
                console.error(`Stderr: ${stderr}`);
                reject(stderr);
                return;
            }
            console.log(`Webpack completed with config: ${configPath}`);
            console.log(stdout);
            resolve();
        });
    });
}

async function runWebpackSequence() {
    for (const config of webpackConfigs) {
        try {
            await runWebpack(config);
        } catch (error) {
            console.error('Webpack process failed:', error);
            break; // Stop the sequence if an error occurs
        }
    }
    console.log('All webpack operations completed.');
}

runWebpackSequence();
