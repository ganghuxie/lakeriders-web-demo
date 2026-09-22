// LakeRiders Phase 12: Player Profile & Custom Avatar System

const STORAGE_KEY = 'lake_riders_player_profile';

// Clean inline vector SVG avatars for instant crisp rendering without external assets
export const PRESET_AVATARS = [
  {
    id: 'rider-blue',
    name: '赛湖破风手',
    title: '赛湖破风之影',
    color: '#0284c7',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rb-bg" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#0369a1"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#rb-bg)" stroke="#bae6fd" stroke-width="3"/>
      <!-- Mountain outline behind -->
      <path d="M12 78 L35 48 L48 64 L70 36 L88 78 Z" fill="#0c4a6e" opacity="0.5"/>
      <!-- Rider Helmet -->
      <ellipse cx="50" cy="42" rx="24" ry="18" fill="#0284c7" stroke="#e0f2fe" stroke-width="2"/>
      <path d="M26 42 Q50 30 74 42 Q68 56 50 56 Q32 56 26 42 Z" fill="#0369a1"/>
      <!-- Visor -->
      <path d="M30 44 Q50 36 70 44 Q66 50 50 50 Q34 50 30 44 Z" fill="#facc15" stroke="#fef08a" stroke-width="1.5"/>
      <!-- Chin Strap & Collar -->
      <path d="M38 56 L42 66 L58 66 L62 56" fill="none" stroke="#e0f2fe" stroke-width="2"/>
      <!-- Jersey Shoulders -->
      <path d="M22 88 C25 68 75 68 78 88 Z" fill="#0284c7" stroke="#38bdf8" stroke-width="2"/>
      <path d="M45 72 L55 72 L50 88 Z" fill="#38bdf8"/>
    </svg>`
  },
  {
    id: 'rider-flame',
    name: '烈焰冲刺手',
    title: '高原红色彗星',
    color: '#ea580c',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rf-bg" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#fb923c"/>
          <stop offset="100%" stop-color="#9a3412"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#rf-bg)" stroke="#fed7aa" stroke-width="3"/>
      <!-- Flames -->
      <path d="M28 80 Q36 50 44 65 Q50 35 58 60 Q66 45 72 80 Z" fill="#f97316" opacity="0.6"/>
      <!-- Aero Helmet -->
      <path d="M24 45 C24 24 76 24 76 45 C76 56 64 60 50 60 C36 60 24 56 24 45 Z" fill="#ea580c" stroke="#ffedd5" stroke-width="2"/>
      <path d="M30 44 Q50 34 70 44 L66 52 Q50 46 34 52 Z" fill="#18181b" stroke="#f97316" stroke-width="1.5"/>
      <!-- Lightning bolt accent -->
      <polygon points="50,22 44,34 52,34 46,46 56,32 48,32" fill="#facc15"/>
      <!-- Jersey -->
      <path d="M20 90 C24 68 76 68 80 90 Z" fill="#c2410c" stroke="#fb923c" stroke-width="2"/>
      <polygon points="46,70 54,70 50,86" fill="#facc15"/>
    </svg>`
  },
  {
    id: 'snow-leopard',
    name: '天山雪豹',
    title: '雪峰幽灵骑士',
    color: '#64748b',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sl-bg" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#cbd5e1"/>
          <stop offset="100%" stop-color="#334155"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#sl-bg)" stroke="#f8fafc" stroke-width="3"/>
      <!-- Leopard ears -->
      <polygon points="26,38 34,20 44,32" fill="#94a3b8" stroke="#334155" stroke-width="2"/>
      <polygon points="30,34 35,24 41,31" fill="#f472b6"/>
      <polygon points="74,38 66,20 56,32" fill="#94a3b8" stroke="#334155" stroke-width="2"/>
      <polygon points="70,34 65,24 59,31" fill="#f472b6"/>
      <!-- Head -->
      <circle cx="50" cy="46" r="22" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
      <!-- Spots -->
      <circle cx="38" cy="38" r="2.5" fill="#334155"/>
      <circle cx="62" cy="38" r="2.5" fill="#334155"/>
      <circle cx="50" cy="32" r="3" fill="#334155"/>
      <!-- Goggles -->
      <rect x="30" y="40" width="18" height="12" rx="4" fill="#38bdf8" stroke="#0f172a" stroke-width="2"/>
      <rect x="52" y="40" width="18" height="12" rx="4" fill="#38bdf8" stroke="#0f172a" stroke-width="2"/>
      <line x1="48" y1="46" x2="52" y2="46" stroke="#0f172a" stroke-width="2"/>
      <!-- Nose & mouth -->
      <polygon points="47,56 53,56 50,60" fill="#f472b6"/>
      <!-- Winter scarf -->
      <path d="M22 88 C26 66 74 66 78 88 Z" fill="#475569" stroke="#94a3b8" stroke-width="2"/>
      <rect x="36" y="66" width="28" height="10" rx="3" fill="#0284c7"/>
    </svg>`
  },
  {
    id: 'tian-eagle',
    name: '天山雄鹰',
    title: '俯冲破风天鹰',
    color: '#059669',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="te-bg" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#34d399"/>
          <stop offset="100%" stop-color="#065f46"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#te-bg)" stroke="#a7f3d0" stroke-width="3"/>
      <!-- Feathers / Wings background -->
      <path d="M16 60 Q30 35 45 48 Q50 30 55 48 Q70 35 84 60 Z" fill="#047857" opacity="0.7"/>
      <!-- Eagle Head / Mask -->
      <ellipse cx="50" cy="44" rx="20" ry="22" fill="#f8fafc" stroke="#1e293b" stroke-width="2"/>
      <!-- Fierce Eyes -->
      <polygon points="36,40 46,42 42,46" fill="#f59e0b"/>
      <polygon points="64,40 54,42 58,46" fill="#f59e0b"/>
      <circle cx="41" cy="42" r="2" fill="#000"/>
      <circle cx="59" cy="42" r="2" fill="#000"/>
      <!-- Golden Beak -->
      <polygon points="44,48 56,48 50,66" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>
      <!-- Racing Jersey -->
      <path d="M22 90 C26 70 74 70 78 90 Z" fill="#047857" stroke="#10b981" stroke-width="2"/>
      <polygon points="46,72 54,72 50,88" fill="#facc15"/>
    </svg>`
  },
  {
    id: 'champion-gold',
    name: '金冠车神',
    title: '环湖卫冕冠军',
    color: '#d97706',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cg-bg" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#fde047"/>
          <stop offset="100%" stop-color="#854d0e"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#cg-bg)" stroke="#fef08a" stroke-width="3"/>
      <!-- Crown -->
      <polygon points="32,26 40,36 50,22 60,36 68,26 66,42 34,42" fill="#f59e0b" stroke="#78350f" stroke-width="1.5"/>
      <circle cx="50" cy="22" r="3" fill="#ef4444"/>
      <circle cx="32" cy="26" r="2.5" fill="#38bdf8"/>
      <circle cx="68" cy="26" r="2.5" fill="#38bdf8"/>
      <!-- Face & Gold Sunglasses -->
      <circle cx="50" cy="48" r="19" fill="#fed7aa"/>
      <rect x="33" y="44" width="15" height="9" rx="2" fill="#18181b" stroke="#fbbf24" stroke-width="1.5"/>
      <rect x="52" y="44" width="15" height="9" rx="2" fill="#18181b" stroke="#fbbf24" stroke-width="1.5"/>
      <line x1="48" y1="48" x2="52" y2="48" stroke="#fbbf24" stroke-width="2"/>
      <path d="M44 58 Q50 63 56 58" fill="none" stroke="#78350f" stroke-width="2" stroke-linecap="round"/>
      <!-- Gold Champion Jersey -->
      <path d="M22 90 C26 68 74 68 78 90 Z" fill="#d97706" stroke="#fde047" stroke-width="2"/>
      <!-- Rainbow World Champion Stripes -->
      <line x1="44" y1="72" x2="56" y2="72" stroke="#3b82f6" stroke-width="2"/>
      <line x1="44" y1="75" x2="56" y2="75" stroke="#ef4444" stroke-width="2"/>
      <line x1="44" y1="78" x2="56" y2="78" stroke="#10b981" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'sayram-flower',
    name: '赛湖花海',
    title: '金花紫卉领航员',
    color: '#9333ea',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sf-bg" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#e879f9"/>
          <stop offset="100%" stop-color="#6b21a8"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#sf-bg)" stroke="#f5d0fe" stroke-width="3"/>
      <!-- Flower Petals in hair/helmet -->
      <circle cx="36" cy="30" r="6" fill="#facc15" opacity="0.8"/>
      <circle cx="64" cy="30" r="6" fill="#c084fc" opacity="0.8"/>
      <circle cx="50" cy="24" r="7" fill="#f472b6" opacity="0.9"/>
      <!-- Violet Racing Helmet -->
      <path d="M26 44 C26 26 74 26 74 44 C74 58 64 62 50 62 C36 62 26 58 26 44 Z" fill="#9333ea" stroke="#f0abfc" stroke-width="2"/>
      <!-- Aerodynamic Pink Visor -->
      <path d="M32 44 Q50 36 68 44 Q64 52 50 52 Q36 52 32 44 Z" fill="#f472b6" stroke="#fdf2f8" stroke-width="1.5"/>
      <!-- Jersey with floral accent -->
      <path d="M22 90 C26 68 74 68 78 90 Z" fill="#7e22ce" stroke="#d8b4fe" stroke-width="2"/>
      <circle cx="50" cy="78" r="4" fill="#facc15"/>
    </svg>`
  }
];

// Pre-generated vector avatars for standard AI competitors
export const BOT_AVATARS = {
  'bot-01': {
    name: 'AI·赤狐',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#ea580c" stroke="#fed7aa" stroke-width="3"/>
      <!-- Fox Ears -->
      <polygon points="24,36 32,16 46,28" fill="#c2410c" stroke="#18181b" stroke-width="1.5"/>
      <polygon points="28,32 34,22 42,28" fill="#ffedd5"/>
      <polygon points="76,36 68,16 54,28" fill="#c2410c" stroke="#18181b" stroke-width="1.5"/>
      <polygon points="72,32 66,22 58,28" fill="#ffedd5"/>
      <!-- Head -->
      <polygon points="26,44 74,44 50,74" fill="#f97316"/>
      <polygon points="34,44 50,68 26,44" fill="#ffffff"/>
      <polygon points="66,44 50,68 74,44" fill="#ffffff"/>
      <!-- Eyes & Nose -->
      <polygon points="38,46 44,48 40,52" fill="#18181b"/>
      <polygon points="62,46 56,48 60,52" fill="#18181b"/>
      <circle cx="50" cy="70" r="4" fill="#18181b"/>
      <!-- Jersey -->
      <path d="M22 92 C26 76 74 76 78 92 Z" fill="#9a3412" stroke="#ea580c" stroke-width="2"/>
    </svg>`
  },
  'bot-02': {
    name: 'AI·山雀',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#eab308" stroke="#fef08a" stroke-width="3"/>
      <!-- Tit Bird Body -->
      <circle cx="50" cy="46" r="22" fill="#fef08a" stroke="#713f12" stroke-width="2"/>
      <ellipse cx="50" cy="38" rx="20" ry="14" fill="#1e293b"/>
      <!-- White Cheeks -->
      <ellipse cx="38" cy="48" rx="7" ry="5" fill="#ffffff"/>
      <ellipse cx="62" cy="48" rx="7" ry="5" fill="#ffffff"/>
      <!-- Eyes -->
      <circle cx="42" cy="44" r="2.5" fill="#000"/>
      <circle cx="58" cy="44" r="2.5" fill="#000"/>
      <!-- Beak -->
      <polygon points="46,50 54,50 50,58" fill="#f97316"/>
      <!-- Jersey -->
      <path d="M24 92 C28 74 72 74 76 92 Z" fill="#ca8a04" stroke="#fde047" stroke-width="2"/>
    </svg>`
  },
  'bot-03': {
    name: 'AI·蓝鲸',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#0284c7" stroke="#bae6fd" stroke-width="3"/>
      <!-- Whale Body -->
      <ellipse cx="50" cy="46" rx="26" ry="18" fill="#38bdf8" stroke="#0369a1" stroke-width="2"/>
      <!-- Water Spout -->
      <path d="M50 28 Q44 14 38 18 M50 28 Q50 10 50 14 M50 28 Q56 14 62 18" stroke="#e0f2fe" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <!-- Belly Ridges -->
      <path d="M30 52 Q50 62 70 52" fill="none" stroke="#0284c7" stroke-width="2"/>
      <!-- Eye & Smile -->
      <circle cx="40" cy="44" r="2.5" fill="#0f172a"/>
      <path d="M36 50 Q46 54 54 48" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
      <!-- Jersey -->
      <path d="M22 92 C26 74 74 74 78 92 Z" fill="#0369a1" stroke="#38bdf8" stroke-width="2"/>
    </svg>`
  },
  'bot-04': {
    name: 'AI·青鹿',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#16a34a" stroke="#bbf7d0" stroke-width="3"/>
      <!-- Deer Antlers -->
      <path d="M36 34 L32 20 M32 24 L24 20 M32 28 L24 30" stroke="#713f12" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M64 34 L68 20 M68 24 L76 20 M68 28 L76 30" stroke="#713f12" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Deer Face -->
      <ellipse cx="50" cy="48" rx="20" ry="19" fill="#86efac" stroke="#15803d" stroke-width="2"/>
      <ellipse cx="50" cy="56" rx="12" ry="9" fill="#f0fdf4"/>
      <!-- Eyes & Nose -->
      <ellipse cx="40" cy="44" rx="3" ry="4" fill="#052e16"/>
      <ellipse cx="60" cy="44" rx="3" ry="4" fill="#052e16"/>
      <ellipse cx="50" cy="54" rx="3" ry="2" fill="#14532d"/>
      <!-- Jersey -->
      <path d="M22 92 C26 74 74 74 78 92 Z" fill="#15803d" stroke="#4ade80" stroke-width="2"/>
    </svg>`
  }
};

const svgUrlCache = new Map();
export function svgToDataUrl(svgString) {
  if (!svgString) return '';
  const cached = svgUrlCache.get(svgString);
  if (cached) return cached;
  let clean = svgString.trim().replace(/\s+/g, ' ');
  if (!clean.includes('width=')) {
    clean = clean.replace('<svg ', '<svg width="100" height="100" ');
  }
  let url;
  try {
    const b64 = typeof btoa !== 'undefined'
      ? btoa(unescape(encodeURIComponent(clean)))
      : Buffer.from(clean).toString('base64');
    url = 'data:image/svg+xml;base64,' + b64;
  } catch {
    url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(clean);
  }
  svgUrlCache.set(svgString, url);
  return url;
}

export function getDefaultProfile() {
  return {
    nickname: '赛湖车神',
    title: '赛湖破风之影',
    avatarType: 'preset', // 'preset' | 'custom'
    presetId: 'rider-blue',
    customDataUrl: null, // Base64 PNG/JPEG
  };
}

export function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultProfile();
    const parsed = JSON.parse(raw);
    return {
      nickname: (parsed.nickname || '赛湖车神').slice(0, 12),
      title: parsed.title || '赛湖破风之影',
      avatarType: parsed.avatarType === 'custom' && (parsed.customDataUrl || parsed.customAvatarUrl) ? 'custom' : 'preset',
      presetId: PRESET_AVATARS.some(p => p.id === parsed.presetId) ? parsed.presetId : 'rider-blue',
      customDataUrl: parsed.customDataUrl || parsed.customAvatarUrl || null,
      customAvatarUrl: parsed.customAvatarUrl || parsed.customDataUrl || null,
    };
  } catch {
    return getDefaultProfile();
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('Failed to save profile to localStorage:', err);
  }
}

export function getPlayerAvatarUrl(profile = null) {
  const p = profile || loadProfile();
  const customUrl = p.customDataUrl || p.customAvatarUrl;
  if (p.avatarType === 'custom' && customUrl) {
    return customUrl;
  }
  const preset = PRESET_AVATARS.find(item => item.id === p.presetId) || PRESET_AVATARS[0];
  return svgToDataUrl(preset.svg);
}

export function getRacerAvatarUrl(racerId, isPlayer = false, profile = null) {
  if (isPlayer || racerId === 'player') {
    return getPlayerAvatarUrl(profile);
  }
  const bot = BOT_AVATARS[racerId];
  if (bot) {
    return svgToDataUrl(bot.svg);
  }
  // Fallback random preset based on racerId
  const index = Math.abs(hashCode(String(racerId))) % PRESET_AVATARS.length;
  return svgToDataUrl(PRESET_AVATARS[index].svg);
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * Process a user-uploaded image file:
 * Automatically crops center square and scales to target size (160x160) for optimal quality and small storage.
 */
export function processUploadedImage(file, maxSize = 160) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('请选择有效的图片文件 (JPG, PNG, WebP)'));
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('图片解析失败，可能格式损坏'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = maxSize;
          canvas.height = maxSize;
          const ctx = canvas.getContext('2d');

          // Center crop math
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          // Draw cropped circular-ready image
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, maxSize, maxSize);

          // Return high quality JPEG or PNG dataUrl
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Generates an official high-resolution Victory Certificate / Passport snapshot
 * that prominently showcases the player's custom avatar, final statistics, and official Sayram seal!
 */
export function generateOfficialCertificate({
  playerName = '赛湖车神',
  avatarUrl,
  rank = 1,
  finishTimeStr = '03:45.2',
  finishTime = '03:45.2',
  topKph = 62.4,
  draftTime = 12.5,
  hits = 0,
  title = '赛湖破风之影'
}) {
  const time = finishTimeStr || finishTime;
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 500;
  const ctx = canvas.getContext('2d');

  function renderBase() {
    // Background Gradient (Alpine Lake Sky & Water)
    const bgGrad = ctx.createLinearGradient(0, 0, 800, 500);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.4, '#0c4a6e');
    bgGrad.addColorStop(1, '#082f49');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 500);

    // Decorative Gold Outer Frame
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#f59e0b';
    ctx.strokeRect(16, 16, 768, 468);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#d7ef83';
    ctx.strokeRect(24, 24, 752, 452);

    // Corner Ornaments
    ctx.fillStyle = '#f59e0b';
    for (const [cx, cy] of [[24, 24], [776, 24], [24, 476], [776, 476]]) {
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Top Header Banner
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d7ef83';
    ctx.font = 'bold 15px Segoe UI, sans-serif';
    ctx.fillText('TOUR OF LAKE SAYRAM · OFFICIAL RIDER CERTIFICATE', 400, 56);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Segoe UI, sans-serif';
    ctx.fillText('赛里木湖高原挑战赛 · 完赛荣誉档案', 400, 94);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px Segoe UI, sans-serif';
    ctx.fillText('“大西洋最后一滴眼泪” · 3000M 环湖高海拔全速竞技', 400, 118);

    // Divider Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(60, 134);
    ctx.lineTo(740, 134);
    ctx.stroke();

    // Default Avatar background circle on the Left
    const ax = 150, ay = 250, ar = 76;
    const avGrad = ctx.createRadialGradient(ax, ay - 20, 10, ax, ay, ar);
    avGrad.addColorStop(0, '#38bdf8');
    avGrad.addColorStop(1, '#0369a1');
    ctx.fillStyle = avGrad;
    ctx.beginPath();
    ctx.arc(ax, ay, ar, 0, Math.PI * 2);
    ctx.fill();

    // Rider silhouette/initial in avatar
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((playerName || '骑手').slice(0, 2), ax, ay + 12);

    // Avatar Ring Border
    ctx.lineWidth = 6;
    ctx.strokeStyle = rank === 1 ? '#f59e0b' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(ax, ay, ar + 3, 0, Math.PI * 2);
    ctx.stroke();

    // Rank Medal Tag under Avatar
    ctx.fillStyle = rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : rank === 3 ? '#b45309' : '#0284c7';
    roundRect(ctx, ax - 65, ay + ar + 10, 130, 32, 16);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(rank === 1 ? '🥇 冠军得主' : rank === 2 ? '🥈 亚军荣耀' : rank === 3 ? '🥉 季军得主' : `第 ${rank} 名 完赛`, ax, ay + ar + 32);

    // Right Side Information Grid
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Segoe UI, sans-serif';
    ctx.fillText(playerName, 270, 185);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px Segoe UI, sans-serif';
    ctx.fillText(`称号：${title}`, 270, 212);

    // Stats boxes
    drawStatBox(ctx, 270, 240, 210, 80, '🏁 完赛用时', time, '#d7ef83');
    drawStatBox(ctx, 500, 240, 210, 80, '🚀 极速峰值', `${Number(topKph).toFixed(1)} KM/H`, '#f59e0b');
    drawStatBox(ctx, 270, 335, 210, 80, '💨 尾流破风时长', `${Number(draftTime).toFixed(1)} 秒`, '#38bdf8');
    drawStatBox(ctx, 500, 335, 210, 80, '🎯 进攻命中次数', `${hits} 次`, '#a7f3d0');

    // Official Stamp in Red / Gold
    drawOfficialSeal(ctx, 700, 400);

    // Date stamp
    ctx.textAlign = 'right';
    ctx.fillStyle = '#64748b';
    ctx.font = '12px Segoe UI, sans-serif';
    const today = new Date().toISOString().split('T')[0];
    ctx.fillText(`认证日期：${today} · 赛里木湖管委会赛道纪律组`, 740, 462);
  }

  renderBase();

  // If avatarUrl is provided, load image and composite it
  if (avatarUrl) {
    const avatarImg = new Image();
    avatarImg.crossOrigin = 'anonymous';
    avatarImg.onload = () => {
      const ax = 150, ay = 250, ar = 76;
      ctx.save();
      ctx.beginPath();
      ctx.arc(ax, ay, ar, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatarImg, ax - ar, ay - ar, ar * 2, ar * 2);
      ctx.restore();

      // Avatar Ring Border
      ctx.lineWidth = 6;
      ctx.strokeStyle = rank === 1 ? '#f59e0b' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(ax, ay, ar + 3, 0, Math.PI * 2);
      ctx.stroke();

      const updatedUrl = canvas.toDataURL('image/png');
      const preview = document.querySelector('#cert-img-preview');
      const downloadBtn = document.querySelector('#download-cert-btn');
      if (preview) preview.src = updatedUrl;
      if (downloadBtn) downloadBtn.href = updatedUrl;
    };
    avatarImg.src = avatarUrl;
  }

  return canvas.toDataURL('image/png');
}

export const generateCertificateSnapshot = generateOfficialCertificate;

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawStatBox(ctx, x, y, w, h, label, value, color) {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px Segoe UI, sans-serif';
  ctx.fillText(label, x + 14, y + 26);

  ctx.fillStyle = color;
  ctx.font = 'bold 22px Segoe UI, sans-serif';
  ctx.fillText(value, x + 14, y + 60);
}

function drawOfficialSeal(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.18);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 42, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, 36, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 10px Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('赛里木湖环湖赛', 0, -14);
  ctx.font = 'bold 16px Segoe UI, sans-serif';
  ctx.fillText('官方认证', 0, 6);
  ctx.font = 'bold 9px Segoe UI, sans-serif';
  ctx.fillText('★ OFFICIAL ★', 0, 22);
  ctx.restore();
}

export function getCharacter3DAvatarConfig(profile, fallbackColor = '#0284c7') {
  const p = profile || getDefaultProfile();
  const avatarUrl = getPlayerAvatarUrl(p);
  const isCustom = p.avatarType === 'custom' && !!p.customAvatarUrl;
  const preset = PRESET_AVATARS.find(item => item.id === p.presetId) || PRESET_AVATARS[0];

  return {
    avatarUrl,
    isCustom,
    displayName: p.nickname || '赛湖骑手',
    displayTitle: p.title || '赛湖破风之影',
    themeColor: isCustom ? fallbackColor : (preset?.color || fallbackColor),
    bibNumber: '01',
    headGeomRadius: 0.32,
    headGeomDepth: 0.22,
    discRadius: 0.285
  };
}

export function getRiderBibInfo(profile, isPlayer = true, racerId = 'player') {
  if (isPlayer) {
    const p = profile || getDefaultProfile();
    return {
      racerId: 'player',
      number: '01',
      name: p.nickname || '赛湖骑手',
      avatarUrl: getPlayerAvatarUrl(p),
      isPlayer: true
    };
  }

  const bot = BOT_AVATARS[racerId] || { name: 'AI·骑手', color: '#ff8055' };
  const botNum = racerId.startsWith('bot-') ? racerId.slice(-2) : '02';
  return {
    racerId,
    number: botNum,
    name: bot.name,
    avatarUrl: getRacerAvatarUrl(racerId, false),
    isPlayer: false
  };
}

