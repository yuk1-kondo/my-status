// 定数・グローバル変数
const targetScore = 100; // ゲームクリア条件
let canvas, ctx;
let player, bullets, enemies, powerups;
let score, lives, level;
let gameOver, gameClear, gamePaused;
let enemyInterval = null;
let powerupInterval = null;
let gameLoopId = null;
let particles = [];
let playerInvincible = false;
let invincibleTimer = 0;
let playerPowerupType = null;
let powerupTimer = 0;
let movementTouchId = null;
let starfield = []; // 星のパーティクル
let bossSpawned = false; // ボスが既に出現したかどうか
let bossHitCount = 0; // ボスへのヒット数を記録
const zigzagColors = ["#ff3366", "#33ccff", "#ff9900", "#66ff33", "#9933ff"];
const powerupTypes = [
  { name: "rapidFire", color: "#ffff00", text: "連射モード！" },
  { name: "wideShot", color: "#00ffff", text: "ワイドショット！" },
  { name: "shield", color: "#00ff00", text: "シールド！" }
];

// 星のパーティクル初期化
function initStarfield() {
  for (let i = 0; i < 100; i++) {
    starfield.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: Math.random() * 2 + 0.5,
      size: Math.random() * 2 + 1,
      brightness: Math.random()
    });
  }
}

// 星のパーティクルを描画
function drawStarfield() {
  starfield.forEach(star => {
    star.y += star.speed;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
    
    ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

// 追跡ミッションシステム
const trackingMissions = [
  { 
    id: 'basic_recon', 
    name: '基本偵察', 
    description: '30ポイントを獲得して基本情報を収集',
    target: 30, 
    progress: 0,
    type: 'score',
    reward: 'こんちゃんは日本にいることが判明！',
    clue: 'location_country',
    completed: false
  },
  { 
    id: 'regional_search', 
    name: '地域特定', 
    description: '60点を達成して地域情報を入手',
    target: 60, 
    progress: 0,
    type: 'score',
    reward: 'こんちゃんは関東地方にいる模様...',
    clue: 'location_region',
    completed: false
  },
  { 
    id: 'precise_location', 
    name: '精密捜索', 
    description: '100点達成で正確な位置を特定！',
    target: 100, 
    progress: 0,
    type: 'score',
    reward: 'こんちゃんの現在地が判明！',
    clue: 'location_exact',
    completed: false
  }
];

let discoveredClues = [];
let investigationProgress = 0;
let totalEnemiesDefeated = 0;

let sprites = {
  player: null,
  enemies: {},
  bullets: null,
  powerups: {},
  explosions: []
};
let enemyBullets = [];

// スプライト画像の生成
function loadGameAssets() {
  // プレイヤー用スプライト（パープル＆ピンクの宇宙船風）
  sprites.player = document.createElement('canvas');
  sprites.player.width = 30;
  sprites.player.height = 40;
  let pCtx = sprites.player.getContext('2d');
  pCtx.fillStyle = "#8B00FF"; // バイオレット
  pCtx.beginPath();
  pCtx.moveTo(15, 0);
  pCtx.lineTo(0, 25);
  pCtx.lineTo(30, 25);
  pCtx.closePath();
  pCtx.fill();
  pCtx.fillStyle = "#FF1493"; // ディープピンク
  pCtx.beginPath();
  pCtx.moveTo(0, 25);
  pCtx.lineTo(5, 15);
  pCtx.lineTo(15, 20);
  pCtx.lineTo(25, 15);
  pCtx.lineTo(30, 25);
  pCtx.closePath();
  pCtx.fill();
  pCtx.fillStyle = "#FFB6C1"; // ライトピンク
  pCtx.beginPath();
  pCtx.moveTo(15, 5);
  pCtx.lineTo(10, 18);
  pCtx.lineTo(20, 18);
  pCtx.closePath();
  pCtx.fill();
  pCtx.fillStyle = "#FF69B4"; // ホットピンク
  pCtx.beginPath();
  pCtx.moveTo(10, 25);
  pCtx.lineTo(15, 35);
  pCtx.lineTo(20, 25);
  pCtx.closePath();
  pCtx.fill();
  pCtx.fillStyle = "#FF1493"; // エンジン
  pCtx.beginPath();
  pCtx.moveTo(12, 25);
  pCtx.lineTo(15, 32);
  pCtx.lineTo(18, 25);
  pCtx.closePath();
  pCtx.fill();
  pCtx.fillStyle = "#00FFFF"; // シアン色の目
  pCtx.beginPath();
  pCtx.arc(5, 20, 1, 0, Math.PI * 2);
  pCtx.fill();
  pCtx.beginPath();
  pCtx.arc(25, 20, 1, 0, Math.PI * 2);
  pCtx.fill();

  // グレー敵のスプライト（ターコイズ色のロボット）
  sprites.enemies.gray = document.createElement('canvas');
  sprites.enemies.gray.width = 20;
  sprites.enemies.gray.height = 20;
  let grayCtx = sprites.enemies.gray.getContext('2d');
  grayCtx.fillStyle = "#40E0D0"; // ターコイズ
  grayCtx.beginPath();
  grayCtx.moveTo(10, 0);
  grayCtx.lineTo(0, 10);
  grayCtx.lineTo(5, 15);
  grayCtx.lineTo(15, 15);
  grayCtx.lineTo(20, 10);
  grayCtx.closePath();
  grayCtx.fill();
  grayCtx.fillStyle = "#008B8B"; // ダークターコイズ
  grayCtx.beginPath();
  grayCtx.moveTo(0, 10);
  grayCtx.lineTo(3, 18);
  grayCtx.lineTo(17, 18);
  grayCtx.lineTo(20, 10);
  grayCtx.closePath();
  grayCtx.fill();
  grayCtx.fillStyle = "#006666"; // 深いターコイズ
  grayCtx.fillRect(8, 5, 4, 8);
  grayCtx.fillStyle = "#87CEEB"; // スカイブルー
  grayCtx.beginPath();
  grayCtx.arc(10, 7, 2, 0, Math.PI * 2);
  grayCtx.fill();

  // オレンジ敵のスプライト（ライム＆イエローの UFO）
  sprites.enemies.orange = document.createElement('canvas');
  sprites.enemies.orange.width = 20;
  sprites.enemies.orange.height = 20;
  let orangeCtx = sprites.enemies.orange.getContext('2d');
  orangeCtx.fillStyle = "#32CD32"; // ライムグリーン
  orangeCtx.beginPath();
  orangeCtx.ellipse(10, 10, 10, 6, 0, 0, Math.PI * 2);
  orangeCtx.fill();
  orangeCtx.fillStyle = "#FFFF00"; // イエロー
  orangeCtx.beginPath();
  orangeCtx.ellipse(10, 7, 5, 5, 0, 0, Math.PI * 2);
  orangeCtx.fill();
  orangeCtx.fillStyle = "#FF4500"; // オレンジレッド
  for (let i = 0; i < 5; i++) {
    const angle = i * Math.PI / 2.5;
    orangeCtx.beginPath();
    orangeCtx.arc(10 + 8 * Math.cos(angle), 10 + 3 * Math.sin(angle), 1.5, 0, Math.PI * 2);
    orangeCtx.fill();
  }
  orangeCtx.fillStyle = "#FF69B4"; // ホットピンク
  orangeCtx.fillRect(9.5, 0, 1, 4);
  orangeCtx.beginPath();
  orangeCtx.arc(10, 0, 1, 0, Math.PI * 2);
  orangeCtx.fill();

  // 新しい敵：ボス敵（大型の赤いドラゴン）
  sprites.enemies.boss = document.createElement('canvas');
  sprites.enemies.boss.width = 40;
  sprites.enemies.boss.height = 30;
  let bossCtx = sprites.enemies.boss.getContext('2d');
  bossCtx.fillStyle = "#DC143C"; // クリムゾン
  bossCtx.beginPath();
  bossCtx.ellipse(20, 15, 20, 12, 0, 0, Math.PI * 2);
  bossCtx.fill();
  bossCtx.fillStyle = "#B22222"; // ファイアブリック
  bossCtx.beginPath();
  bossCtx.ellipse(15, 10, 8, 6, 0, 0, Math.PI * 2);
  bossCtx.fill();
  bossCtx.fillStyle = "#8B0000"; // ダークレッド
  bossCtx.fillRect(10, 5, 20, 4);
  bossCtx.fillStyle = "#FFD700"; // ゴールド（目）
  bossCtx.beginPath();
  bossCtx.arc(12, 8, 2, 0, Math.PI * 2);
  bossCtx.fill();
  bossCtx.beginPath();
  bossCtx.arc(28, 8, 2, 0, Math.PI * 2);
  bossCtx.fill();

  // 新しい敵：高速敵（小さな青いスピードスター）
  sprites.enemies.fast = document.createElement('canvas');
  sprites.enemies.fast.width = 15;
  sprites.enemies.fast.height = 15;
  let fastCtx = sprites.enemies.fast.getContext('2d');
  fastCtx.fillStyle = "#1E90FF"; // ドッジャーブルー
  fastCtx.beginPath();
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI / 2);
    const x = 7.5 + 7 * Math.cos(angle);
    const y = 7.5 + 7 * Math.sin(angle);
    if (i === 0) fastCtx.moveTo(x, y);
    else fastCtx.lineTo(x, y);
  }
  fastCtx.closePath();
  fastCtx.fill();
  fastCtx.fillStyle = "#00BFFF"; // ディープスカイブルー
  fastCtx.beginPath();
  fastCtx.arc(7.5, 7.5, 3, 0, Math.PI * 2);
  fastCtx.fill();

  // 弾のスプライト（レインボーグラデーション）
  sprites.bullets = document.createElement('canvas');
  sprites.bullets.width = 5;
  sprites.bullets.height = 10;
  let bulletCtx = sprites.bullets.getContext('2d');
  const bulletGradient = bulletCtx.createLinearGradient(0, 0, 0, 10);
  bulletGradient.addColorStop(0, "#FF00FF"); // マゼンタ
  bulletGradient.addColorStop(0.33, "#00FFFF"); // シアン
  bulletGradient.addColorStop(0.66, "#FFFF00"); // イエロー
  bulletGradient.addColorStop(1, "#FF69B4"); // ホットピンク
  bulletCtx.fillStyle = bulletGradient;
  bulletCtx.beginPath();
  bulletCtx.ellipse(2.5, 5, 2.5, 5, 0, 0, Math.PI * 2);
  bulletCtx.fill();
  bulletCtx.fillStyle = "rgba(255, 255, 255, 0.8)";
  bulletCtx.beginPath();
  bulletCtx.arc(2.5, 3, 1, 0, Math.PI * 2);
  bulletCtx.fill();

  // パワーアップ用スプライト
  powerupTypes.forEach(type => {
    sprites.powerups[type.name] = document.createElement('canvas');
    sprites.powerups[type.name].width = 20;
    sprites.powerups[type.name].height = 20;
    let puCtx = sprites.powerups[type.name].getContext('2d');
    puCtx.fillStyle = type.color;
    puCtx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
      const outerX = 10 + 10 * Math.cos(angle);
      const outerY = 10 + 10 * Math.sin(angle);
      puCtx.lineTo(outerX, outerY);
      const innerAngle = angle + Math.PI / 5;
      const innerX = 10 + 4 * Math.cos(innerAngle);
      const innerY = 10 + 4 * Math.sin(innerAngle);
      puCtx.lineTo(innerX, innerY);
    }
    puCtx.closePath();
    puCtx.fill();
    puCtx.fillStyle = "#ffffff";
    puCtx.beginPath();
    puCtx.arc(10, 10, 3, 0, Math.PI * 2);
    puCtx.fill();
    puCtx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    puCtx.lineWidth = 1;
    puCtx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
      const outerX = 10 + 12 * Math.cos(angle);
      const outerY = 10 + 12 * Math.sin(angle);
      puCtx.moveTo(10, 10);
      puCtx.lineTo(outerX, outerY);
    }
    puCtx.stroke();
  });

  // 爆発アニメーション用スプライト
  for (let i = 0; i < 5; i++) {
    sprites.explosions[i] = document.createElement('canvas');
    sprites.explosions[i].width = 30;
    sprites.explosions[i].height = 30;
    let exCtx = sprites.explosions[i].getContext('2d');
    const size = 5 + i * 5;
    exCtx.fillStyle = `rgba(255, ${150 - i * 30}, 0, ${1 - i * 0.2})`;
    exCtx.beginPath();
    exCtx.arc(15, 15, size, 0, Math.PI * 2);
    exCtx.fill();
    for (let j = 0; j < i * 3; j++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * size * 1.2;
      const fragSize = 1 + Math.random() * 3;
      exCtx.fillStyle = j % 2 === 0 ? "#ffcc00" : "#ffffff";
      exCtx.beginPath();
      exCtx.arc(15 + Math.cos(angle) * distance, 15 + Math.sin(angle) * distance, fragSize, 0, Math.PI * 2);
      exCtx.fill();
    }
  }
}

// DOMContentLoadedイベントハンドラ
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing game...");
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");
  console.log("Canvas found:", canvas);
  loadGameAssets();
  setCanvasSize();
  window.addEventListener("resize", setCanvasSize);

  document.getElementById("startBtn").addEventListener("click", () => {
    document.getElementById("overlay").style.display = "none";
    initGame();
  });
  
  const restartBtn = document.getElementById("restartBtn");
  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      document.getElementById("locationCard").style.display = "none";
      initGame();
    });
  }

  document.addEventListener("keydown", (e) => {
    console.log("Key pressed:", e.key, "Player exists:", !!player);
    if (!player) return;
    if (e.key === "ArrowLeft") {
      player.dx = -player.speed;
      console.log("Moving left, player.dx:", player.dx);
    }
    if (e.key === "ArrowRight") {
      player.dx = player.speed;
      console.log("Moving right, player.dx:", player.dx);
    }
    if (e.key === " " || e.key === "Enter") shoot();
    if (e.key.toLowerCase() === "p") togglePause();
  });
  document.addEventListener("keyup", (e) => {
    if (!player) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") player.dx = 0;
  });

  // タッチ操作
  canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
  canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
  canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
  
  document.body.addEventListener('touchmove', function(e) {
    if (e.target === canvas) {
      e.preventDefault();
    }
  }, { passive: false });
});

// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
// ★★★ ここから下に関数を追加 ★★★
// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
/* タッチ操作ハンドラ（改善版） */
let lastTouchX = null;
let touchStartX = null;
let isDragging = false;

function handleTouchStart(e) {
  if (gameOver || gameClear || gamePaused || !player) return;
  e.preventDefault(); // スクロール等のデフォルト動作を防ぐ

  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i];
    const rect = canvas.getBoundingClientRect();
    const touchY = touch.clientY - rect.top;
    const touchX = touch.clientX - rect.left;

    // 画面下部15%は移動操作エリア
    if (touchY > canvas.height * 0.85) {
      movementTouchId = touch.identifier;
      touchStartX = touchX;
      lastTouchX = touchX;
      isDragging = true;
      
      // 指の位置にプレイヤーを直接移動（画面端からの制約あり）
      const targetX = Math.max(0, Math.min(touchX - player.width / 2, canvas.width - player.width));
      player.x = targetX;
      player.dx = 0; // 直接位置制御なので速度はリセット
    } else { // それ以外は弾発射エリア
      shoot();
    }
  }
}

function handleTouchMove(e) {
  if (gameOver || gameClear || gamePaused || !player || movementTouchId === null) return;
  e.preventDefault();

  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i];
    if (touch.identifier === movementTouchId) {
      const rect = canvas.getBoundingClientRect();
      const touchX = touch.clientX - rect.left;
      
      if (isDragging) {
        // 指の位置にプレイヤーを直接追従（スムーズな補間付き）
        const targetX = Math.max(0, Math.min(touchX - player.width / 2, canvas.width - player.width));
        const smoothness = 0.3; // 追従の滑らかさ（0.1-1.0, 大きいほど敏感）
        player.x += (targetX - player.x) * smoothness;
        player.dx = 0; // 直接位置制御なので速度はリセット
      }
      
      lastTouchX = touchX;
      break;
    }
  }
}

function handleTouchEnd(e) {
  if (gameOver || gameClear || gamePaused || !player) return;
  e.preventDefault();

  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i];
    if (touch.identifier === movementTouchId) {
      player.dx = 0; // 速度をリセット
      movementTouchId = null;
      lastTouchX = null;
      touchStartX = null;
      isDragging = false;
      break;
    }
  }
}

function setCanvasSize() {
  const isMobile = window.matchMedia("(max-width: 768px)").matches || /Mobi|Android/i.test(navigator.userAgent);
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  if (isMobile) {
    // モバイル向けのサイズ調整 - 画面幅に合わせる
    canvas.width = Math.min(windowWidth - 10, windowWidth * 0.95); // 少し余白を持たせる
    canvas.height = Math.min(windowHeight, windowWidth * 1.6);
  } else {
    // PC向けのサイズ調整
    canvas.width = Math.min(windowWidth * 0.8, 640);
    canvas.height = Math.min(windowHeight * 0.8, 480);
  }
  
  // 垂直方向の中央配置
  if (canvas.height < windowHeight) {
    canvas.style.top = ((windowHeight - canvas.height) / 2) + "px";
  } else {
    canvas.style.top = "0";
  }
  
  // キャンバスを水平中央に配置
  canvas.style.left = "50%";
  canvas.style.transform = "translateX(-50%)";
  
  if (player) {
    player.x = Math.min(player.x, canvas.width - player.width);
    player.y = canvas.height - 40;
  }
}

function initGame() {
  console.log("Initializing game...");
  if (enemyInterval) clearInterval(enemyInterval);
  if (powerupInterval) clearInterval(powerupInterval);
  if (gameLoopId) cancelAnimationFrame(gameLoopId);

  setCanvasSize();
  initStarfield(); // 星のパーティクル初期化
  
  player = {
    x: canvas.width / 2 - 15,
    y: canvas.height - 40,
    width: 30,
    height: 30,
    speed: 5,
    dx: 0,
    frameCount: 0
  };
  console.log("Player initialized:", player);
  bullets = [];
  enemies = [];
  powerups = [];
  enemyBullets = [];
  particles = [];
  score = 0;
  lives = 3;
  level = 1;
  gameOver = false;
  gameClear = false;
  gamePaused = false;
  playerInvincible = false;
  invincibleTimer = 0;
  playerPowerupType = null;
  powerupTimer = 0;
  
  // ボス関連をリセット
  bossSpawned = false;
  bossHitCount = 0;
  
  // 追跡ミッションシステムをリセット
  totalEnemiesDefeated = 0;
  discoveredClues = [];
  investigationProgress = 0;
  trackingMissions.forEach(mission => {
    mission.progress = 0;
    mission.completed = false;
  });
  
  canvas.style.display = "block";
  document.getElementById("locationCard").style.display = "none";

  startEnemyGeneration();
  powerupInterval = setInterval(spawnPowerup, 15000);
  gameLoop();
}

//キャンバス上にHUDを描画する
function drawHUD() {
  // HUD情報の背景
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(10, 10, 150, 70);
  
  // 枠線
  ctx.strokeStyle = "#4a5eff";
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, 150, 70);
  
  // テキスト
  ctx.fillStyle = "#ffffff";
  ctx.font = "14px Arial";
  ctx.fillText(`スコア: ${score}`, 20, 30);
  ctx.fillText(`残機: ${lives}`, 20, 50);
  ctx.fillText(`レベル: ${level}`, 20, 70);
}

// タッチエリア表示（スマホ向け）
function drawTouchAreas() {
  // モバイル判定
  const isMobile = window.matchMedia("(max-width: 768px)").matches || /Mobi|Android/i.test(navigator.userAgent);
  if (!isMobile) return;
  
  // 射撃エリア（上部85%）
  ctx.fillStyle = "rgba(255, 255, 0, 0.05)"; // 薄い黄色
  ctx.fillRect(0, 0, canvas.width, canvas.height * 0.85);
  
  // 移動エリア（下部15%）
  ctx.fillStyle = "rgba(0, 255, 255, 0.08)"; // 薄いシアン
  ctx.fillRect(0, canvas.height * 0.85, canvas.width, canvas.height * 0.15);
  
  // エリア境界線
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(0, canvas.height * 0.85);
  ctx.lineTo(canvas.width, canvas.height * 0.85);
  ctx.stroke();
  ctx.setLineDash([]); // 破線をリセット
  
  // タッチ中の視覚フィードバック
  if (isDragging && lastTouchX !== null) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.beginPath();
    ctx.arc(lastTouchX, canvas.height * 0.925, 25, 0, Math.PI * 2);
    ctx.fill();
    
    // プレイヤーとの接続線を表示
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(lastTouchX, canvas.height * 0.925);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height / 2);
    ctx.stroke();
    ctx.setLineDash([]); // 破線をリセット
    
    // 指の位置に小さなアイコン
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("👆", lastTouchX, canvas.height * 0.925 + 5);
    ctx.textAlign = "left"; // リセット
  }
  
  // 操作説明（最初の数秒間のみ表示）
  if (typeof drawTouchAreas.startTime === 'undefined') {
    drawTouchAreas.startTime = Date.now();
  }
  
  const elapsed = Date.now() - drawTouchAreas.startTime;
  if (elapsed < 5000) { // 5秒間表示
    const alpha = Math.max(0, 1 - elapsed / 5000); // フェードアウト
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    
    // 射撃エリアの説明
    ctx.fillText("💥 タップで弾発射", canvas.width / 2, canvas.height * 0.42);
    
    // 移動エリアの説明
    ctx.fillText("👆 指に追従して移動", canvas.width / 2, canvas.height * 0.925);
    
    ctx.textAlign = "left"; // テキスト配置をリセット
  }
}

// Simple tracking UI function
function drawTrackingUI(ctx) {
  // Simple tracking info display
  ctx.fillStyle = "rgba(138, 43, 226, 0.8)"; // バイオレット背景
  ctx.fillRect(canvas.width - 200, 10, 190, 80);
  
  ctx.strokeStyle = "#FF69B4"; // ホットピンクの枠
  ctx.lineWidth = 2;
  ctx.strokeRect(canvas.width - 200, 10, 190, 80);
  
  ctx.fillStyle = "#FFB6C1"; // ライトピンクのタイトル
  ctx.font = "bold 14px Arial";
  ctx.fillText("🔍 こんちゃん捜索", canvas.width - 190, 30);
  
  ctx.fillStyle = "#00FFFF"; // シアンの進度テキスト
  ctx.font = "12px Arial";
  ctx.fillText(`進度: ${Math.floor(investigationProgress || 0)}%`, canvas.width - 190, 50);
  
  // レインボープログレスバー
  ctx.fillStyle = "#1a0033"; // ダーク背景
  ctx.fillRect(canvas.width - 190, 55, 170, 8);
  
  const progress = (investigationProgress || 0) / 100;
  const gradient = ctx.createLinearGradient(canvas.width - 190, 0, canvas.width - 20, 0);
  gradient.addColorStop(0, "#FF00FF"); // マゼンタ
  gradient.addColorStop(0.5, "#00FFFF"); // シアン
  gradient.addColorStop(1, "#FFFF00"); // イエロー
  ctx.fillStyle = gradient;
  ctx.fillRect(canvas.width - 190, 55, 170 * progress, 8);
}

function gameLoop() {
  if (gamePaused || gameOver || gameClear) return;
  
  // ダークパープルの背景グラデーション
  const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGradient.addColorStop(0, "#1a0033"); // ダークパープル
  bgGradient.addColorStop(0.5, "#330066"); // ミディアムパープル
  bgGradient.addColorStop(1, "#0a001a"); // 非常にダークパープル
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 星のパーティクル背景
  drawStarfield();
  
  if (!player) {
    console.error("Player is not initialized!");
    return;
  }
  
  updatePlayer();
  updateBullets();
  updateEnemies();
  updatePowerups();
  updateEnemyBullets();
  updateParticles();
  checkCollisions();
  drawHUD();
  drawTouchAreas(); // タッチエリア表示を追加
  // Tracking UI display - 無効化
  // try {
  //   drawTrackingUI(ctx);
  // } catch (error) {
  //   console.error("Error calling drawTrackingUI:", error);
  // }
  
  // 追跡ミッションの進捗チェック
  try {
    updateTrackingMissions();
  } catch (error) {
    console.error("Error calling updateTrackingMissions:", error);
  }
  
  if (score >= targetScore) {
    gameClear = true;
    showLocationCard();
    return;
  }

  gameLoopId = requestAnimationFrame(gameLoop);
}

function updatePlayer() {
  player.x += player.dx;
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
  
  // 無敵時間中は点滅させる
  if (!playerInvincible || Math.floor(invincibleTimer / 6) % 2 === 0) {
    ctx.drawImage(sprites.player, player.x, player.y, player.width, player.height);
  }
  
  // シールド中の描画（緑色の円）
  if (playerPowerupType === "shield") {
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function shoot() {
  if (!player || gameOver || gameClear || gamePaused) return;
  const maxBullets = playerPowerupType === "rapidFire" ? 100 : 5;
  if (bullets.length < maxBullets) {
    bullets.push({
      x: player.x + player.width / 2 - 2.5,
      y: player.y,
      width: 5,
      height: 10,
      speed: 7,
      power: 1,
      dx: 0
    });
    if (playerPowerupType === "wideShot") {
      bullets.push({
        x: player.x + 5,
        y: player.y,
        width: 5,
        height: 10,
        speed: 6,
        dx: -0.5,
        power: 1
      });
      bullets.push({
        x: player.x + player.width - 10,
        y: player.y,
        width: 5,
        height: 10,
        speed: 6,
        dx: 0.5,
        power: 1
      });
    }
  }
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    let bullet = bullets[i];
    bullet.x += bullet.dx || 0;
    bullet.y -= bullet.speed;
    if (bullet.y < 0) {
      bullets.splice(i, 1);
      continue;
    }
    ctx.drawImage(sprites.bullets, bullet.x, bullet.y, bullet.width, bullet.height);
  }
}

function spawnEnemyBullet(enemy) {
  if (!player) return;
  const bulletSpeed = 4;
  const enemyCenterX = enemy.x + enemy.width / 2;
  const enemyCenterY = enemy.y + enemy.height;
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;
  let vDiff = playerCenterY - enemyCenterY;
  if (vDiff < 10) vDiff = 10;
  const hDiff = playerCenterX - enemyCenterX;
  const baseAngle = Math.atan2(vDiff, hDiff);

  // ターコイズロボット（gray）は2発、その他は3発
  let angleOffsets;
  if (enemy.type === "gray") {
    angleOffsets = [-0.15, 0.15]; // 左右2発
  } else {
    angleOffsets = [0, -0.2, 0.2]; // 真ん中、左、右に3発
  }

  angleOffsets.forEach(offset => {
    const angle = baseAngle + offset;
    enemyBullets.push({
      x: enemyCenterX - 2.5,
      y: enemyCenterY,
      width: 5,
      height: 5,
      speed: bulletSpeed,
      dx: Math.cos(angle) * bulletSpeed,
      dy: Math.sin(angle) * bulletSpeed,
      color: "#ff3333"
    });
  });
}

function updateEnemyBullets() {
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    let bullet = enemyBullets[i];
    bullet.x += bullet.dx;
    bullet.y += bullet.dy;
    if (bullet.y > canvas.height || bullet.y < 0 || bullet.x > canvas.width || bullet.x < 0) {
      enemyBullets.splice(i, 1);
      continue;
    }
    ctx.fillStyle = bullet.color;
    ctx.beginPath();
    ctx.arc(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, bullet.width / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function startEnemyGeneration() {
  if (enemyInterval) clearInterval(enemyInterval);
  const baseInterval = 1500 - (level * 150);
  const interval = Math.max(baseInterval, 500);
  
  enemyInterval = setInterval(() => {
    if (gamePaused || gameOver || gameClear) return;
    
    // 現在ボスが画面上にいるかチェック
    const bossExists = enemies.some(enemy => enemy.type === "boss");
    
    const rand = Math.random();
    if (rand < 0.2) {
      spawnEnemy("gray");   // 20%の確率でグレー
    } else if (rand < 0.35) {
      spawnEnemy("orange"); // 15%でオレンジ
    } else if (rand < 0.55) {
      spawnEnemy("zigzag"); // 20%でジグザグ
    } else if (rand < 0.75) {
      spawnEnemy("fast");   // 20%で高速敵
    } else if (!bossSpawned && !bossExists) {
      spawnEnemy("boss");   // ボス敵（1回のみ、画面上にいない場合のみ）
      bossSpawned = true;   // ボス出現フラグを立てる
    } else {
      spawnEnemy("gray");   // ボス出現済みの場合はグレー敵
    }
  }, interval);
}

function spawnEnemy(type) {
  let width, height;
  
  if (type === "boss") {
    width = 40;
    height = 30;
  } else if (type === "fast") {
    width = 15;
    height = 15;
  } else {
    width = 20;
    height = 20;
  }
  
  const x = Math.random() * (canvas.width - width);
  
  let enemy = {
    x: x,
    y: -height,
    width: width,
    height: height,
    type: type,
    hp: 1,
    frameCount: 0
  };
  
  if (type === "gray") {
    enemy.speed = 1.5 + Math.random() * 0.5;
    enemy.score = 10;
    enemy.canShoot = true;
    enemy.shootInterval = 120 + Math.floor(Math.random() * 50);
  } else if (type === "orange") {
    enemy.speed = 2 + Math.random() * 1;
    enemy.score = -5;
    if (Math.random() < 0.3) {
      enemy.canShoot = true;
      enemy.shootInterval = 100 + Math.floor(Math.random() * 50);
    }
  } else if (type === "zigzag") {
    enemy.hp = 3;
    enemy.speed = 2.5 + Math.random() * 1.5;
    enemy.amplitude = 30 + Math.random() * 20;
    enemy.frequency = 0.05 + Math.random() * 0.03;
    enemy.startX = x;
    enemy.score = -10;
    enemy.currentColor = zigzagColors[Math.floor(Math.random() * zigzagColors.length)];
    enemy.colorChangeRate = 10 + Math.floor(Math.random() * 20);
  } else if (type === "boss") {
    enemy.hp = 5; // 5発で倒せるように変更
    enemy.speed = 1.5; // 横移動速度
    enemy.score = 30; // スコアを30に変更
    enemy.canShoot = true;
    enemy.shootInterval = 180; // 攻撃頻度を下げる
    enemy.direction = Math.random() < 0.5 ? -1 : 1; // 左右どちらから出現するか
    enemy.x = enemy.direction === 1 ? -width : canvas.width; // 画面外から開始
    enemy.y = Math.random() * (canvas.height * 0.3) + 50; // 上部1/3の範囲
    enemy.isInvincible = false; // 倒せるように変更
    enemy.hitCount = 0; // ヒット数をカウント
    enemy.frequency = 0.02;
    enemy.startX = x;
  } else if (type === "fast") {
    enemy.hp = 1;
    enemy.speed = 4 + Math.random() * 2; // 非常に高速
    enemy.score = 20;
    enemy.zigzagSpeed = 3;
    enemy.startX = x;
  }
  
  enemies.push(enemy);
}

function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    enemy.frameCount++;
    
    if (enemy.type === "gray" || enemy.type === "orange") {
      enemy.y += enemy.speed;
      // プレイヤーを超えていない場合のみ攻撃
      if (enemy.canShoot && enemy.frameCount % enemy.shootInterval === 0 && enemy.y < player.y) {
        spawnEnemyBullet(enemy);
      }
    } else if (enemy.type === "zigzag") {
      enemy.y += enemy.speed;
      enemy.x = enemy.startX + Math.sin(enemy.y * enemy.frequency) * enemy.amplitude;
      if (enemy.frameCount % enemy.colorChangeRate === 0) {
        enemy.currentColor = zigzagColors[Math.floor(Math.random() * zigzagColors.length)];
      }
    } else if (enemy.type === "boss") {
      // 左右移動パターン
      enemy.x += enemy.speed * enemy.direction;
      
      // 攻撃頻度を抑制
      if (enemy.canShoot && enemy.frameCount % enemy.shootInterval === 0) {
        spawnEnemyBullet(enemy);
        // ボスは2方向に弾を撃つ
        spawnEnemyBullet({...enemy, x: enemy.x + 10});
      }
      
      // 画面外に出たら反対側から再出現
      if (enemy.x < -enemy.width || enemy.x > canvas.width) {
        enemy.direction *= -1; // 方向を反転
        enemy.x = enemy.direction === 1 ? -enemy.width : canvas.width;
        enemy.y = Math.random() * (canvas.height * 0.3) + 50; // 新しいY座標
      }
    } else if (enemy.type === "fast") {
      enemy.y += enemy.speed;
      // 高速敵は左右にジグザグ移動
      enemy.x = enemy.startX + Math.sin(enemy.y * 0.1) * 40;
    }
    
    if (enemy.y > canvas.height) {
      enemies.splice(i, 1);
      continue;
    }
    
    // 敵の描画
    if (enemy.type === "gray" || enemy.type === "orange" || enemy.type === "boss" || enemy.type === "fast") {
      ctx.drawImage(sprites.enemies[enemy.type], enemy.x, enemy.y, enemy.width, enemy.height);
    } else if (enemy.type === "zigzag") {
      ctx.fillStyle = enemy.currentColor;
      ctx.beginPath();
      ctx.moveTo(enemy.x + enemy.width / 2, enemy.y);
      ctx.lineTo(enemy.x, enemy.y + enemy.height / 2);
      ctx.lineTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
      ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height / 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(enemy.x + enemy.width / 2 - 3, enemy.y + enemy.height / 2, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(enemy.x + enemy.width / 2 + 3, enemy.y + enemy.height / 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function spawnPowerup() {
  if (gamePaused || gameOver || gameClear) return;
  const width = 20;
  const height = 20;
  const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
  
  powerups.push({
    x: 20 + Math.random() * (canvas.width - width - 40),
    y: -height,
    width: width,
    height: height,
    type: type.name,
    speed: 2,
    frameCount: 0
  });
}

function updatePowerups() {
  for (let i = powerups.length - 1; i >= 0; i--) {
    let powerup = powerups[i];
    powerup.frameCount++;
    powerup.y += powerup.speed;
    if (powerup.y > canvas.height) {
      powerups.splice(i, 1);
      continue;
    }
    ctx.drawImage(sprites.powerups[powerup.type], powerup.x, powerup.y, powerup.width, powerup.height);
  }
  
  // パワーアップ（シールド含む）有効時間の管理
  if (playerPowerupType) {
    powerupTimer--;
    if (powerupTimer <= 0) {
      playerPowerupType = null;
    }
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.dx;
    p.y += p.dy;
    p.life--;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    ctx.globalAlpha = p.life / p.initialLife;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function createExplosion(x, y, color, count = 15) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 2;
    const radius = 1 + Math.random() * 2;
    particles.push({
      x: x,
      y: y,
      radius: radius,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      color: color || "#ffcc00",
      life: 30 + Math.random() * 30,
      initialLife: 30 + Math.random() * 30
    });
  }
  
  let explosionFrame = 0;
  const explosionInterval = setInterval(() => {
    ctx.drawImage(sprites.explosions[explosionFrame], x - 15, y - 15, 30, 30);
    explosionFrame++;
    if (explosionFrame >= sprites.explosions.length) {
      clearInterval(explosionInterval);
    }
  }, 50);
}

// 当たり判定用のヘルパー関数
function isColliding(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

// 衝突判定
function checkCollisions() {
  // 被弾後の無敵時間のカウントダウン
  if (playerInvincible) {
    invincibleTimer--;
    if (invincibleTimer <= 0) {
      playerInvincible = false;
    }
  }

  // シールド中は敵弾を弾く
  if (playerPowerupType === "shield") {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      let bullet = enemyBullets[i];
      if (isColliding(player, bullet)) {
        // 弾かれた際のエフェクト
        createExplosion(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, "#00ff00", 5);
        enemyBullets.splice(i, 1);
      }
    }
  }
  // シールド中でなく、かつ無敵時間でもない時のみ被弾判定
  else if (!playerInvincible) {
    // プレイヤーと敵の衝突判定
    for (let i = enemies.length - 1; i >= 0; i--) {
      let enemy = enemies[i];
      if (isColliding(player, enemy)) {
        // 残機を減らす
        lives--;
        // エフェクト生成
        createExplosion(player.x + player.width / 2, player.y + player.height / 2, "#ffffff", 15);
        playerInvincible = true;
        invincibleTimer = 120; // 2秒間無敵
        enemies.splice(i, 1);
        
        if (lives <= 0) {
          gameOver = true;
          endGame();
          return;
        }
        break;
      }
    }
    
    // プレイヤーと敵弾の衝突判定
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      let bullet = enemyBullets[i];
      if (isColliding(player, bullet)) {
        // 残機を減らす
        lives--;
        // エフェクト生成
        createExplosion(player.x + player.width / 2, player.y + player.height / 2, "#ff3333", 15);
        playerInvincible = true;
        invincibleTimer = 120; // 2秒間無敵
        enemyBullets.splice(i, 1);
        
        if (lives <= 0) {
          gameOver = true;
          endGame();
          return;
        }
        break;
      }
    }
  }

  // 弾と敵の衝突判定
  for (let i = bullets.length - 1; i >= 0; i--) {
    let bullet = bullets[i];
    for (let j = enemies.length - 1; j >= 0; j--) {
      let enemy = enemies[j];
      if (isColliding(bullet, enemy)) {
        // ボスの場合の特別処理
        if (enemy.type === "boss") {
          bullets.splice(i, 1);
          bossHitCount++; // グローバルなヒット数をカウント
          enemy.hitCount = bossHitCount; // 敵オブジェクトにも記録
          
          // ヒットエフェクト
          createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "#FFD700", 5);
          
          // 5発当たったら倒す
          if (bossHitCount >= 5) {
            enemies.splice(j, 1);
            score += enemy.score || 30; // スコアを30に修正
            totalEnemiesDefeated++;
            // 大きな爆発エフェクト
            createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "#FF4500", 20);
          }
          break;
        }
        
        // 通常の敵の処理
        bullets.splice(i, 1);
        enemy.hp--;
        if (enemy.hp <= 0) {
          // 敵のHPが0になったら敵を消す
          enemies.splice(j, 1);
          score += enemy.score || 10;
          totalEnemiesDefeated++;
          // パーティクルを生成
          createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 
            enemy.type === "zigzag" ? enemy.currentColor : "#ffcc00", 10);
        }
        break;
      }
    }
  }

  // プレイヤーとパワーアップアイテムの衝突判定
  for (let i = powerups.length - 1; i >= 0; i--) {
    let powerup = powerups[i];
    if (isColliding(player, powerup)) {
      // パワーアップを適用
      playerPowerupType = powerup.type;
      powerupTimer = 600; // 約10秒間有効
      let pu = powerupTypes.find(p => p.name === powerup.type);
      if (pu) {
        showPowerupNotification(pu.text);
      }
      powerups.splice(i, 1);
    }
  }
}

// 追跡ミッションシステムの機能
function updateTrackingMissions() {
  trackingMissions.forEach(mission => {
    if (mission.completed) return;
    
    // 進捗更新
    switch(mission.type) {
      case 'enemy_count':
        mission.progress = totalEnemiesDefeated;
        break;
      case 'score':
        mission.progress = score;
        break;
    }
    
    // ミッション達成チェック
    if (mission.progress >= mission.target) {
      mission.completed = true;
      revealClue(mission);
    }
  });
}

function revealClue(mission) {
  if (discoveredClues.includes(mission.reward)) return;
  
  discoveredClues.push(mission.reward);
  investigationProgress += 33.33; // 3段階なので
  
  // showClueDiscovery(mission); // ポップアップを無効化
}

function showClueDiscovery(mission) {
  const popup = document.createElement('div');
  popup.className = 'clue-discovery';
  popup.innerHTML = `
    <div class="clue-popup">
      🔍 手がかり発見！<br>
      <span class="clue-title">${mission.name} 完了</span><br>
      <span class="clue-text">${mission.reward}</span>
    </div>
  `;
  document.body.appendChild(popup);
  
  setTimeout(() => {
    if (popup.parentNode) {
      popup.remove();
    }
  }, 4000);
}

function drawTrackingUI(ctx) {
  try {
    // 捜査進度の背景
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(canvas.width - 220, 10, 210, 120);
    
    // 枠線
    ctx.strokeStyle = "#4a5eff";
    ctx.lineWidth = 1;
    ctx.strokeRect(canvas.width - 220, 10, 210, 120);
    
    // タイトル
    ctx.fillStyle = "#4a5eff";
    ctx.font = "bold 14px Arial";
    ctx.fillText("🔍 こんちゃん捜索", canvas.width - 210, 30);
    
    // 進度バー
    ctx.fillStyle = "#333";
    ctx.fillRect(canvas.width - 210, 40, 190, 12);
    ctx.fillStyle = "#4CAF50";
    const progressWidth = Math.min((investigationProgress / 100) * 190, 190);
    ctx.fillRect(canvas.width - 210, 40, progressWidth, 12);
    
    // 進度テキスト
    ctx.fillStyle = "#fff";
    ctx.font = "12px Arial";
    ctx.fillText(`進度: ${Math.floor(investigationProgress)}%`, canvas.width - 210, 65);
    
    // 現在のミッション表示
    ctx.fillStyle = "#ffff99";
    ctx.font = "11px Arial";
    let yOffset = 75;
    
    const activeMission = trackingMissions.find(m => !m.completed);
    if (activeMission) {
      ctx.fillText("現在の任務:", canvas.width - 210, yOffset);
      yOffset += 15;
      
      const shortDesc = activeMission.description.length > 25 
        ? activeMission.description.substring(0, 22) + "..." 
        : activeMission.description;
      ctx.fillText(shortDesc, canvas.width - 210, yOffset);
      yOffset += 12;
      
      ctx.fillText(`進捗: ${activeMission.progress}/${activeMission.target}`, canvas.width - 210, yOffset);
    } else {
      ctx.fillText("全任務完了！", canvas.width - 210, yOffset);
    }
  } catch (error) {
    console.error("drawTrackingUI error:", error);
  }
}

// ゲームオーバー時の処理
function endGame() {
  gamePaused = true;
  if (enemyInterval) clearInterval(enemyInterval);
  if (powerupInterval) clearInterval(powerupInterval);
  const overlay = document.getElementById("overlay");
  
  overlay.innerHTML = `
    <div class="instructions">
      <h2>GAME OVER</h2>
      <p>残機がなくなりました。</p>
      <button id="gameOverRestartBtn">リスタート</button>
    </div>
  `;
  overlay.style.display = "flex";
  
  const gameOverRestartBtn = document.getElementById("gameOverRestartBtn");
  gameOverRestartBtn.addEventListener("click", function() {
    overlay.style.display = "none";
    initGame();
  });
}

// ゲームクリア後の処理
function showLocationCard() {
  gamePaused = true;
  if (enemyInterval) clearInterval(enemyInterval);
  if (powerupInterval) clearInterval(powerupInterval);
  
  // シンプルなクリアポップアップ
  showSimpleGameClear();
}

// シンプルなゲームクリア表示（居場所情報付き）
function showSimpleGameClear() {
  const popup = document.createElement('div');
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 30px;
    border-radius: 10px;
    text-align: center;
    font-family: Arial, sans-serif;
    z-index: 1000;
    border: 3px solid #4CAF50;
    max-width: 400px;
  `;
  
  popup.innerHTML = `
    <h2 style="margin: 0 0 15px 0; color: #4CAF50;">🎉 ゲームクリア！ 🎉</h2>
    <p style="margin: 0 0 20px 0; color: #fff;">スコア: ${score}点</p>
    <div style="margin: 20px 0; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px;">
      <h3 style="margin: 0 0 10px 0; color: #ffff99;">📍 こんちゃんイマココ</h3>
      <p style="margin: 5px 0; color: #00ffff;"><strong>場所:</strong> <span id="locationStatus">読み込み中...</span></p>
      <p style="margin: 5px 0; color: #00ffff;"><strong>更新:</strong> <span id="locationTime">読み込み中...</span></p>
    </div>
    <button onclick="location.reload()" style="
      background: #4CAF50;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
    ">もう一度プレイ</button>
  `;
  
  document.body.appendChild(popup);
  
  // 居場所情報を取得して表示
  fetch("location.json")
    .then(response => response.json())
    .then(data => {
      document.getElementById("locationStatus").textContent = data.status.trim();
      document.getElementById("locationTime").textContent = data.last_updated;
    })
    .catch(error => {
      console.error("location.json の読み込みに失敗しました:", error);
      document.getElementById("locationStatus").textContent = "情報取得失敗";
      document.getElementById("locationTime").textContent = new Date().toLocaleString();
    });
}

// パワーアップ通知表示
function showPowerupNotification(text) {
  const notification = document.getElementById("powerupNotification");
  notification.textContent = text;
  notification.style.display = "block";
  
  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
}

function togglePause() {
  gamePaused = !gamePaused;
  if (gamePaused) {
    if (enemyInterval) clearInterval(enemyInterval);
    if (powerupInterval) clearInterval(powerupInterval);
  } else {
    startEnemyGeneration();
    powerupInterval = setInterval(spawnPowerup, 15000);
    gameLoop();
  }
}

// パワーアップ通知表示
function showPowerupNotification(text) {
  const notification = document.getElementById("powerupNotification");
  notification.textContent = text;
  notification.style.display = "block";
  
  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
}

// 当たり判定用のヘルパー関数
function isColliding(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

function togglePause() {
  gamePaused = !gamePaused;
  if (!gamePaused) {
    gameLoop();
  }
}
