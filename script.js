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
const zigzagColors = ["#ff3366", "#33ccff", "#ff9900", "#66ff33", "#9933ff"];
const powerupTypes = [
  { name: "rapidFire", color: "#ffff00", text: "連射モード！" },
  { name: "wideShot", color: "#00ffff", text: "ワイドショット！" },
  { name: "shield", color: "#00ff00", text: "シールド！" }
];
let sprites = {
  player: null,
  enemies: {},
  bullets: null,
  powerups: {},
  explosions: []
};
// 敵の弾用
let enemyBullets = [];

/* スプライト画像の生成 */
function loadGameAssets() {
  // プレイヤー用スプライト
  sprites.player = document.createElement('canvas');
  sprites.player.width = 30;
  sprites.player.height = 40;
  let pCtx = sprites.player.getContext('2d');
  pCtx.fillStyle = "#4a5eff";
  pCtx.beginPath();
  pCtx.moveTo(15, 0);
  pCtx.lineTo(0, 25);
  pCtx.lineTo(30, 25);
  pCtx.closePath();
  pCtx.fill();
  pCtx.fillStyle = "#2233cc";
  pCtx.beginPath();
  pCtx.moveTo(0, 25);
  pCtx.lineTo(5, 15);
  pCtx.lineTo(15, 20);
  pCtx.lineTo(25, 15);
  pCtx.lineTo(30, 25);
  pCtx.closePath();
  pCtx.fill();
  pCtx.fillStyle = "#8ab3ff";
  pCtx.beginPath();
  pCtx.moveTo(15, 5);
  pCtx.lineTo(10, 18);
  pCtx.lineTo(20, 18);
  pCtx.closePath();
  pCtx.fill();
  pCtx.fillStyle = "#ff5500";
  pCtx.beginPath();
  pCtx.moveTo(10, 25);
  pCtx.lineTo(15, 35);
  pCtx.lineTo(20, 25);
  pCtx.closePath();
  pCtx.fill();
  pCtx.fillStyle = "#ffcc00";
  pCtx.beginPath();
  pCtx.moveTo(12, 25);
  pCtx.lineTo(15, 32);
  pCtx.lineTo(18, 25);
  pCtx.closePath();
  pCtx.fill();
  pCtx.fillStyle = "#ffffff";
  pCtx.beginPath();
  pCtx.arc(5, 20, 1, 0, Math.PI * 2);
  pCtx.fill();
  pCtx.beginPath();
  pCtx.arc(25, 20, 1, 0, Math.PI * 2);
  pCtx.fill();

  // グレー敵のスプライト
  sprites.enemies.gray = document.createElement('canvas');
  sprites.enemies.gray.width = 20;
  sprites.enemies.gray.height = 20;
  let grayCtx = sprites.enemies.gray.getContext('2d');
  grayCtx.fillStyle = "#aaaaaa";
  grayCtx.beginPath();
  grayCtx.moveTo(10, 0);
  grayCtx.lineTo(0, 10);
  grayCtx.lineTo(5, 15);
  grayCtx.lineTo(15, 15);
  grayCtx.lineTo(20, 10);
  grayCtx.closePath();
  grayCtx.fill();
  grayCtx.fillStyle = "#888888";
  grayCtx.beginPath();
  grayCtx.moveTo(0, 10);
  grayCtx.lineTo(3, 18);
  grayCtx.lineTo(17, 18);
  grayCtx.lineTo(20, 10);
  grayCtx.closePath();
  grayCtx.fill();
  grayCtx.fillStyle = "#666666";
  grayCtx.fillRect(8, 5, 4, 8);
  grayCtx.fillStyle = "#cccccc";
  grayCtx.beginPath();
  grayCtx.arc(10, 7, 2, 0, Math.PI * 2);
  grayCtx.fill();

  // オレンジ敵のスプライト
  sprites.enemies.orange = document.createElement('canvas');
  sprites.enemies.orange.width = 20;
  sprites.enemies.orange.height = 20;
  let orangeCtx = sprites.enemies.orange.getContext('2d');
  orangeCtx.fillStyle = "#ffa500";
  orangeCtx.beginPath();
  orangeCtx.ellipse(10, 10, 10, 6, 0, 0, Math.PI * 2);
  orangeCtx.fill();
  orangeCtx.fillStyle = "#ffcc00";
  orangeCtx.beginPath();
  orangeCtx.ellipse(10, 7, 5, 5, 0, 0, Math.PI * 2);
  orangeCtx.fill();
  orangeCtx.fillStyle = "#ff5500";
  for (let i = 0; i < 5; i++) {
    const angle = i * Math.PI / 2.5;
    orangeCtx.beginPath();
    orangeCtx.arc(10 + 8 * Math.cos(angle), 10 + 3 * Math.sin(angle), 1.5, 0, Math.PI * 2);
    orangeCtx.fill();
  }
  orangeCtx.fillStyle = "#ffffff";
  orangeCtx.fillRect(9.5, 0, 1, 4);
  orangeCtx.beginPath();
  orangeCtx.arc(10, 0, 1, 0, Math.PI * 2);
  orangeCtx.fill();

  // 弾のスプライト
  sprites.bullets = document.createElement('canvas');
  sprites.bullets.width = 5;
  sprites.bullets.height = 10;
  let bulletCtx = sprites.bullets.getContext('2d');
  const bulletGradient = bulletCtx.createLinearGradient(0, 0, 0, 10);
  bulletGradient.addColorStop(0, "#ffffff");
  bulletGradient.addColorStop(0.5, "#ffff00");
  bulletGradient.addColorStop(1, "#ff9900");
  bulletCtx.fillStyle = bulletGradient;
  bulletCtx.beginPath();
  bulletCtx.ellipse(2.5, 5, 2.5, 5, 0, 0, Math.PI * 2);
  bulletCtx.fill();
  bulletCtx.fillStyle = "rgba(255, 255, 255, 0.6)";
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

/* DOMContentLoaded時の初期化 */
document.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");
  loadGameAssets();
  setCanvasSize();
  window.addEventListener("resize", setCanvasSize);

  document.getElementById("startBtn").addEventListener("click", () => {
    document.getElementById("overlay").style.display = "none";
    document.getElementById("gameHUD").style.display = "block";
    initGame();
  });
  
  // リスタートボタン
  if (document.getElementById("restartBtn")) {
    document.getElementById("restartBtn").addEventListener("click", () => {
      document.getElementById("locationCard").style.display = "none";
      document.getElementById("gameHUD").style.display = "block";
      initGame();
    });
  }

  // キーボード操作
  document.addEventListener("keydown", (e) => {
    if (!player) return;
    if (e.key === "ArrowLeft") player.dx = -player.speed;
    if (e.key === "ArrowRight") player.dx = player.speed;
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
  
  // iOS用のスクロール防止
  document.body.addEventListener('touchmove', function(e) {
    if (e.target === canvas) {
      e.preventDefault();
    }
  }, { passive: false });
});

function setCanvasSize() {
  const isMobile = window.matchMedia("(max-width: 768px)").matches || /Mobi|Android/i.test(navigator.userAgent);
  
  // ウィンドウのサイズを取得（iOS Safariのアドレスバー等を考慮）
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  if (isMobile) {
    // モバイルの場合は画面いっぱいに（但し最大高さを制限）
    canvas.width = windowWidth;
    canvas.height = Math.min(windowHeight, windowWidth * 1.6); // アスペクト比の制限
  } else {
    // PCの場合は適切なサイズに
    canvas.width = Math.min(windowWidth, 640);
    canvas.height = Math.min(windowHeight, 480);
  }
  
  // 位置も中央に調整
  if (canvas.height < windowHeight) {
    canvas.style.top = ((windowHeight - canvas.height) / 2) + "px";
  } else {
    canvas.style.top = "0";
  }
  
  // すでにゲームが開始されていれば位置調整
  if (player) {
    player.x = Math.min(player.x, canvas.width - player.width);
    player.y = canvas.height - 40;
  }
}

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
    frameCount: 0
  };
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

  updateHUD();
  canvas.style.display = "block";
  document.getElementById("locationCard").style.display = "none";

  startEnemyGeneration();
  powerupInterval = setInterval(spawnPowerup, 15000);

  gameLoop();
}

function updateHUD() {
  document.getElementById("scoreDisplay").textContent = score;
  document.getElementById("livesDisplay").textContent = lives;
  document.getElementById("levelDisplay").textContent = level;
}

function gameLoop() {
  if (gamePaused || gameOver || gameClear) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updatePlayer();
  updateBullets();
  updateEnemies();
  updatePowerups();
  updateEnemyBullets();
  updateParticles();
  checkCollisions();
  updateHUD();

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
  ctx.drawImage(sprites.player, player.x, player.y, player.width, player.height);
  
  // シールド効果（緑のリング表示）
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

// 敵の弾：生成＆更新
function spawnEnemyBullet(enemy) {
  if (!player) return;
  const bulletSpeed = 4;
  const enemyCenterX = enemy.x + enemy.width / 2;
  const enemyCenterY = enemy.y + enemy.height;
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;
  
  // プレイヤーへの角度を計算
  const angle = Math.atan2(playerCenterY - enemyCenterY, playerCenterX - enemyCenterX);
  
  // 弾の速度成分を計算
  const vx = Math.cos(angle) * bulletSpeed;
  const vy = Math.sin(angle) * bulletSpeed;
  
  // 弾を生成
  enemyBullets.push({
    x: enemyCenterX - 2.5,
    y: enemyCenterY,
    width: 5,
    height: 5,
    vx: vx,
    vy: vy,
    speed: bulletSpeed,
    color: "#ff3366"
  });
}

function updateEnemyBullets() {
  // 敵の弾の更新と描画
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const bullet = enemyBullets[i];
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    
    // 画面外に出たら削除
    if (bullet.y > canvas.height || bullet.y < 0 || bullet.x < 0 || bullet.x > canvas.width) {
      enemyBullets.splice(i, 1);
      continue;
    }
    
    // 弾の描画
    ctx.fillStyle = bullet.color;
    ctx.beginPath();
    ctx.arc(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, bullet.width / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function startEnemyGeneration() {
  // レベルに応じて敵の生成間隔を調整
  const baseInterval = 2000 - (level * 200);
  const interval = Math.max(baseInterval, 500);
  
  if (enemyInterval) clearInterval(enemyInterval);
  enemyInterval = setInterval(() => {
    if (gamePaused || gameOver || gameClear) return;
    
    spawnEnemy();
    
    // レベルに応じて追加の敵を生成
    if (level >= 2) {
      setTimeout(() => {
        if (!gamePaused && !gameOver && !gameClear) spawnEnemy("orange");
      }, interval / 2);
    }
    
    if (level >= 3) {
      setTimeout(() => {
        if (!gamePaused && !gameOver && !gameClear) spawnEnemy("zigzag");
      }, interval / 3);
    }
  }, interval);
}

function spawnEnemy(type = null) {
  if (!type) {
    // ランダムに敵のタイプを決定
    const rand = Math.random();
    if (rand < 0.6) {
      type = "gray";
    } else if (rand < 0.8) {
      type = "orange";
    } else {
      type = "zigzag";
    }
  }
  
  const width = type === "zigzag" ? 30 : 20;
  const height = type === "zigzag" ? 30 : 20;
  const x = Math.random() * (canvas.width - width);
  
  let enemy = {
    x: x,
    y: -height,
    width: width,
    height: height,
    type: type,
    speed: type === "zigzag" ? 2 + Math.random() * 2 : 1 + Math.random() * 1.5,
    health: type === "zigzag" ? 2 : 1,
    color: type === "zigzag" ? zigzagColors[Math.floor(Math.random() * zigzagColors.length)] : null,
    dx: 0
  };
  
  // ジグザグの敵は横方向の動きを追加
  if (type === "zigzag") {
    enemy.dx = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random());
    enemy.zigzagTimer = 0;
    enemy.zigzagInterval = 30 + Math.floor(Math.random() * 30);
    enemy.shootInterval = 120;
    enemy.shootTimer = enemy.shootInterval;
  }
  
  enemies.push(enemy);
}

function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    enemy.y += enemy.speed;
    
    // ジグザグ敵の動き
    if (enemy.type === "zigzag") {
      enemy.zigzagTimer++;
      if (enemy.zigzagTimer >= enemy.zigzagInterval) {
        enemy.dx = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random());
        enemy.zigzagTimer = 0;
      }
      
      enemy.x += enemy.dx;
      // 画面端で跳ね返る
      if (enemy.x < 0 || enemy.x + enemy.width > canvas.width) {
        enemy.dx *= -1;
        enemy.x = Math.max(0, Math.min(canvas.width - enemy.width, enemy.x));
      }
      
      // ジグザグ敵は弾を発射
      enemy.shootTimer--;
      if (enemy.shootTimer <= 0 && player) {
        spawnEnemyBullet(enemy);
        enemy.shootTimer = enemy.shootInterval;
      }
    }
    
    // 画面外に出たら削除
    if (enemy.y > canvas.height) {
      enemies.splice(i, 1);
      continue;
    }
    
    // 敵の描画
    if (enemy.type === "zigzag") {
      ctx.fillStyle = enemy.color;
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      
      // 目の描画
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(enemy.x + 10, enemy.y + 10, 3, 0, Math.PI * 2);
      ctx.arc(enemy.x + 20, enemy.y + 10, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // 口の描画
      ctx.fillStyle = "#000000";
      ctx.fillRect(enemy.x + 10, enemy.y + 20, 10, 2);
    } else {
      ctx.drawImage(
        sprites.enemies[enemy.type],
        enemy.x,
        enemy.y,
        enemy.width,
        enemy.height
      );
    }
  }
}

function spawnPowerup() {
  if (gamePaused || gameOver || gameClear) return;
  
  // ランダムにパワーアップタイプを選択
  const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
  
  powerups.push({
    x: Math.random() * (canvas.width - 20),
    y: -20,
    width: 20,
    height: 20,
    type: type.name,
    speed: 1 + Math.random(),
    text: type.text
  });
}

function updatePowerups() {
  // パワーアップタイマーの更新
  if (playerPowerupType && powerupTimer > 0) {
    powerupTimer--;
    
    // タイマーが切れたらパワーアップを解除
    if (powerupTimer <= 0) {
      playerPowerupType = null;
    }
  }
  
  // パワーアップの更新と描画
  for (let i = powerups.length - 1; i >= 0; i--) {
    let powerup = powerups[i];
    powerup.y += powerup.speed;
    
    // 画面外に出たら削除
    if (powerup.y > canvas.height) {
      powerups.splice(i, 1);
      continue;
    }
    
    // パワーアップの描画
    ctx.drawImage(
      sprites.powerups[powerup.type],
      powerup.x,
      powerup.y,
      powerup.width,
      powerup.height
    );
  }
}

function checkCollisions() {
  // 無敵時間の更新
  if (playerInvincible) {
    invincibleTimer--;
    if (invincibleTimer <= 0) {
      playerInvincible = false;
    }
  }
  
  // プレイヤーの弾と敵の衝突判定
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        // 衝突処理
        enemy.health -= bullet.power;
        bullets.splice(i, 1);
        
        // パーティクル生成
        createParticles(bullet.x, bullet.y, 5, "#ffff00");
        
        if (enemy.health <= 0) {
          // スコア加算
          if (enemy.type === "gray") {
            score += 10;
          } else if (enemy.type === "orange") {
            score -= 5;
          } else if (enemy.type === "zigzag") {
            score -= 10;
          }
          
          // スコアが0未満にならないようにする
          score = Math.max(0, score);
          
          // 爆発エフェクト
          createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
          
          // 敵を削除
          enemies.splice(j, 1);
        }
        
        // スコアに応じてレベル調整
        updateLevel();
        
        break;
      }
    }
  }
  
  // プレイヤーと敵の衝突判定
  if (!playerInvincible) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      
      if (
        player.x < enemy.x + enemy.width &&
        player.x + player.width > enemy.x &&
        player.y < enemy.y + enemy.height &&
        player.y + player.height > enemy.y
      ) {
        // 衝突処理
        createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
        enemies.splice(i, 1);
        
        // ダメージ処理
        if (playerPowerupType === "shield") {
          // シールドで防御
          playerPowerupType = null;
          powerupTimer = 0;
        } else {
          // 残機減少
          lives--;
          
          // スコア減少（ジグザグ敵の場合はさらに減少）
          if (
