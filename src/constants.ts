export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const BATTERY_CONFIGS = [
  { x: 40, y: 560, maxAmmo: 25, label: 'L' },
  { x: 220, y: 560, maxAmmo: 25, label: 'ML' },
  { x: 400, y: 560, maxAmmo: 30, label: 'M' },
  { x: 580, y: 560, maxAmmo: 25, label: 'MR' },
  { x: 760, y: 560, maxAmmo: 25, label: 'R' },
];

export const CITY_CONFIGS = [
  { x: 120, y: 570 },
  { x: 300, y: 570 },
  { x: 500, y: 570 },
  { x: 680, y: 570 },
];

export const EXPLOSION_MAX_RADIUS = 120;
export const EXPLOSION_GROWTH_RATE = 2.0;
export const MISSILE_SPEED = 15;
export const ROCKET_BASE_SPEED = 0.4;
export const WIN_SCORE = 1000;

export const TRANSLATIONS = {
  en: {
    title: 'Orson Cyber War',
    start: 'Start Mission',
    restart: 'Play Again',
    win: 'Mission Accomplished!',
    loss: 'Cities Fallen',
    score: 'Score',
    ammo: 'Ammo',
    instructions: 'Click to launch interceptors. Protect the cities.',
    winMsg: 'You have successfully defended the cyber sector.',
    lossMsg: 'The defense has collapsed. The cities are lost.',
    level: 'Level',
    leaderboard: 'Leaderboard',
    rank: 'Rank',
    name: 'Name',
    date: 'Date',
    enterName: 'Enter your name',
    submit: 'Submit Score',
    loading: 'Loading...',
  },
  zh: {
    title: 'Orson 网络战争',
    start: '开始任务',
    restart: '再玩一次',
    win: '任务完成！',
    loss: '城市沦陷',
    score: '得分',
    ammo: '弹药',
    instructions: '点击发射拦截导弹。保护城市。',
    winMsg: '你成功保卫了网络扇区。',
    lossMsg: '防御崩溃。城市已失守。',
    level: '关卡',
    leaderboard: '排行榜',
    rank: '排名',
    name: '玩家',
    date: '日期',
    enterName: '输入你的名字',
    submit: '提交分数',
    loading: '加载中...',
  }
};
