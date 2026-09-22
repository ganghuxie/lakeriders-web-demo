import http from 'http';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { createServer as createViteServer } from 'vite';
import { setupMultiplayerServer } from './src/server/multiplayer';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  // Setup WebSocket multiplayer server on /ws
  setupMultiplayerServer(server);

  // Support up to 150MB raw body for zip upload
  app.use('/api/upload-zip', express.raw({ type: '*/*', limit: '150mb' }));
  app.use(express.json());

  // Check current project files status
  app.get('/api/status', (req, res) => {
    const cwd = process.cwd();
    const devDir = path.join(cwd, 'LakeRiders_Dev');
    const origDir = path.join(cwd, 'LakeRiders_Original');

    const hasDev = fs.existsSync(devDir);
    const hasOrig = fs.existsSync(origDir);

    let docFiles: string[] = [];
    let allFilesCount = 0;

    if (hasDev) {
      try {
        const findDocs = (dir: string, fileList: string[] = []) => {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
              if (file !== 'node_modules' && file !== '.git') {
                findDocs(filePath, fileList);
              }
            } else {
              fileList.push(path.relative(cwd, filePath));
            }
          }
          return fileList;
        };
        const allFiles = findDocs(devDir);
        allFilesCount = allFiles.length;
        docFiles = allFiles.filter(f => f.toLowerCase().includes('.md') || f.toLowerCase().includes('doc'));
      } catch (err) {
        console.error(err);
      }
    }

    res.json({
      hasDev,
      hasOrig,
      allFilesCount,
      docFiles,
    });
  });

  // Health check endpoint
  app.get(['/health', '/api/health'], (req, res) => {
    res.json({
      status: 'ok',
      service: 'lakeriders',
      version: 'phase-13',
      uptime: process.uptime(),
      ws: '/ws',
      timestamp: new Date().toISOString()
    });
  });

  // Serve the LakeRiders game frontend directly from LakeRiders_Dev/BrowserDemo
  const browserDemoDir = path.join(process.cwd(), 'LakeRiders_Dev', 'BrowserDemo');
  app.use('/game', express.static(browserDemoDir, { index: 'index.html' }));
  app.get('/game', (req, res) => {
    res.sendFile(path.join(browserDemoDir, 'index.html'));
  });

  // Run tests endpoint
  app.post('/api/run-tests', async (req, res) => {
    try {
      const output = execSync('node --test LakeRiders_Dev/tests/*.test.mjs', { encoding: 'utf-8' });
      res.json({ success: true, output });
    } catch (err: any) {
      res.json({ success: false, output: err.stdout || err.message });
    }
  });

  // Build deploy bundle endpoint
  app.post('/api/build-bundle', async (req, res) => {
    try {
      const output = execSync('node LakeRiders_Dev/tools/build-deploy-bundle.mjs', { encoding: 'utf-8' });
      res.json({ success: true, output });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Upload and auto extract zip
  app.post('/api/upload-zip', async (req, res) => {
    try {
      const buffer = req.body as Buffer;
      if (!buffer || buffer.length === 0) {
        return res.status(400).json({ error: '上传的文件为空，请重新选择文件' });
      }

      const cwd = process.cwd();
      const tmpZipPath = path.join('/tmp', `lakeriders-upload-${Date.now()}.zip`);
      const tempExtractDir = path.join('/tmp', `lakeriders-extract-${Date.now()}`);
      fs.writeFileSync(tmpZipPath, buffer);

      fs.mkdirSync(tempExtractDir, { recursive: true });
      execSync(`unzip -q -o "${tmpZipPath}" -d "${tempExtractDir}"`);

      // Find root directory of extracted content (handle top-level subfolder if zip wrapped inside one)
      let sourceDir = tempExtractDir;
      const extractedEntries = fs.readdirSync(tempExtractDir);
      if (extractedEntries.length === 1) {
        const singleEntryPath = path.join(tempExtractDir, extractedEntries[0]);
        if (fs.statSync(singleEntryPath).isDirectory()) {
          sourceDir = singleEntryPath;
        }
      }

      // Preserve original files in LakeRiders_Original
      const origDir = path.join(cwd, 'LakeRiders_Original');
      const devDir = path.join(cwd, 'LakeRiders_Dev');

      fs.rmSync(origDir, { recursive: true, force: true });
      fs.rmSync(devDir, { recursive: true, force: true });

      fs.cpSync(sourceDir, origDir, { recursive: true });
      fs.cpSync(sourceDir, devDir, { recursive: true });

      // Clean up temp
      try {
        fs.rmSync(tmpZipPath, { force: true });
        fs.rmSync(tempExtractDir, { recursive: true, force: true });
      } catch (_) {}

      // Count files
      const listExtracted: string[] = [];
      const walk = (dir: string) => {
        const list = fs.readdirSync(dir);
        for (const item of list) {
          const full = path.join(dir, item);
          if (fs.statSync(full).isDirectory()) {
            walk(full);
          } else {
            listExtracted.push(path.relative(cwd, full));
          }
        }
      };
      walk(devDir);

      res.json({
        success: true,
        message: '导入与解压成功！已创建副本并在 LakeRiders_Dev 中准备就绪。',
        fileCount: listExtracted.length,
        files: listExtracted.slice(0, 50),
      });
    } catch (err: any) {
      console.error('解压失败:', err);
      res.status(500).json({ error: `解压处理失败: ${err.message}` });
    }
  });

  // Git clone endpoint if user provides repo URL
  app.post('/api/git-clone', async (req, res) => {
    try {
      const { repoUrl } = req.body;
      if (!repoUrl || typeof repoUrl !== 'string') {
        return res.status(400).json({ error: '请提供有效的 Git 仓库地址' });
      }

      const cwd = process.cwd();
      const tempGitDir = path.join('/tmp', `lakeriders-git-${Date.now()}`);
      execSync(`git clone --depth 1 "${repoUrl.trim()}" "${tempGitDir}"`);

      const origDir = path.join(cwd, 'LakeRiders_Original');
      const devDir = path.join(cwd, 'LakeRiders_Dev');

      fs.rmSync(origDir, { recursive: true, force: true });
      fs.rmSync(devDir, { recursive: true, force: true });

      fs.cpSync(tempGitDir, origDir, { recursive: true });
      fs.cpSync(tempGitDir, devDir, { recursive: true });

      fs.rmSync(tempGitDir, { recursive: true, force: true });

      res.json({
        success: true,
        message: 'Git 仓库克隆成功！已在 LakeRiders_Dev 中准备就绪。',
      });
    } catch (err: any) {
      res.status(500).json({ error: `Git 克隆失败: ${err.message}` });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`LakeRiders Server running on http://0.0.0.0:${PORT} with WebSocket multiplayer on /ws`);
  });
}

startServer();
