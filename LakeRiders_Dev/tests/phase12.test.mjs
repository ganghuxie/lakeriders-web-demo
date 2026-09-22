import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRESET_AVATARS,
  BOT_AVATARS,
  getDefaultProfile,
  svgToDataUrl,
  getPlayerAvatarUrl,
  getRacerAvatarUrl,
  getCharacter3DAvatarConfig,
  getRiderBibInfo
} from '../BrowserDemo/profile.mjs';

test('Phase 12: preset avatars provide 6 distinct high-contrast vector riders', () => {
  assert.equal(PRESET_AVATARS.length, 6);
  const ids = PRESET_AVATARS.map(a => a.id);
  assert.ok(ids.includes('rider-blue'));
  assert.ok(ids.includes('rider-flame'));
  assert.ok(ids.includes('snow-leopard'));
  assert.ok(ids.includes('tian-eagle'));
  assert.ok(ids.includes('champion-gold'));
  assert.ok(ids.includes('sayram-flower'));

  for (const preset of PRESET_AVATARS) {
    assert.ok(preset.name.length > 0);
    assert.ok(preset.title.length > 0);
    assert.ok(preset.svg.startsWith('<svg'));
    assert.ok(preset.svg.includes('</svg>'));
  }
});

test('Phase 12: all 4 bot competitors have dedicated animal/racer avatar svgs', () => {
  assert.ok(BOT_AVATARS['bot-01']);
  assert.ok(BOT_AVATARS['bot-02']);
  assert.ok(BOT_AVATARS['bot-03']);
  assert.ok(BOT_AVATARS['bot-04']);

  assert.equal(BOT_AVATARS['bot-01'].name, 'AI·赤狐');
  assert.equal(BOT_AVATARS['bot-02'].name, 'AI·山雀');
  assert.equal(BOT_AVATARS['bot-03'].name, 'AI·蓝鲸');
  assert.equal(BOT_AVATARS['bot-04'].name, 'AI·青鹿');

  for (const botId of ['bot-01', 'bot-02', 'bot-03', 'bot-04']) {
    const bot = BOT_AVATARS[botId];
    assert.ok(bot.svg.includes('<circle'));
    assert.ok(bot.svg.includes('</svg>'));
    const url = getRacerAvatarUrl(botId);
    assert.ok(url.startsWith('data:image/svg+xml'));
  }
});

test('Phase 12: getPlayerAvatarUrl supports preset and custom uploaded avatar dataUrls', () => {
  const defaultProfile = getDefaultProfile();
  assert.equal(defaultProfile.avatarType, 'preset');
  assert.equal(defaultProfile.presetId, 'rider-blue');

  // Returns preset SVG data URL
  const presetUrl = getPlayerAvatarUrl(defaultProfile);
  assert.ok(presetUrl.startsWith('data:image/svg+xml'));

  // Custom base64 avatar takes precedence when avatarType is custom
  const customProfile = {
    nickname: '测试骑手',
    title: '赛湖飞车客',
    avatarType: 'custom',
    presetId: 'rider-flame',
    customDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  };

  const customUrl = getPlayerAvatarUrl(customProfile);
  assert.equal(customUrl, customProfile.customDataUrl);

  // Player racerId resolution
  assert.equal(getRacerAvatarUrl('player', true, customProfile), customProfile.customDataUrl);
});

test('Phase 12: getCharacter3DAvatarConfig generates valid 3D figurine head geometry and texture bindings', () => {
  const defaultProfile = getDefaultProfile();
  const config = getCharacter3DAvatarConfig(defaultProfile, '#0284c7');

  assert.equal(config.bibNumber, '01');
  assert.equal(config.displayName, defaultProfile.nickname);
  assert.equal(config.displayTitle, defaultProfile.title);
  assert.ok(config.avatarUrl.startsWith('data:image/svg+xml'));
  assert.equal(config.isCustom, false);
  assert.equal(config.headGeomRadius, 0.32);
  assert.equal(config.headGeomDepth, 0.22);
  assert.equal(config.discRadius, 0.285);

  // Test custom uploaded avatar config
  const customProfile = {
    nickname: '赛道幽灵',
    title: '高原红色彗星',
    avatarType: 'custom',
    presetId: 'rider-flame',
    customAvatarUrl: 'data:image/png;base64,customAvatarBase64'
  };

  const customConfig = getCharacter3DAvatarConfig(customProfile, '#ea580c');
  assert.equal(customConfig.isCustom, true);
  assert.equal(customConfig.avatarUrl, 'data:image/png;base64,customAvatarBase64');
  assert.equal(customConfig.displayName, '赛道幽灵');
  assert.equal(customConfig.themeColor, '#ea580c');
});

test('Phase 12: getRiderBibInfo provides correct bib numbers and avatar bindings for player and AI opponents', () => {
  const defaultProfile = getDefaultProfile();
  const playerBib = getRiderBibInfo(defaultProfile, true, 'player');

  assert.equal(playerBib.racerId, 'player');
  assert.equal(playerBib.number, '01');
  assert.equal(playerBib.name, defaultProfile.nickname);
  assert.equal(playerBib.isPlayer, true);
  assert.ok(playerBib.avatarUrl.length > 0);

  // Test for each bot
  for (const botId of ['bot-01', 'bot-02', 'bot-03', 'bot-04']) {
    const botBib = getRiderBibInfo(null, false, botId);
    assert.equal(botBib.racerId, botId);
    assert.equal(botBib.number, botId.slice(-2));
    assert.equal(botBib.name, BOT_AVATARS[botId].name);
    assert.equal(botBib.isPlayer, false);
    assert.ok(botBib.avatarUrl.startsWith('data:image/svg+xml'));
  }
});
