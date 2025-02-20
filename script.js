// グローバル変数（後でリセットできるように）
let canvas, ctx;
let player, bullets, enemies, score;
let gameOver, gameClear;
const targetScore = 10; // 10点でクリア

// ゲームループ用のID（再スタート時にキャンセルできるように）
let gameLoopId = null;

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded.");
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  // 画面サイズは固定：320×240
  canvas.width = 320;
  canvas.height = 240;

  // スマホ判定
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  if (!isMobile) {
    document.getElementById("controls").style.display = "none";
  } else {
    // スマホ用ボタンのタッチ操作
    const leftBtn = document.getElementById("leftBtn");
    const rightBtn = document.getElementById("rightBtn");
    const shootBtn = document.getElementById("shootBtn");
    leftBtn.addEventListener("touchstart", () => player.dx = -player.speed);
    rightBtn.addEventListener("touchstart", () => player.dx = player.speed);
    shootBtn.addEventListener("touchstart", shoot);
    document.querySelectorAll(".button").forEach(button => {
      button.addEventListener("touchend", () => player.dx = 0);
    });
  }

  // PC用キーボード操作
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") player.dx = -player.speed;
    if (e.key === "ArrowRight") player.dx = player.speed;
    if (e.key === " " || e.key === "Enter") shoot();
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") player.dx = 0;
  });

  // スタートボタンのクリックイベント
  document.getElementById("startBtn").addEventListener("click", () => {
    document.getElementById("overlay").style.display = "none";
    initGame();
  });
});

// ゲームの初期化
function initGame() {
  // プレイヤー、弾、敵、スコア、状態を初期化
  player = {
    x: canvas.width / 2,
    y: canvas.height - 30,
    width: 20,
    height: 20,
    speed: 5,
    dx: 0
  };
  bullets = [];
  enemies = [];
  score = 0;
  gameOver = false;
  gameClear = false;

  // キャンバスとイマドコカード・操作ボタンの表示状態を調整
  canvas.style.display = "block";
  document.getElementById("locationCard").style.display = "none";
  // スマホ用操作ボタン（既に非表示ならそのまま）
  if (/Mobi|Android/i.test(navigator.userAgent)) {
    document.getElementById("controls").style.display = "flex";
  }

  // 敵生成のタイマー（1.5秒ごと）
  setInterval(spawnEnemy, 1500);

  // ゲームループ開始
  gameLoop();
}

// 弾を発射（最大5発）
function shoot() {
  if (bullets.length < 5) {
    bullets.push({ x: player.x + player.width / 2, y: player.y, speed: 4 });
  }
}

// 敵を生成
function spawnEnemy() {
  if (!gameOver && !gameClear) {
    const x = Math.random() * (canvas.width - 20);
    enemies.push({ x, y: 0, width: 20, height: 20, speed: 1.5 });
  }
}

// ゲーム更新処理
function update() {
  if (gameOver || gameClear) return;

  // プレイヤー移動
  player.x += player.dx;
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

  // 弾の移動
  bullets.forEach((bullet, i) => {
    bullet.y -= bullet.speed;
    if (bullet.y < 0) bullets.splice(i, 1);
  });

  // 敵の移動
  enemies.forEach((enemy, i) => {
    enemy.y += enemy.speed;
    if (enemy.y > canvas.height) {
      gameOver = true;
    }
  });

  // 衝突判定（弾 vs 敵）
  bullets.forEach((bullet, bi) => {
    enemies.forEach((enemy, ei) => {
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + 5 > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + 10 > enemy.y
      ) {
        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
        score += 10;
      }
    });
  });

  // クリア判定
  if (score >= targetScore && !gameClear) {
    gameClear = true;
    onGameClear();
  }
  draw();
}

// 描画処理
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // プレイヤー（三角形）
  ctx.fillStyle = "cyan";
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + player.width / 2, player.y - player.height);
  ctx.lineTo(player.x + player.width, player.y);
  ctx.closePath();
  ctx.fill();

  // 弾
  ctx.fillStyle = "white";
  bullets.forEach(bullet => {
    ctx.fillRect(bullet.x, bullet.y, 5, 10);
  });

  // 敵
  ctx.fillStyle = "red";
  enemies.forEach(enemy => {
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  });

  // スコア表示
  ctx.fillStyle = "green";
  ctx.font = "16px Arial";
  ctx.fillText("Score: " + score, 10, 20);

  // ゲームオーバー表示
  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "30px Arial";
    ctx.fillText("Game Over!", canvas.width / 2 - 80, canvas.height / 2);
  }

  // クリア表示
  if (gameClear) {
    ctx.fillStyle = "yellow";
    ctx.font = "30px Arial";
    ctx.fillText("You Win!", canvas.width / 2 - 60, canvas.height / 2);
  }
}

// ゲームループ
function gameLoop() {
  update();
  if (!gameOver && !gameClear) {
    gameLoopId = requestAnimationFrame(gameLoop);
  }
}

// ゲームクリア時の処理
function onGameClear() {
  console.log("Game Cleared!");
  // 敵と弾をクリア
  enemies = [];
  bullets = [];

  // キャンバスとスマホ用操作ボタンを非表示
  canvas.style.display = "none";
  document.getElementById("controls").style.display = "none";

  // 「イマドコ」カードを表示（JSON取得）
  fetchLocationCard();
}

// 「イマドコ」カードのデータ取得と表示
async function fetchLocationCard() {
  try {
    const response = await fetch("location.json?nocache=" + Date.now());
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    document.getElementById("status").textContent = data.status;
    document.getElementById("lastUpdated").textContent = new Date().toLocaleString("ja-JP");
  } catch (e) {
    document.getElementById("status").textContent = "取得失敗";
    document.getElementById("lastUpdated").textContent = "-";
  }
  // 「イマドコ」カードを表示
  document.getElementById("locationCard").style.display = "block";
  // ゲームオーバー状態でもリスタートできるよう、オーバーレイにリスタートボタンを表示
  showRestartOverlay();
}

// リスタート用オーバーレイの表示
function showRestartOverlay() {
  const overlay = document.getElementById("overlay");
  overlay.innerHTML = `<button id="restartBtn">Restart Game</button>`;
  overlay.style.display = "flex";
  document.getElementById("restartBtn").addEventListener("click", () => {
    overlay.style.display = "none";
    // 再初期化してゲームスタート
    initGame();
  });
}
