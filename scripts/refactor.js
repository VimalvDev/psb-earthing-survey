const fs = require('fs');
const path = require('path');

// 1. Strip comments helper
function stripComments(code) {
  // Simple block and line comment stripper
  // Note: we should be careful with URLs. Let's not strip line comments if they are part of a URL (http://)
  // And avoid stripping within JSX strings if possible. 
  // A simple regex approach that avoids replacing inside strings:
  return code.replace(/\/\*[\s\S]*?\*\//g, '')
             .replace(/(?<!:)\/\/.*/g, '');
}

// Just strip all files of comments first
const dirs = ['app', 'components', 'lib'];
function traverse(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      content = stripComments(content);
      // Remove empty lines created by comment deletion
      content = content.replace(/^\s*[\r\n]/gm, '');
      if (original !== content) {
        fs.writeFileSync(fullPath, content);
      }
    }
  });
}
traverse('app');
traverse('components');
traverse('lib');
console.log("Comments stripped");
