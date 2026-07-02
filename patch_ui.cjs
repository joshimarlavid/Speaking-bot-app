const fs = require('fs');

const appFile = '/app/src/App.tsx';
let content = fs.readFileSync(appFile, 'utf8');

// 1. Add Logo in Sidebar Dashboard area
const logoInject = `
          <div className="mb-8 hidden lg:block rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-zinc-800">
             <img src="/dark_art_studio.jpg" alt="Dark Art Studio" className="w-full h-auto" />
          </div>
          {/* Main Navigation */}
`;
content = content.replace(/{\/\* Main Navigation \*\/}/, logoInject);

// 2. Adjust ActiveCall usage of bgUrl
// We already configured it to use /dark_art_studio.jpg when rendering ActiveCall.

fs.writeFileSync(appFile, content);
console.log("UI patched.");
