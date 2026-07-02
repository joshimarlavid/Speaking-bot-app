const fs = require('fs');

const appFile = '/app/src/App.tsx';
let content = fs.readFileSync(appFile, 'utf8');

const matches = content.match(/Unlock Spellbook \(\$500\)/g);
console.log(matches);

const context = content.substring(content.indexOf('Unlock Spellbook') - 200, content.indexOf('Unlock Spellbook') + 200);
console.log(context);
