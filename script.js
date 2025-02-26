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
  canvas.addEventListener("touchstart", handleTouchStart);
  canvas.addEventListener("touchmove", handleTouchMove);
  canvas.addEventListener("touchend", handleTouchEnd);
});

function setCanvasSize() {
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  if (isMobile) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  } else {
    canvas.width = Math.min(window.innerWidth, 640);
    canvas.height = Math.min(window.innerHeight, 480);
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
  const angle = Math.atan2(playerCenterY - enemyCenterY, playerCenterX - enemyCenterX);
  enemyBullets.push({
    x: enemyCenterX - 2.5,
    y: enemyCenterY,
    width: 5,
    height: 10,
    dx: Math.cos(angle) * bulletSpeed,
    dy: Math.sin(angle) * bulletSpeed
  });
}

function updateEnemyBullets() {
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    let bullet = enemyBullets[i];
    bullet.x += bullet.dx;
    bullet.y += bullet.dy;
    if (bullet.y > canvas.height || bullet.x < 0 || bullet.x > canvas.width) {
      enemyBullets.splice(i, 1);
      continue;
    }
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  }
}

function spawnEnemy() {
  if (gameOver || gameClear || gamePaused) return;
  const levelMultiplier = 1 + (level - 1) * 0.1;
  const grayProb = 0.2 * levelMultiplier;
  const orangeProb = grayProb * 2;
  const zigzagProb = grayProb * 3;
  const totalProb = grayProb + orangeProb + zigzagProb;
  const r = Math.random() * totalProb;
  if (r < grayProb) {
    spawnGrayEnemy();
  } else if (r < grayProb + orangeProb) {
    spawnOrangeEnemy();
  } else {
    spawnZigzagEnemy();
  }
}

function spawnGrayEnemy() {
  enemies.push({
    type: "gray",
    x: Math.random() * (canvas.width - 20),
    y: 0,
    width: 20,
    height: 20,
    speed: 1.5 + (level - 1) * 0.2,
    hp: 1
  });
}

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

function spawnZigzagEnemy() {
  const movePattern = Math.floor(Math.random() * 3);
  const color = zigzagColors[Math.floor(Math.random() * zigzagColors.length)];
  enemies.push({
    type: "zigzag",
    x: Math.random() * (canvas.width - 20),
    y: 0,
    width: 20,
    height: 20,
    speed: 2 + (level - 1) * 0.3,
    hp: 1,
    movePattern: movePattern,
    color: color,
    direction: Math.random() < 0.5 ? -1 : 1,
    shootCooldown: Math.floor(Math.random() * 100 + 100)
  });
}

function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    enemy.y += enemy.speed;
    if (enemy.type === "zigzag") {
      enemy.x += enemy.direction * 2;
      if (enemy.x < 0 || enemy.x + enemy.width > canvas.width) enemy.direction *= -1;
      enemy.shootCooldown--;
      if (enemy.shootCooldown <= 0 && player) {
        if (Math.random() < 0.3) {
          spawnEnemyBullet(enemy);
        }
        enemy.shootCooldown = Math.floor(Math.random() * 100 + 100);
      }
      ctx.fillStyle = enemy.color;
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    } else if (enemy.type === "gray") {
      ctx.drawImage(sprites.enemies.gray, enemy.x, enemy.y, enemy.width, enemy.height);
    } else if (enemy.type === "orange") {
      ctx.drawImage(sprites.enemies.orange, enemy.x, enemy.y, enemy.width, enemy.height);
    }
    if (enemy.y > canvas.height) {
      enemies.splice(i, 1);
      continue;
    }
  }
}

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

function updatePowerups() {
  for (let i = powerups.length - 1; i >= 0; i--) {
    let powerup = powerups[i];
    powerup.y += powerup.speed;
    if (powerup.y > canvas.height) {
      powerups.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.translate(powerup.x + powerup.width / 2, powerup.y + powerup.height / 2);
    ctx.rotate(powerup.rotation);
    ctx.drawImage(sprites.powerups[powerup.type], -powerup.width / 2, -powerup.height / 2, powerup.width, powerup.height);
    ctx.restore();
    powerup.rotation += 0.05;
  }
}

function updateParticles() {
  // パーティクルエフェクト実装（必要に応じて）
}

function checkCollisions() {
  // 弾と敵の衝突判定
  for (let i = bullets.length - 1; i >= 0; i--) {
    let bullet = bullets[i];
    for (let j = enemies.length - 1; j >= 0; j--) {
      let enemy = enemies[j];
      if (bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y) {
        enemies.splice(j, 1);
        bullets.splice(i, 1);
        score += enemy.type === "gray" ? 10 : enemy.type === "orange" ? -5 : -10;
        break;
      }
    }
  }
  
  // 敵とプレイヤーの衝突判定
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    if (player.x < enemy.x + enemy.width &&
        player.x + player.width > enemy.x &&
        player.y < enemy.y + enemy.height &&
        player.y + player.height > enemy.y) {
      enemies.splice(i, 1);
      if (playerPowerupType !== "shield") {
        lives--;
        if (lives <= 0) {
          gameOver = true;
          alert("Game Over");
        }
      }
    }
  }
  
  // 敵弾とプレイヤーの衝突判定
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    let bullet = enemyBullets[i];
    if (bullet.x < player.x + player.width &&
        bullet.x + bullet.width > player.x &&
        bullet.y < player.y + player.height &&
        bullet.y + bullet.height > player.y) {
      enemyBullets.splice(i, 1);
      if (playerPowerupType !== "shield") {
        lives--;
        if (lives <= 0) {
          gameOver = true;
          alert("Game Over");
        }
      }
    }
  }
  
  // パワーアップアイテム取得判定
  for (let i = powerups.length - 1; i >= 0; i--) {
    let powerup = powerups[i];
    if (player.x < powerup.x + powerup.width &&
        player.x + player.width > powerup.x &&
        player.y < powerup.y + powerup.height &&
        player.y + player.height > powerup.y) {
      playerPowerupType = powerup.type;
      powerupTimer = 500;
      powerups.splice(i, 1);
      showPowerupNotification(powerup.text);
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

function startEnemyGeneration() {
  if (enemyInterval) clearInterval(enemyInterval);
  const baseInterval = 1500;
  const intervalReduction = 100 * (level - 1);
  const interval = Math.max(baseInterval - intervalReduction, 800);
  enemyInterval = setInterval(spawnEnemy, interval);
}

function togglePause() {
  if (gameOver || gameClear) return;
  gamePaused = !gamePaused;
  if (gamePaused) {
    cancelAnimationFrame(gameLoopId);
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PAUSE", canvas.width / 2, canvas.height / 2);
    ctx.font = "16px Arial";
    ctx.fillText("Press P to resume", canvas.width / 2, canvas.height / 2 + 40);
  } else {
    gameLoop();
  }
}

// タッチ操作
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
    if (y >= canvas.height * 0.8) {
      if (movementTouchId === null) {
        movementTouchId = touch.identifier;
        player.dx = x < canvas.width / 2 ? -player.speed : player.speed;
      }
    } else {
      shoot();
    }
  }
  e.preventDefault();
}

function handleTouchMove(e) {
  const rect = canvas.getBoundingClientRect();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i];
    if (touch.identifier === movementTouchId) {
      const x = touch.clientX - rect.left;
      player.dx = x < canvas.width / 2 ? -player.speed : player.speed;
    }
  }
  e.preventDefault();
}

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

// ゲームクリア時のイマココ表示（location.jsonを取得）
function showLocationCard() {
  fetch('location.json')
    .then(response => response.json())
    .then(data => {
      document.getElementById("status").textContent = data.status;
      document.getElementById("lastUpdated").textContent = data.last_updated;
      document.getElementById("locationCard").style.display = "block";
    })
    .catch(error => {
      console.error("Error fetching location.json: ", error);
      document.getElementById("locationCard").style.display = "block";
    });
}
