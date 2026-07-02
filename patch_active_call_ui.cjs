const fs = require('fs');
const file = '/app/src/components/ActiveCall.tsx';
let content = fs.readFileSync(file, 'utf8');

// Inject the skull logo into the header of ActiveCall
const headerLogoInject = `
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-700 shadow-xl">
              <img src="/skull_logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className={\`text-2xl font-bold \${theme.textPrimary} flex items-center gap-2\`}>
`;

content = content.replace(
  /<div className="flex items-center gap-4">\s*<div className={`w-16 h-16 rounded-full bg-gradient-to-br \${theme\.bgGradient} flex items-center justify-center shadow-\[0_0_15px_\${theme\.glowHex}\]`}>\s*<Volume2 className={`w-8 h-8 \${theme\.textPrimary}`} \/>\s*<\/div>\s*<div>\s*<h2 className={`text-2xl font-bold \${theme\.textPrimary} flex items-center gap-2`}>/m,
  headerLogoInject
);

fs.writeFileSync(file, content);
console.log("ActiveCall UI Patched.");
