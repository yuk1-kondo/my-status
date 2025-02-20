// グローバル変数
let canvas, ctx;
let player, bullets, enemies, score;
let gameOver, gameClear;
const targetScore = 50; // 50点でクリア
let enemyInterval = null;  // 敵生成用 interval
let gameLoopId = null;     // ゲームループ用 ID

// タッチ操作用：移動用タッチ識別
let movementTouchId = null;

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded. Waiting for Start button...");

  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  // キャンバスサイズを設定 (PC or スマホ判定)
  setCanvasSize();
  window.addEventListener("resize", setCanvasSize);

  // スタートボタン押下でゲーム開始
  document.getElementById("startBtn").addEventListener("click", () => {
    console.log("Start button pressed. Initializing game...");
    document.getElementById("overlay").style.display = "none";
    initGame();
  });

  // PC向けキーボード操作
  document.addEventListener("keydown", (e) => {
    if (!player) return;
    if (e.key === "ArrowLeft") player.dx = -player.speed;
    if (e.key === "ArrowRight") player.dx = player.speed;
    if (e.key === " " || e.key === "Enter") shoot();
  });
  document.addEventListener("keyup", (e) => {
    if (!player) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") player.dx = 0;
  });

  // スマホ向け：キャンバスにタッチイベントを設定
  canvas.addEventListener("touchstart", handleTouchStart);
  canvas.addEventListener("touchmove", handleTouchMove);
  canvas.addEventListener("touchend", handleTouchEnd);
});

/** PC or スマホ判定し、キャンバスサイズを調整 */
function setCanvasSize() {
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  if (isMobile) {
    // スマホでは全画面
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  } else {
    // PCでは最大640×480に制限
    canvas.width = Math.min(window.innerWidth, 640);
    canvas.height = Math.min(window.innerHeight, 480);
  }
}

/** タッチ開始 */
function handleTouchStart(e) {
  const rect = canvas.getBoundingClientRect();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    // 下部20％を移動用エリアに
    const movementThreshold = canvas.height * 0.8;
    if (y >= movementThreshold) {
      // 移動タッチとして識別
      if (movementTouchId === null) {
        movementTouchId = touch.identifier;
        if (x < canvas.width / 2) {
          if (player) player.dx = -player.speed;
        } else {
          if (player) player.dx = player.speed;
        }
      }
    } else {
      // 上部はタップで発射
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
        if (player) player.dx = -player.speed;
      } else {
        if (player) player.dx = player.speed;
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
      if (player) player.dx = 0;
      movementTouchId = null;
    }
  }
  e.preventDefault();
}

/** ゲーム初期化 */
function initGame() {
  if (enemyInterval !== null) clearInterval(enemyInterval);
  if (gameLoopId !== null) cancelAnimationFrame(gameLoopId);

  // キャンバスサイズを最新化
  setCanvasSize();

  // プレイヤー・弾・敵・スコア初期化
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

  canvas.style.display = "block";
  document.getElementById("locationCard").style.display = "none";

  // 敵を1.5秒ごとに生成
  enemyInterval = setInterval(spawnEnemy, 1500);

  // ゲームループ開始
  gameLoop();
}

/** 弾発射（最大5発） */
function shoot() {
  if (!player) return;
  if (bullets.length < 5) {
    bullets.push({ x: player.x + player.width / 2, y: player.y, speed: 4 });
  }
}

/** 敵生成（70%ダークグレー四角、30%オレンジ丸） */
function spawnEnemy() {
  if (!gameOver && !gameClear) {
    const x = Math.random() * (canvas.width - 20);
    const type = (Math.random() < 0.7) ? 'gray' : 'orange';
    enemies.push({ x, y: 0, width: 20, height: 20, speed: 1.5, type });
  }
}

/** ゲーム更新処理 */
function update() {
  if (gameOver || gameClear) return;

  // プレイヤー移動
  player.x += player.dx;
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

  // 弾移動
  bullets.forEach((bullet, i) => {
    bullet.y -= bullet.speed;
    if (bullet.y < 0) bullets.splice(i, 1);
  });

  // 敵移動と処理
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    enemy.y += enemy.speed;
    // プレイヤー底より下なら削除
    if (enemy.y > player.y) {
      enemies.splice(i, 1);
      continue;
    }
    // ダークグレー敵なら三角形衝突チェック
    if (enemy.type === 'gray') {
      const ex = enemy.x + enemy.width / 2;
      const ey = enemy.y + enemy.height / 2;
      const ax = player.x, ay = player.y;
      const bx = player.x + player.width / 2, by = player.y - player.height;
      const cx = player.x + player.width, cy = player.y;
      if (isPointInTriangle(ex, ey, ax, ay, bx, by, cx, cy)) {
        gameOver = true;
      }
    }
  }

  // 衝突判定（弾 vs 敵）
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const bullet = bullets[bi];
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const enemy = enemies[ei];
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + 5 > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + 10 > enemy.y
      ) {
        // 当たったので削除
        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
        // ダークグレーは+10, オレンジは-5
        if (enemy.type === 'gray') {
          score += 10;
        } else {
          score -= 5;
        }
        break;
      }
    }
  }

  // クリア判定
  if (score >= targetScore && !gameClear) {
    gameClear = true;
    onGameClear();
  }
  draw();
}

/** 描画処理 */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // プレイヤー（三角形）: ホワイト塗り + ブラック枠線
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + player.width / 2, player.y - player.height);
  ctx.lineTo(player.x + player.width, player.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 弾はブラック
  ctx.fillStyle = "#000000";
  bullets.forEach(bullet => {
    ctx.fillRect(bullet.x, bullet.y, 5, 10);
  });

  // 敵描画：gray -> ダークグレー四角, orange -> オレンジ丸
  enemies.forEach(enemy => {
    if (enemy.type === "gray") {
      ctx.fillStyle = "#333333"; // ダークグレー
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    } else {
      ctx.fillStyle = "#ffa500"; // オレンジ
      ctx.beginPath();
      ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // スコア表示（黒文字）
  ctx.fillStyle = "#000000";
  ctx.font = "16px Arial";
  ctx.fillText("Score: " + score, 10, 20);

  // ゲームオーバー表示
  if (gameOver) {
    ctx.fillStyle = "#000000"; // 黒
    ctx.font = "30px Arial";
    ctx.fillText("Game Over!", canvas.width / 2 - 80, canvas.height / 2);
  }

  // クリア表示
  if (gameClear) {
    ctx.fillStyle = "#ffa500"; // オレンジ
    ctx.font = "30px Arial";
    ctx.fillText("You Win!", canvas.width / 2 - 60, canvas.height / 2);
  }
}

/** メインループ */
function gameLoop() {
  update();
  if (!gameOver && !gameClear) {
    gameLoopId = requestAnimationFrame(gameLoop);
  }
}

/** クリア時の処理 */
function onGameClear() {
  console.log("Game Cleared!");
  enemies = [];
  bullets = [];
  if (enemyInterval !== null) clearInterval(enemyInterval);
  // キャンバスを非表示し、「イマドコ」カードを表示
  canvas.style.display = "none";
  fetchLocationCard();
}

/** イマドコ情報を取得・表示 */
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
  document.getElementById("locationCard").style.display = "block";
}

/** 三角形内判定（プレイヤー本体） */
function isPointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const v0x = cx - ax, v0y = cy - ay;
  const v1x = bx - ax, v1y = by - ay;
  const v2x = px - ax, v2y = py - ay;
  const dot00 = v0x*v0x + v0y*v0y;
  const dot01 = v0x*v1x + v0y*v1y;
  const dot02 = v0x*v2x + v0y*v2y;
  const dot11 = v1x*v1x + v1y*v1y;
  const dot12 = v1x*v2x + v1y*v2y;
  const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
  const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
  const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
  return (u >= 0) && (v >= 0) && (u + v < 1);
}
