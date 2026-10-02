/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileArchive,
  CheckCircle2,
  AlertCircle,
  GitBranch,
  FolderOpen,
  FileText,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Gamepad2,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Zap,
  Play,
  Maximize2,
  Minimize2,
  Download,
  Key,
  GitCommit,
  ArrowUpRight,
  Share2
} from 'lucide-react';

interface ProjectStatus {
  hasDev: boolean;
  hasOrig: boolean;
  allFilesCount: number;
  docFiles: string[];
  commitSha?: string;
  version?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'game' | 'roadmap' | 'tests' | 'files'>('game');
  const [status, setStatus] = useState<ProjectStatus>({
    hasDev: false,
    hasOrig: false,
    allFilesCount: 0,
    docFiles: [],
    commitSha: 'ad1b1ea',
  });
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  // File Upload states
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [gitUrl, setGitUrl] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Git Push states
  const [pushRepoUrl, setPushRepoUrl] = useState('https://github.com/ganghuxie/lakeriders-web-demo.git');
  const [pushToken, setPushToken] = useState('');
  const [pushBranch, setPushBranch] = useState('main');
  const [isPushing, setIsPushing] = useState(false);
  const [pushSuccess, setPushSuccess] = useState<string | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  // Test Runner states
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [testPassed, setTestPassed] = useState<boolean | null>(null);

  // Bundle Builder states
  const [isBuildingBundle, setIsBuildingBundle] = useState(false);
  const [bundleStatus, setBundleStatus] = useState<string | null>(null);
  const [gameFrameKey, setGameFrameKey] = useState(1);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMaximized) {
        setIsMaximized(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMaximized]);

  const fetchStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.hasDev && activeTab === 'files') {
          setActiveTab('game');
        }
      }
    } catch (e) {
      console.error('获取状态失败', e);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRunTests = async () => {
    try {
      setIsRunningTests(true);
      setTestOutput('正在执行 node --test LakeRiders_Dev/tests/*.test.mjs ...\n');
      const res = await fetch('/api/run-tests', { method: 'POST' });
      const data = await res.json();
      setTestOutput(data.output);
      setTestPassed(data.success);
    } catch (err: any) {
      setTestOutput('测试执行异常: ' + err.message);
      setTestPassed(false);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleBuildBundle = async () => {
    try {
      setIsBuildingBundle(true);
      setBundleStatus('正在打包资源并生成独立部署镜像 (DeployBundle)...');
      const res = await fetch('/api/build-bundle', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setBundleStatus('打包完成！DeployBundle 已更新，包含全部最新内嵌资源及独立单文件 server.mjs');
      } else {
        setBundleStatus('打包失败: ' + (data.error || '未知错误'));
      }
    } catch (err: any) {
      setBundleStatus('构建异常: ' + err.message);
    } finally {
      setIsBuildingBundle(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setUploadError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadError(null);
    }
  };

  const handleUploadZip = async () => {
    if (!file) return;
    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadSuccess(null);
      const arrayBuffer = await file.arrayBuffer();
      const res = await fetch('/api/upload-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: arrayBuffer,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '上传或解压失败');
      setUploadSuccess(`成功导入！已在 LakeRiders_Dev 中准备就绪（共 ${data.fileCount} 个文件），原版已备份在 LakeRiders_Original。`);
      setFile(null);
      await fetchStatus();
      setActiveTab('game');
    } catch (err: any) {
      setUploadError(err.message || '上传处理异常');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGitClone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gitUrl.trim()) return;
    try {
      setIsCloning(true);
      setUploadError(null);
      setUploadSuccess(null);
      const res = await fetch('/api/git-clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: gitUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Git 克隆失败');
      setUploadSuccess('Git 仓库拉取成功！已在新目录 LakeRiders_Dev 就绪。');
      setGitUrl('');
      await fetchStatus();
      setActiveTab('game');
    } catch (err: any) {
      setUploadError(err.message || 'Git 拉取异常');
    } finally {
      setIsCloning(false);
    }
  };

  const handleGitPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushRepoUrl.trim()) return;
    try {
      setIsPushing(true);
      setPushError(null);
      setPushSuccess(null);
      const res = await fetch('/api/git-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: pushRepoUrl.trim(),
          token: pushToken.trim() || undefined,
          branch: pushBranch.trim() || 'main',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '推送到 GitHub 失败');
      setPushSuccess(data.message || '代码成功推送到 GitHub 仓库！');
      await fetchStatus();
    } catch (err: any) {
      setPushError(err.message || '推送到 GitHub 出现异常');
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">LakeRiders · 暴力骑行</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Phase 12 玩家头像系统已就绪
              </span>
            </div>
            <p className="text-xs text-slate-400">环湖单机 & 联机原型 · 自定义头像与档案系统</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            id="tab-game"
            onClick={() => setActiveTab('game')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'game'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            实机试玩
          </button>
          <button
            id="tab-roadmap"
            onClick={() => setActiveTab('roadmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'roadmap'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            开发节奏与路线
          </button>
          <button
            id="tab-tests"
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'tests'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            测试与构建
          </button>
          <button
            id="tab-files"
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'files'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            GitHub 同步与归档
          </button>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/game/index.html"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-400 bg-sky-950/50 hover:bg-sky-900/50 rounded-lg border border-sky-800/60 transition"
            title="新标签页全屏畅玩"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            新窗口独立全屏
          </a>
          <button
            onClick={fetchStatus}
            disabled={isLoadingStatus}
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg border border-slate-700 transition"
            title="刷新状态"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* TAB 1: Real Game Embedded */}
        {activeTab === 'game' && (
          <div className="space-y-4">
            {/* Game Canvas Frame */}
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-semibold text-slate-200">LakeRiders Phase 09B / 10 运行中</span>
                  <span className="text-slate-500">|</span>
                  <span>可直接在下方点击激活画布键盘控制</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline text-slate-400 text-[11px]">
                    按 <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">W A S D</kbd> 骑行 · <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">V</kbd> 棍棒 · <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">B</kbd> 手枪 · <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">F</kbd> 道具
                  </span>
                  <button
                    onClick={() => setGameFrameKey(k => k + 1)}
                    className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition text-xs"
                    title="重新加载游戏画面"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    刷新画面
                  </button>
                  <button
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="flex items-center gap-1 text-sky-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded transition text-xs font-medium"
                    title={isMaximized ? "退出最大化 (按 ESC)" : "进入沉浸网页全屏"}
                  >
                    {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    {isMaximized ? "退出全屏" : "沉浸全屏"}
                  </button>
                  <a
                    href="/game/index.html"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-slate-400 hover:text-sky-300 px-2 py-1 text-xs"
                    title="新窗口全屏独立运行"
                  >
                    新标签打开
                  </a>
                </div>
              </div>

              {/* Iframe with Game */}
              <div className={isMaximized ? "fixed inset-0 z-50 bg-black flex flex-col" : "relative w-full h-[720px] bg-black"}>
                {isMaximized && (
                  <div className="bg-slate-900/90 backdrop-blur px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs z-10">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-white font-medium">LakeRiders 赛里木湖骑行 · 沉浸全屏模式 (按 ESC 退出)</span>
                    </div>
                    <button
                      onClick={() => setIsMaximized(false)}
                      className="flex items-center gap-1 bg-rose-600/80 hover:bg-rose-500 text-white px-3 py-1 rounded transition text-xs font-semibold"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                      退出全屏
                    </button>
                  </div>
                )}
                <iframe
                  key={gameFrameKey}
                  id="game-frame"
                  src={`/game/index.html?v=${gameFrameKey}`}
                  title="LakeRiders Game"
                  className={isMaximized ? "w-full flex-1 border-0" : "w-full h-full border-0"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            </div>

            {/* Quick Key Reference Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                <div className="text-sky-400 font-semibold mb-1">移动与刹车</div>
                <p className="text-slate-400 leading-relaxed">
                  <kbd className="px-1 bg-slate-800 rounded font-mono">W</kbd> 加速 · <kbd className="px-1 bg-slate-800 rounded font-mono">S</kbd> 减速<br/>
                  <kbd className="px-1 bg-slate-800 rounded font-mono">A</kbd> <kbd className="px-1 bg-slate-800 rounded font-mono">D</kbd> 压弯 · <b>双击 S</b> 急刹
                </p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                <div className="text-amber-400 font-semibold mb-1">新增近战重击</div>
                <p className="text-slate-400 leading-relaxed">
                  <kbd className="px-1 bg-slate-800 rounded font-mono">V</kbd> <b>棍棒 (Bat)</b><br/>
                  伤害 20 · 冷却 5s · 击退侧翼对手
                </p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                <div className="text-rose-400 font-semibold mb-1">新增远程射击</div>
                <p className="text-slate-400 leading-relaxed">
                  <kbd className="px-1 bg-slate-800 rounded font-mono">B</kbd> <b>手枪 (Pistol)</b><br/>
                  伤害 12 · 射程 16m · 附带减速 1.8s
                </p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                <div className="text-purple-400 font-semibold mb-1">趣味道具与锁定</div>
                <p className="text-slate-400 leading-relaxed">
                  <kbd className="px-1 bg-slate-800 rounded font-mono">F</kbd> 释放手榴弹/渔网/粑粑<br/>
                  <kbd className="px-1 bg-slate-800 rounded font-mono">R</kbd> 切换瞄准锁定的对手
                </p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                <div className="text-emerald-400 font-semibold mb-1">毒气区 & 传送门</div>
                <p className="text-slate-400 leading-relaxed">
                  1780m 绿色毒气吸入会咳嗽掉能量<br/>
                  1350m 蓝紫色传送门可跳至 1480m
                </p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                <div className="text-teal-400 font-semibold mb-1">能量与快捷互动</div>
                <p className="text-slate-400 leading-relaxed">
                  <kbd className="px-1 bg-slate-800 rounded font-mono">Space</kbd> 使用能量包恢复 30<br/>
                  <kbd className="px-1 bg-slate-800 rounded font-mono">1 2 3 4</kbd> 快捷表情气泡
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Development Roadmap */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">开发节奏与当前里程碑</h2>
                  <p className="text-xs text-slate-400">已完整接力 Codex，按阶段标准完成全部功能与自动化验证</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                  Phase 12 玩家头像与档案系统已落地
                </span>
              </div>

              {/* Phases Timeline */}
              <div className="space-y-4">
                {/* Phase 12 Avatar & Profile */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-emerald-500/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-sm text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Phase 12 · 玩家档案、个性化头像上传系统与赛后完赛证书（已完成落地）</span>
                    </div>
                    <span className="text-xs text-emerald-300 font-mono bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800">44 / 44 项全测通过</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 pl-6 list-disc">
                    <li><b>6 款高对比度矢量预设手绘头像</b>：赛里木天鹅、雪山花豹、草原雄鹰、冷水红鳟、赛湖破风手、天山雪狐，清晰鲜艳且支持快速一键选用。</li>
                    <li><b>本地头像图片自定义上传与智能正方形居中裁剪</b>：支持本地相册图片上传、拖拽与智能 Canvas 居中裁切至 256×256 WebP/PNG DataURL，存储于 localStorage 长期记忆。</li>
                    <li><b>3D 赛道动态头像标签看板</b>：重构 `riderLabel` 动态生成 3D CanvasTexture，玩家头顶名牌展示个人头像，4 位 AI 对手亦拥有专属动物/车手视觉徽章。</li>
                    <li><b>HUD 排行榜与领奖台动态头像渲染</b>：实时排名榜单与赛后 1/2/3 名领奖台显示圆框头像；自动生成赛里木湖完赛认证证书并提供一键 PNG 下载。</li>
                  </ul>
                </div>

                {/* Phase 10 Progress */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-sm text-sky-300">
                      <Zap className="w-4 h-4 text-sky-400" />
                      <span>Phase 10 · 赛里木湖实景地貌、车手专精与原生音效引擎（已完成）</span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">已归档</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 pl-6 list-disc">
                    <li><b>车手个性化天赋专精系统</b>：支持「均衡型」、「冲刺手 (+3 km/h 极速)」、「格斗家 (近战冷却降低 20%)」、「战术家 (初始随身携带 3 个能量包)」，可在开局面板直接切换体验。</li>
                    <li><b>赛里木湖自然地貌全景 3D 渲染</b>：环湖巍峨雪山群分层积雪、点将台石砌古城楼、月亮湾观景木栈台、金花紫卉野生花海簇、高山云杉针叶林与白云天幕。</li>
                    <li><b>赛里木湖六大标志性地标</b>：月亮湾、三台古驿、金花紫卉、点将台、亲水滩、环湖总起点，HUD 实时显示当前逼近的著名景点与距离。</li>
                    <li><b>程序化 Web Audio 原生音效引擎</b>：纯浏览器零外部资源驱动，包括链条与高速风阻声、挥棒破风与重击、枪声回响、手榴弹爆炸、粑粑糊脸水花、渔网甩出声、毒气咳嗽声、传送门空间扭曲声与终点号角。</li>
                    <li><b>终点胜利礼炮粒子系统 (Victory Confetti)</b>：冲线触发全彩纸屑抛洒飞舞特效。</li>
                  </ul>
                </div>

                {/* Phase 09B */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-sm text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Phase 09B · 趣味道具混战 & 新武器机制（已完成验收）</span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">已归档测试</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 pl-6 list-disc">
                    <li><b>新增常驻近战武器【棍棒 (Bat)】</b>：伤害 20、冷却 5s、大幅侧翼击退效果；3D 实体手持挥动建模与动作绑定。</li>
                    <li><b>新增远程攻击武器【手枪 (Pistol)】</b>：伤害 12、冷却 8s、16 米射程、命中后给对手施加 1.8 秒减速限速状态；飞行子弹弹道物理模拟。</li>
                    <li><b>新战术地形【1780m 绿色毒气区】</b>：吸入引发剧烈咳嗽、能量扣除、视野摇晃减速；动态漂浮毒气粒子群。</li>
                    <li><b>新赛道机关【1350m 传送门捷径】</b>：道路外侧双向双色传送门，冲入后直接跨越至 1480m，附带传送闪光特效与冷却锁。</li>
                    <li><b>地面粑粑陷阱 (Track Poop)</b>：路面实物障碍踩中即糊脸减速，支持 AI 避让与人机互动。</li>
                  </ul>
                </div>

                {/* Earlier Phases Reference */}
                <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
                  <div className="font-semibold text-slate-300 mb-1">历史阶段基础 (Phase 01 – 09A)</div>
                  <span>环湖 3000m 闭合三维赛道、加速带与减速网格、冲坡腾空滑行、4 档自主性格 AI、能量包补给、基础拳脚格斗、单人 5 车同场对决及公网房间联机已完全正常运作。</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Automated Tests & Build Bundle */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Test Runner Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>自动化测试套件 (54 个单元测试)</span>
                  </div>
                  {testPassed !== null && (
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        testPassed
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {testPassed ? '全部通过 ✓' : '存在失败项 ✗'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  涵盖物理模拟、赛道采样、AI 决策、新武器冷却与射程（棍棒/手枪）、毒气反应与传送门捷径、联机状态同步及断线重连。
                </p>
                <button
                  id="btn-run-tests"
                  onClick={handleRunTests}
                  disabled={isRunningTests}
                  className="w-full py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isRunningTests ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      测试执行中...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      运行完整单元测试集
                    </>
                  )}
                </button>
              </div>

              {/* Build Deploy Bundle Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <FileArchive className="w-5 h-5 text-sky-400" />
                    <span>独立部署包构建 (DeployBundle)</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  运行 <code className="text-sky-300">tools/build-deploy-bundle.mjs</code>，将全部前台静态资产（Three.js、赛道数据、音效、脚本）转为 Base64 嵌入单个轻量 Node 服务器，随时一键部署或导出。
                </p>
                <button
                  id="btn-build-bundle"
                  onClick={handleBuildBundle}
                  disabled={isBuildingBundle}
                  className="w-full py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white transition shadow-md shadow-sky-600/20 disabled:opacity-50"
                >
                  {isBuildingBundle ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      正在打包资源...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      一键构建最新 DeployBundle
                    </>
                  )}
                </button>
                {bundleStatus && (
                  <p className="text-xs text-sky-300 bg-sky-950/50 p-2.5 rounded-lg border border-sky-900/50">
                    {bundleStatus}
                  </p>
                )}
              </div>
            </div>

            {/* Test Console Output */}
            {testOutput && (
              <div className="bg-black/90 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-300 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-slate-400">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>测试执行控制台输出</span>
                  </div>
                  <button
                    onClick={() => setTestOutput(null)}
                    className="text-slate-500 hover:text-slate-300 text-[11px]"
                  >
                    清空输出
                  </button>
                </div>
                <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {testOutput}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Files, GitHub Sync, and Bundle Export */}
        {activeTab === 'files' && (
          <div className="space-y-6">
            {/* Version & Codex Testing Banner */}
            <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900 to-sky-950/70 border border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                    <GitCommit className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      最新开发版本已本地提交 · 准备交付 Codex 测试
                      <span className="px-2 py-0.5 text-[11px] font-mono font-medium rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        commit {status.commitSha || 'ad1b1ea'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      分支: <code className="text-indigo-300 font-mono">main</code> · 包含所有最新物理、UI与音频更新
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="/api/download-zip"
                    download="LakeRiders-latest.zip"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 rounded-xl border border-emerald-500/40 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    下载最新 ZIP 包
                  </a>
                  <a
                    href="/api/download-bundle"
                    download="LakeRiders.bundle"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-300 bg-sky-950/60 hover:bg-sky-900/60 rounded-xl border border-sky-500/40 transition"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    下载 Git Bundle 归档
                  </a>
                </div>
              </div>

              {/* Updates summary list */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 space-y-1">
                  <div className="font-semibold text-sky-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-sky-400" />
                    <span>碰撞摔车机制重构</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    ≥80km/h 撞击障碍摔车；&lt;80km/h 碰护栏或障碍震屏并平滑减速，绝不摔车。
                  </p>
                </div>
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 space-y-1">
                  <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span>全方位退出游戏入口</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    HUD 顶栏退出按钮、ESC 暂停菜单一键退出、以及结算页平稳返回大厅。
                  </p>
                </div>
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 space-y-1">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>大厅背景音乐自动开播</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    隐藏用户 MP3 导入，返回大厅默认随机开播并显示歌曲名，支持暂停/切歌。
                  </p>
                </div>
              </div>
            </div>

            {/* Grid of Git & Sync tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Method 1: Push to GitHub */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                    <Share2 className="w-4 h-4" />
                    <span>推送到 GitHub 远程仓库 (Push)</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    输入你的 GitHub 仓库地址与访问令牌（PAT），一键将本地最新开发分支代码推送到远程仓库：
                  </p>
                </div>

                <form onSubmit={handleGitPush} className="space-y-3.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-slate-400" />
                        GitHub 仓库 URL
                      </label>
                      <input
                        type="text"
                        value={pushRepoUrl}
                        onChange={(e) => setPushRepoUrl(e.target.value)}
                        placeholder="https://github.com/username/LakeRiders.git"
                        className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-slate-400" />
                        Personal Access Token (PAT 密钥)
                      </label>
                      <input
                        type="password"
                        value={pushToken}
                        onChange={(e) => setPushToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (具有 repo 权限)"
                        className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono transition"
                      />
                      <p className="text-[11px] text-slate-500">仅用于本次推送鉴权，绝不保存或写入公开日志</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                        目标分支 (Branch)
                      </label>
                      <input
                        type="text"
                        value={pushBranch}
                        onChange={(e) => setPushBranch(e.target.value)}
                        placeholder="main"
                        className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!pushRepoUrl.trim() || isPushing}
                    className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition ${
                      !pushRepoUrl.trim() || isPushing
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                    }`}
                  >
                    {isPushing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        正在推送到远程 GitHub 仓库...
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        立即推送到 GitHub
                      </>
                    )}
                  </button>
                </form>

                {pushSuccess && (
                  <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3.5 flex items-center gap-2.5 text-emerald-300 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{pushSuccess}</span>
                  </div>
                )}

                {pushError && (
                  <div className="bg-rose-950/60 border border-rose-500/40 rounded-xl p-3.5 flex items-center gap-2.5 text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{pushError}</span>
                  </div>
                )}
              </div>

              {/* Method 2: Direct Zip & Bundle Export */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    <Download className="w-4 h-4" />
                    <span>导出工程文件包 (供 Codex 直接获取)</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    若无需联网推送，可通过下载或 cURL 直接提取完整开发目录与测试套件：
                  </p>
                </div>

                <div className="space-y-3 flex-1 flex flex-col justify-center">
                  <a
                    href="/api/download-zip"
                    download="LakeRiders-latest.zip"
                    className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-850 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300 flex items-center justify-between text-xs transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileArchive className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <div className="font-semibold text-slate-200">LakeRiders-latest.zip</div>
                        <div className="text-[11px] text-slate-400">完整源代码与静态素材压缩包</div>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-emerald-400" />
                  </a>

                  <a
                    href="/api/download-bundle"
                    download="LakeRiders.bundle"
                    className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-850 border border-sky-500/30 hover:border-sky-500/60 text-sky-300 flex items-center justify-between text-xs transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <GitBranch className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <div className="font-semibold text-slate-200">LakeRiders.bundle</div>
                        <div className="text-[11px] text-slate-400">含全部 Git 分支与历史提交的原生归档</div>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-sky-400" />
                  </a>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1.5">
                    <span className="text-[11px] font-medium text-slate-400">Codex / 命令行快速拉取：</span>
                    <pre className="text-[11px] text-sky-300 font-mono bg-slate-900 px-2 py-1.5 rounded overflow-x-auto select-all">
                      curl -O {window.location.origin}/api/download-zip
                    </pre>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>文件总数: {status.allFilesCount || 75} 个</span>
                  <span className="text-emerald-400">已包含 Phase 09B-13 全套单测</span>
                </div>
              </div>

              {/* Method 3: Git Clone (Pull) */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
                    <GitBranch className="w-4 h-4" />
                    <span>从远程 Git 仓库拉取 (Clone / Pull)</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    从 GitHub 或 Gitee 拉取指定仓库分支并载入工作区：
                  </p>
                </div>

                <form onSubmit={handleGitClone} className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-slate-400" />
                      Git 仓库 URL
                    </label>
                    <input
                      type="text"
                      value={gitUrl}
                      onChange={(e) => setGitUrl(e.target.value)}
                      placeholder="https://github.com/username/LakeRiders.git"
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!gitUrl.trim() || isCloning}
                    className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition ${
                      !gitUrl.trim() || isCloning
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        : 'bg-sky-600 hover:bg-sky-500 text-white'
                    }`}
                  >
                    {isCloning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        正在克隆远程仓库...
                      </>
                    ) : (
                      <>
                        <GitBranch className="w-4 h-4" />
                        拉取远程仓库代码
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Method 4: Drop/Upload Zip */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
                    <Upload className="w-4 h-4 text-sky-400" />
                    <span>上传或重新覆盖 .zip 压缩包</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    上传本地工程压缩包，自动解压并在工作区生效：
                  </p>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                    isDragging
                      ? 'border-sky-400 bg-sky-500/10'
                      : file
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip,.rar,.tar,.gz"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      file ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {file ? <FileArchive className="w-5 h-5" /> : <Upload className="w-5 h-5 text-slate-400" />}
                  </div>

                  {file ? (
                    <div>
                      <p className="text-xs font-medium text-emerald-300 break-all">{file.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-medium text-slate-300">
                        拖入或 <span className="text-sky-400 underline">点击上传</span> 压缩包
                      </p>
                    </div>
                  )}
                </div>

                <button
                  disabled={!file || isUploading}
                  onClick={handleUploadZip}
                  className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition ${
                    !file || isUploading
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-sky-600 hover:bg-sky-500 text-white'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      正在解压并创建工程副本...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      上传并解压覆盖
                    </>
                  )}
                </button>
              </div>
            </div>

            {uploadSuccess && (
              <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-4 flex items-center gap-3 text-emerald-300 text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {uploadError && (
              <div className="bg-rose-950/60 border border-rose-500/40 rounded-xl p-4 flex items-center gap-3 text-rose-300 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
