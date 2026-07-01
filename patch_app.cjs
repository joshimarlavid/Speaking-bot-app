const fs = require('fs');

const appFile = '/app/src/App.tsx';
let content = fs.readFileSync(appFile, 'utf8');

// The initial search pattern
const pattern = /<div className="min-h-screen bg-black text-slate-300 font-sans selection:bg-blue-500\\\/30">/;

// The new ActiveCall injection logic
const injection = `
  <div className="min-h-screen bg-black text-slate-300 font-sans selection:bg-blue-500/30">
    <AnimatePresence>
      {isConnected && (
        <ActiveCall
          theme={activeTheme}
          role={selectedRole}
          topic={mode === 'teacher' ? selectedGrammarTopic : selectedTopic}
          studentName={studentName}
          userTranscript={userTranscript}
          aiTranscript={aiTranscript}
          isConnecting={isConnecting}
          isConnected={isConnected}
          hasMicrophone={hasMicrophone}
          onDisconnect={disconnect}
          bgUrl="/dark_art_studio.jpg"
        />
      )}
    </AnimatePresence>
    {!isConnected && (
`;

content = content.replace(pattern, injection);

// Add the closing braces correctly near the end before the last closing div.
content = content.replace(
  /<\/div>\n    <\/div>\n  \);\n}/,
  `      )}\n    </div>\n    </div>\n  );\n}`
);

fs.writeFileSync(appFile, content);
console.log("App patched for rendering.");
