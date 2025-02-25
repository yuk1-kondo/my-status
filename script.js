// スコア200点でクリア
const targetScore = 200;

// グローバル変数
let canvas, ctx;
let player, bullets, enemies, powerups;
let score, lives, level;
let gameOver, gameClear, gamePaused;
let enemyInterval = null;  // 敵生成用 interval
let powerupInterval = null; // パワーアップ生成用 interval
let gameLoopId = null;     // ゲームループ用 ID
let particles = [];        // パーティクルエフェクト用配列
let playerInvincible = false; // 無敵状態フラグ
let invincibleTimer = 0;   // 無敵時間
let playerPowerupType = null; // 現在のパワーアップタイプ
let powerupTimer = 0;      // パワーアップ効果持続時間

// スマホ用タッチ操作（下部20％で移動）
let movementTouchId = null;

// ジグザグ敵のカラーバリエーション
const zigzagColors = [
  "#ff3366", // ピンク
  "#33ccff", // 水色
  "#ff9900", // オレンジ
  "#66ff33", // ライムグリーン
  "#9933ff"  // 紫
];

// パワーアップタイプ
const powerupTypes = [
  { name: "rapidFire", color: "#ffff00", text: "連射モード！" },
  { name: "wideShot", color: "#00ffff", text: "ワイドショット！" },
  { name: "shield", color: "#00ff00", text: "シールド！" }
];

// スプライト画像用
let sprites = {
  player: null,
  enemies: {},
  bullets: null,
  powerups: {},
  explosions: []
};

// ゲーム内アセット読み込み
function loadGameAssets() {
  // プレイヤーの宇宙船風スプライト作成
  sprites.player = document.createElement('canvas');
  sprites.player.width = 30;
  sprites.player.height = 30;
  let pCtx = sprites.player.getContext('2d');
  
  // プレイヤーシップを描画（三角形からよりゲーム風に）
  pCtx.fillStyle = "#4a5eff";
  pCtx.beginPath();
  pCtx.moveTo(15, 0);  // 先端
  pCtx.lineTo(0, 30);  // 左下
  pCtx.lineTo(30, 30); // 右下
  pCtx.closePath();
  pCtx.fill();
  
  // 光沢効果を追加
  pCtx.fillStyle = "#8ab3ff";
  pCtx.beginPath();
  pCtx.moveTo(15, 5);  // 先端より少し下
  pCtx.lineTo(10, 25); // 左下寄り
  pCtx.lineTo(20, 25); // 右下寄り
  pCtx.closePath();
  pCtx.fill();
  
  // エンジン炎を追加
  pCtx.fillStyle = "#ff5500";
  pCtx.beginPath();
  pCtx.moveTo(10, 30);
  pCtx.lineTo(15, 40);
  pCtx.lineTo(20, 30);
  pCtx.closePath();
  pCtx.fill();
  
  // グレー敵のスプライト
  sprites.enemies.gray = document.createElement('canvas');
  sprites.enemies.gray.width = 20;
  sprites.enemies.gray.height = 20;
  let grayCtx = sprites.enemies.gray.getContext('2d');
  
  // より宇宙船っぽい形に
  grayCtx.fillStyle = "#aaaaaa";
  grayCtx.beginPath();
  grayCtx.moveTo(10, 0);   // 先端
  grayCtx.lineTo(0, 15);   // 左
  grayCtx.lineTo(10, 20);  // 底中央
  grayCtx.lineTo(20, 15);  // 右
  grayCtx.closePath();
  grayCtx.fill();
  
  // 詳細を追加
  grayCtx.fillStyle = "#666666";
  grayCtx.fillRect(8, 5, 4, 10);
  
  // オレンジ敵のスプライト
  sprites.enemies.orange = document.createElement('canvas');
  sprites.enemies.orange.width = 20;
  sprites.enemies.orange.height = 20;
  let orangeCtx = sprites.enemies.orange.getContext('2d');
  
  // UFO風の形状に
  orangeCtx.fillStyle = "#ffa500";
  orangeCtx.beginPath();
  orangeCtx.ellipse(10, 10, 10, 6, 0, 0, Math.PI * 2);
  orangeCtx.fill();
  
  // ドームを追加
  orangeCtx.fillStyle = "#ffcc00";
  orangeCtx.beginPath();
  orangeCtx.ellipse(10, 8, 5, 5, 0, 0, Math.PI * 2);
  orangeCtx.fill();
  
  // ライト追加
  orangeCtx.fillStyle = "#ffffff";
  orangeCtx.beginPath();
  orangeCtx.arc(6, 12, 1, 0, Math.PI * 2);
  orangeCtx.fill();
  orangeCtx.beginPath();
  orangeCtx.arc(14, 12, 1, 0, Math.PI * 2);
  orangeCtx.fill();
  
  // 弾のスプライト
  sprites.bullets = document.createElement('canvas');
  sprites.bullets.width = 5;
  sprites.bullets.height = 10;
  let bulletCtx = sprites.bullets.getContext('2d');
  
  // エネルギー弾風
  const bulletGradient = bulletCtx.createLinearGradient(0, 0, 0, 10);
  bulletGradient.addColorStop(0, "#ffffff");
  bulletGradient.addColorStop(1, "#4a5eff");
  bulletCtx.fillStyle = bulletGradient;
  bulletCtx.beginPath();
  bulletCtx.ellipse(2.5, 5, 2.5, 5, 0, 0, Math.PI * 2);
  bulletCtx.fill();
  
  // パワーアップスプライト
  powerupTypes.forEach(type => {
    sprites.powerups[type.name] = document.createElement('canvas');
    sprites.powerups[type.name].width = 20;
    sprites.powerups[type.name].height = 20;
    let puCtx = sprites.powerups[type.name].getContext('2d');
    
    // 輝く星型
    puCtx.fillStyle = type.color;
    puCtx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
      const outerX = 10 + 10 * Math.cos(angle);
      const outerY = 10 + 10 * Math.sin(angle);
      puCtx.lineTo(outerX, outerY);
      
      const innerAngle = angle + Math.PI / 5;
      const innerX = 10 + 5 * Math.cos(innerAngle);
      const innerY = 10 + 5 * Math.sin(innerAngle);
      puCtx.lineTo(innerX, innerY);
    }
    puCtx.closePath();
    puCtx.fill();
    
    // 中央に光沢を追加
    puCtx.fillStyle = "#ffffff";
    puCtx.beginPath();
    puCtx.arc(10, 10, 3, 0, Math.PI * 2);
    puCtx.fill();
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
    
    // 爆発の破片
    for (let j = 0; j < i * 2; j++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * size;
      const fragSize = 1 + Math.random() * 3;
      exCtx.fillStyle = "#ffcc00";
      exCtx.beginPath();
      exCtx.arc(
        15 + Math.cos(angle) * distance,
        15 + Math.sin(angle) * distance,
        fragSize, 0, Math.PI * 2
      );
      exCtx.fill();
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded.");

  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  // ゲームアセットを読み込み
  loadGameAssets();

  // PC / スマホ判定に応じてキャンバスサイズを設定
  setCanvasSize();
  window.addEventListener("resize", setCanvasSize);

  // スタートボタン
  document.getElementById("startBtn").addEventListener("click", () => {
    document.getElementById("overlay").style.display = "none";
    document.getElementById("gameHUD").style.display = "block";
    initGame();
  });

  // PC向けキーボード操作
  document.addEventListener("keydown", (e) => {
    if (!player) return;
    if (e.key === "ArrowLeft") player.dx = -player.speed;
    if (e.key === "ArrowRight") player.dx = player.speed;
    if (e.key === " " || e.key === "Enter") shoot();
    if (e.key === "p" || e.key === "P") togglePause();
  });
  document.addEventListener("keyup", (e) => {
    if (!player) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") player.dx = 0;
  });

  // スマホ向けタッチ操作
  canvas.addEventListener("touchstart", handleTouchStart);
  canvas.addEventListener("touchmove", handleTouchMove);
  canvas.addEventListener("touchend", handleTouchEnd);
});

/** 一時停止切り替え */
function togglePause() {
  if (gameOver || gameClear) return;
  
  gamePaused = !gamePaused;
  if (gamePaused) {
    // 一時停止状態になったらゲームループを停止
    cancelAnimationFrame(gameLoopId);
    
    // 一時停止表示
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PAUSE", canvas.width / 2, canvas.height / 2);
    ctx.font = "16px Arial";
    ctx.fillText("Press P to resume", canvas.width / 2, canvas.height / 2 + 40);
  } else {
    // 再開状態ならループを再開
    gameLoop();
  }
}

/** PC/スマホ判定してキャンバスサイズを設定 */
function setCanvasSize() {
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  if (isMobile) {
    // スマホ：全画面
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  } else {
    // PC：最大640×480に制限
    canvas.width = Math.min(window.innerWidth, 640);
    canvas.height = Math.min(window.innerHeight, 480);
  }
}

/** ゲーム初期化 */
function initGame() {
  if (enemyInterval) clearInterval(enemyInterval);
  if (powerupInterval) clearInterval(powerupInterval);
  if (gameLoopId) cancelAnimationFrame(gameLoopId);

  setCanvasSize();

  player = {
    x: canvas.width / 2 - 15,
    y: canvas.height - 40,
    width: 30,
    height: 30,
    speed: 5,
    dx: 0,
    frameCount: 0 // アニメーション用
  };
  bullets = [];
  enemies = [];
  powerups = [];
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

  // HUD更新
  updateHUD();

  canvas.style.display = "block";
  document.getElementById("locationCard").style.display = "none";

  // 敵を生成するインターバル設定（レベルに応じて速度調整）
  startEnemyGeneration();
  
  // パワーアップアイテムを15秒ごとに生成
  powerupInterval = setInterval(spawnPowerup, 15000);

  // メインループ開始
  gameLoop();
}

/** 敵の生成開始 */
function startEnemyGeneration() {
  if (enemyInterval) clearInterval(enemyInterval);
  
  // レベルに応じて敵の生成間隔を調整（レベルが上がるほど早く）
  const baseInterval = 1500;
  const intervalReduction = 100 * (level - 1);
  const interval = Math.max(baseInterval - intervalReduction, 800);
  
  enemyInterval = setInterval(spawnEnemy, interval);
}

/** タッチ開始 */
function handleTouchStart(e) {
  if (gamePaused) {
    togglePause();
    e.preventDefault();
    return;
  }

  const rect = canvas.getBoundingClientRect();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    // 下部20%で移動
    if (y >= canvas.height * 0.8) {
      if (movementTouchId === null) {
        movementTouchId = touch.identifier;
        if (x < canvas.width / 2) {
          player.dx = -player.speed;
        } else {
          player.dx = player.speed;
        }
      }
    } else {
      // 上部80%は発射
      shoot();
    }
  }
  e.preventDefault();
}

/** タッチ移動 */
function handleTouchMove(e) {
  const rect = canvas.getBoundingClientRect();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i];
    if (touch.identifier === movementTouchId) {
      const x = touch.clientX - rect.left;
      if (x < canvas.width / 2) {
        player.dx = -player.speed;
      } else {
        player.dx = player.speed;
      }
    }
  }
  e.preventDefault();
}

/** タッチ終了 */
function handleTouchEnd(e) {
  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i];
    if (touch.identifier === movementTouchId) {
      player.dx = 0;
      movementTouchId = null;
    }
  }
  e.preventDefault();
}

/** パワーアップアイテム生成 */
function spawnPowerup() {
  if (gameOver || gameClear || gamePaused) return;
  
  const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
  powerups.push({
    x: Math.random() * (canvas.width - 20),
    y: 0,
    width: 20,
    height: 20,
    speed: 1,
    type: type.name,
    color: type.color,
    text: type.text,
    rotation: 0
  });
}

/** 弾発射（パワーアップ状態に応じて変化） */
function shoot() {
  if (!player || gameOver || gameClear || gamePaused) return;
  
  // 通常弾の最大数（連射モードなら制限なし）
  const maxBullets = playerPowerupType === "rapidFire" ? 100 : 5;
  
  if (bullets.length < maxBullets) {
    // 基本弾
    bullets.push({
      x: player.x + player.width / 2 - 2.5,
      y: player.y,
      width: 5,
      height: 10,
      speed: 7,
      power: 1
    });
    
    // ワイドショットモードなら左右にも発射
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
    
    // 発射音 (現実的には実装時に音声ファイルが必要)
    // playSound('shoot');
  }
}

/** 敵生成 */
function spawnEnemy() {
  if (gameOver || gameClear || gamePaused) return;

  // レベルに応じて敵の出現確率を調整
  const levelMultiplier = 1 + (level - 1) * 0.1;
  
  // グレー敵の出現確率
  const grayProb = 0.2 * levelMultiplier;
  
  // オレンジ敵の出現確率（グレーの2倍）
  const orangeProb = grayProb * 2;
  
  // ジグザグ敵の出現確率（グレーの3倍）
  const zigzagProb = grayProb * 3;
  
  // 確率の合計
  const totalProb = grayProb + orangeProb + zigzagProb;
  
  // 0～1のランダムな数値
  const r = Math.random() * totalProb;
  
  if (r < grayProb) {
    // グレー敵
    spawnGrayEnemy();
  } else if (r < grayProb + orangeProb) {
    // オレンジ敵
    spawnOrangeEnemy();
  } else {
    // ジグザグ敵
    spawnZigzagEnemy();
  }
}

/** グレー敵の生成 */
function spawnGrayEnemy() {
  enemies.push({
    type: "gray",
    x: Math.random() * (canvas.width - 20),
    y: 0,
    width: 20,
    height: 20,
    speed: 1.5 + (level - 1) * 0.2,
    hp: 1  // 1発で倒せるように変更
  });
}

/** オレンジ敵の生成 */
function spawnOrangeEnemy() {
  enemies.push({
    type: "orange",
    x: Math.random() * (canvas.width - 20),
    y: 0,
    width: 20,
    height: 20,
    speed: 2 + (level - 1) * 0.3,
    hp: 1
  });
}

/** ジグザグ敵の生成 */
function spawnZigzagEnemy() {
  // ランダムな動きパターンを設定
  const movePattern = Math.floor(Math.random() * 3);
  const color = zigzagColors[Math.floor(Math.random() * zigzagColors.length)];
  
  enemies.push({
    type: "zigzag",
    x: Math.random() * (canvas.width -
