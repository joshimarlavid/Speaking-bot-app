const fs = require('fs');

const appFile = '/app/src/App.tsx';
let content = fs.readFileSync(appFile, 'utf8');

// Replace duplicate declaration
content = content.replace(
  /const isConnected = isConnected \|\| elevenLabsConnected;/,
  `// const isConnected = isConnected || elevenLabsConnected;` // Just comment it out to see if it fixes things since isConnected comes from hook
);
// Actually wait, let's see where isConnected comes from
fs.writeFileSync(appFile, content);
