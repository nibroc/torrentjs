#!/usr/bin/env node
try {
    var reporter = require('nodeunit').reporters.default;
} catch(e) {
    console.log("Cannot find nodeunit module. Please run 'npm install'");
    process.exit();
}
process.chdir(__dirname);
reporter.run(['test']);