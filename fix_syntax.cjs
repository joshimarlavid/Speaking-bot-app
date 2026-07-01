const fs = require('fs');

const appFile = '/app/src/App.tsx';
let content = fs.readFileSync(appFile, 'utf8');

content = content.replace(
  /\{children\}\n\s*\)\}\n\s*\)\}\n\s*<\/div>/,
  `{children}\n      </div>`
);

fs.writeFileSync(appFile, content);
console.log("Syntax patched.");
