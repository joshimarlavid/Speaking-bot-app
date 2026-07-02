const { execSync } = require('child_process');
try {
  execSync('npm run build');
  console.log('Build succeeded.');
} catch (e) {
  console.error('Build failed.');
  process.exit(1);
}
