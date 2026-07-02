const fs = require('fs');

const appFile = '/app/src/App.tsx';
let content = fs.readFileSync(appFile, 'utf8');

content = content.replace(
  /const \[isPremium, setIsPremium\] = useState\(false\);/,
  `const [isPremium, setIsPremium] = useState(() => localStorage.getItem('linguaRole_premium') === 'true');`
);

fs.writeFileSync(appFile, content);
console.log("isPremium initialization patched.");
