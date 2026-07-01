const fs = require('fs');

const pkgFile = '/app/package.json';
const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));

pkg.main = "electron/main.js";
pkg.scripts["electron:start"] = "npm run build && electron .";
pkg.scripts["electron:build"] = "npm run build && electron-builder build";

pkg.build = {
  "appId": "com.linguarole.desktop",
  "productName": "LinguaRole",
  "directories": {
    "output": "dist_electron"
  },
  "files": [
    "dist/**/*",
    "electron/**/*",
    "server.ts"
  ],
  "mac": {
    "category": "public.app-category.education"
  },
  "win": {
    "target": "nsis"
  },
  "linux": {
    "target": "AppImage"
  }
};

fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2));
console.log("package.json updated for electron build.");
