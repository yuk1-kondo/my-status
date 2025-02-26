// 定数・グローバル変数
const targetScore = 10; // ゲームクリア条件
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
  
  // 初回リスタートボタン（locationCard内の「もう一度プレイ」）も設定
  const restartBtn = document.getElementById("restartBtn");
  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
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
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  if (isMobile) {
    canvas.width = windowWidth;
    canvas.height = Math.min(windowHeight, windowWidth * 1.6);
  } else {
    canvas.width = Math.min(windowWidth, 640);
    canvas.height = Math.min(windowHeight, 480);
  }
  
  if (canvas.height < windowHeight) {
    canvas.style.top = ((windowHeight - canvas.height) / 2) + "px";
  } else {
    canvas.style.top = "0";
  }
  
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
  // 垂直差が小さい場合、最低値を与えて真横発射を防止
  let vDiff = playerCenterY - enemyCenterY;
  if (vDiff < 10) vDiff = 10;
  const hDiff = playerCenterX - enemyCenterX;
  const angle = Math.atan2(vDiff, hDiff);
  
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
    const rand = Math.random();
    if (rand < 0.2) {
      spawnEnemy("gray");
    } else if (rand < 0.6) {
      spawnEnemy("orange");
    } else {
      spawnEnemy("zigzag");
    }
  }, interval);
}

function spawnEnemy(type) {
  const width = 20;
  const x = Math.random() * (canvas.width - width);
  
  let enemy = {
    x: x,
    y: -20,
    width: width,
    height: 20,
    type: type,
    hp: type === "zigzag" ? 3 : 1,
    frameCount: 0
  };
  
  if (type === "gray") {
    enemy.speed = 1.5 + Math.random() * 0.5;
    enemy.score = 10;
  } else if (type === "orange") {
    enemy.speed = 2 + Math.random() * 1;
    enemy.score = -5;
    if (Math.random() < 0.3) {
      enemy.canShoot = true;
      enemy.shootInterval = 100 + Math.floor(Math.random() * 50);
    }
  } else if (type === "zigzag") {
    enemy.speed = 2.5 + Math.random() * 1.5;
    enemy.amplitude = 30 + Math.random() * 20;
    enemy.frequency = 0.05 + Math.random() * 0.03;
    enemy.startX = x;
    enemy.score = -10;
    enemy.currentColor = zigzagColors[Math.floor(Math.random() * zigzagColors.length)];
    enemy.colorChangeRate = 10 + Math.floor(Math.random() * 20);
  }
  
  enemies.push(enemy);
}

function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    enemy.frameCount++;
    
    if (enemy.type === "gray") {
      enemy.y += enemy.speed;
    } else if (enemy.type === "orange") {
      enemy.y += enemy.speed;
      if (enemy.canShoot && enemy.frameCount % enemy.shootInterval === 0) {
        spawnEnemyBullet(enemy);
      }
    } else if (enemy.type === "zigzag") {
      enemy.y += enemy.speed;
      enemy.x = enemy.startX + Math.sin(enemy.y * enemy.frequency) * enemy.amplitude;
      if (enemy.frameCount % enemy.colorChangeRate === 0) {
        enemy.currentColor = zigzagColors[Math.floor(Math.random() * zigzagColors.length)];
      }
    }
    
    if (enemy.y > canvas.height) {
      enemies.splice(i, 1);
      continue;
    }
    
    if (enemy.type === "gray" || enemy.type === "orange") {
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

function isColliding(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

function checkCollisions() {
  if (playerInvincible) {
    invincibleTimer--;
    if (invincibleTimer <= 0) {
      playerInvincible = false;
    }
  }
  
  // 弾と敵の衝突判定
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      if (isColliding(bullet, enemy)) {
        enemy.hp -= bullet.power;
        bullets.splice(i, 1);
        if (enemy.hp <= 0) {
          score += enemy.score;
          createExplosion(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2,
            enemy.type === "zigzag" ? enemy.currentColor : "#ffcc00"
          );
          enemies.splice(j, 1);
          if (score >= level * 20 && level < 5) {
            level++;
            startEnemyGeneration();
          }
        }
        break;
      }
    }
  }
  
  // プレイヤーと敵および敵の弾との衝突（無敵中は判定しない）
  if (!playerInvincible) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      if (isColliding(player, enemy)) {
        lives--;
        createExplosion(
          player.x + player.width / 2,
          player.y + player.height / 2,
          "#ffffff",
          20
        );
        playerInvincible = true;
        invincibleTimer = 120;
        enemies.splice(i, 1);
        if (lives <= 0) {
          gameOver = true;
          endGame();
          return;
        }
      }
    }
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const bullet = enemyBullets[i];
      if (isColliding(player, bullet)) {
        lives--;
        createExplosion(
          player.x + player.width / 2,
          player.y + player.height / 2,
          "#ff3333",
          20
        );
        playerInvincible = true;
        invincibleTimer = 120;
        enemyBullets.splice(i, 1);
        if (lives <= 0) {
          gameOver = true;
          endGame();
          return;
        }
      }
    }
  }
  
  // プレイヤーとパワーアップの衝突判定
  for (let i = powerups.length - 1; i >= 0; i--) {
    const powerup = powerups[i];
    if (isColliding(player, powerup)) {
      playerPowerupType = powerup.type;
      powerupTimer = 600;
      let pu = powerupTypes.find(p => p.name === powerup.type);
      if (pu) {
        showPowerupNotification(pu.text);
      }
      powerups.splice(i, 1);
    }
  }
}

function togglePause() {
  gamePaused = !gamePaused;
  if (!gamePaused) {
    gameLoop();
  }
}

function handleTouchStart(e) {
  e.preventDefault();
  for (let touch of e.changedTouches) {
    let rect = canvas.getBoundingClientRect();
    let touchY = touch.clientY - rect.top;
    if (touchY > canvas.height * 0.8) {
      movementTouchId = touch.identifier;
    } else {
      shoot();
    }
  }
}

function handleTouchMove(e) {
  e.preventDefault();
  for (let touch of e.changedTouches) {
    if (touch.identifier === movementTouchId) {
      let rect = canvas.getBoundingClientRect();
      let touchX = touch.clientX - rect.left;
      player.x = touchX - player.width / 2;
      if (player.x < 0) player.x = 0;
      if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    }
  }
}

function handleTouchEnd(e) {
  e.preventDefault();
  for (let touch of e.changedTouches) {
    if (touch.identifier === movementTouchId) {
      movementTouchId = null;
    }
  }
}

function showPowerupNotification(text) {
  const notification = document.getElementById("powerupNotification");
  notification.textContent = text;
  notification.style.display = "block";
  setTimeout(() => {
    notification.style.display = "none";
  }, 2000);
}

function endGame() {
  gamePaused = true;
  if (enemyInterval) clearInterval(enemyInterval);
  if (powerupInterval) clearInterval(powerupInterval);
  const overlay = document.getElementById("overlay");
  overlay.innerHTML = `
    <div class="instructions">
      <h2>GAME OVER</h2>
      <p>残機がなくなりました。</p>
      <button id="restartBtn">リスタート</button>
    </div>
  `;
  overlay.style.display = "flex";
  document.getElementById("restartBtn").addEventListener("click", () => {
    overlay.style.display = "none";
    initGame();
  });
}

function showLocationCard() {
  gamePaused = true;
  if (enemyInterval) clearInterval(enemyInterval);
  if (powerupInterval) clearInterval(powerupInterval);
  const locationCard = document.getElementById("locationCard");
  locationCard.style.display = "flex";
  
  // location.json を読み込み、内容を反映する
  fetch("location.json")
    .then(response => response.json())
    .then(data => {
      document.getElementById("status").textContent = data.status.trim();
      document.getElementById("lastUpdated").textContent = data.last_updated;
    })
    .catch(error => {
      console.error("location.json の読み込みに失敗しました:", error);
      document.getElementById("status").textContent = "情報取得失敗";
      document.getElementById("lastUpdated").textContent = new Date().toLocaleString();
    });
  
  // locationCard 内のリスタートボタンにイベントを設定
  document.getElementById("restartBtn").addEventListener("click", () => {
    locationCard.style.display = "none";
    document.getElementById("gameHUD").style.display = "block";
    initGame();
  });
}
