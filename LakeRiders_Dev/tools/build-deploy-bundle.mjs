import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const browserDemoDir = path.join(root, 'LakeRiders_Dev', 'BrowserDemo');
const deployBundleDir = path.join(root, 'LakeRiders_Dev', 'DeployBundle');

if (!fs.existsSync(deployBundleDir)) {
  fs.mkdirSync(deployBundleDir, { recursive: true });
}

console.log('Building deployment bundle...');
console.log(`Source: ${browserDemoDir}`);
console.log(`Destination: ${deployBundleDir}`);

// Copy shared tools if needed
const toolsDir = path.join(root, 'LakeRiders_Dev', 'tools');
for (const file of ['room-registry.mjs', 'websocket.mjs']) {
  const src = path.join(toolsDir, file);
  const dst = path.join(deployBundleDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
  }
}

console.log('✅ Deploy bundle successfully built.');
