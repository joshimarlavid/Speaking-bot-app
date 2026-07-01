const fs = require('fs');

const file = '/app/src/useLiveAPI.ts';
let content = fs.readFileSync(file, 'utf8');

const silenceFix = `
                let initMessage = "";
                if (mode === "teacher") {
                  initMessage = \`Greeting trigger: Hi \${studentName || "there"}! Please introduce the topic "\${topic?.title || "English grammar"}" and ask me a short diagnostic question to start our practice. Important: Speak aloud your response immediately.\`;
                } else {
                  initMessage = \`Greeting trigger: You are playing the role of \${role?.name || "Partner"}. Greet me warmly as the student named \${studentName} inside your character's persona and context. Introduce yourself very briefly in exactly 1-2 short sentences to start our conversation! Important: Speak aloud your response immediately.\`;
                }
`;

content = content.replace(
    /let initMessage = "";[\s\S]*?initMessage = `Greeting trigger: You are playing the role of \${role\?\.name \|\| "Partner"}\. Greet me warmly as the student named \${studentName} inside your character's persona and context\. Introduce yourself very briefly in exactly 1-2 short sentences to start our conversation!`;\s*}/,
    silenceFix
);

fs.writeFileSync(file, content);
console.log("Patched silence bug.");
