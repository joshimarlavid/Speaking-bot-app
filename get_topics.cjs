const fs = require('fs');
const dataContent = fs.readFileSync('src/data.ts', 'utf-8');

// Quick and dirty extraction
const topicsRegex = /export const GRAMMAR_TOPICS = (\[[\s\S]*?\]);/m;
const match = dataContent.match(topicsRegex);
if (match) {
  // Can't directly eval typescript, let's just parse it using a regex or simple eval
  const jsCode = match[1].replace(/ as const/g, '').replace(/:\s*string/g, '');
  try {
    const topics = eval(jsCode);
    console.log(`Found ${topics.length} topics`);
    fs.writeFileSync('topics.json', JSON.stringify(topics, null, 2));
  } catch (e) {
    console.error("Eval failed:", e);
  }
}
