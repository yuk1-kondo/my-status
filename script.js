// スコア200点でクリア
const targetScore = 200;

// グローバル変数
let canvas, ctx;
let player, bullets, enemies, score;
let gameOver, gameClear;
let enemyInterval = null;  // 敵生成用 interval
let gameLoopId = null;     // ゲームループ用 ID

// スマホ用タッチ操作（下部20％で移動）
let movementTouchId = null;

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded.");

  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  // PC / スマホ判定に応じてキャンバスサイズを設定
  setCanvasSize();
  window.addEventListener("resize", setCanvasSize);

  // スタートボタン
  document.getElementById("startBtn").addEventListener("click", () => {
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

  // スマホ向けタッチ操作
  canvas.addEventListener("touchstart", handleTouchStart);
  canvas.addEventListener("touchmove", handleTouchMove);
  canvas.addEventListener("touchend", handleTouchEnd);
});

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
  if (gameLoopId) cancelAnimationFrame(gameLoopId);

  setCanvasSize();

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

  // メインループ開始
  gameLoop();
}

/** タッチ開始 */
function handleTouchStart(e) {
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

/** 弾発射（最大5発） */
function shoot() {
  if (!player) return;
  if (bullets.length < 5) {
    bullets.push({
      x: player.x + player.width / 2,
      y: player.y,
      speed: 4
    });
  }
}

/** 敵生成 */
function spawnEnemy() {
  if (gameOver || gameClear) return;

  // ざっくり大半(70%)をジグザグ敵、残り(30%)を既存の敵にする
  const r = Math.random();
  if (r < 0.7) {
    // 新規のジグザグ敵 (zigzag)
    enemies.push({
      type: "zigzag",
      x: Math.random() * (canvas.width - 20),
      y: 0,
      width: 20,
      height: 20,
      speed: 1.5,
      hp: 2,        // 2発必要
      zigzagDir: (Math.random() < 0.5) ? -1 : 1 // 左右ランダム
    });
  } else {
    // 従来の敵 (ダークグレー or オレンジ)
    const x = Math.random() * (canvas.width - 20);
    const type = (Math.random() < 0.7) ? 'gray' : 'orange';
    enemies.push({ x, y: 0, width: 20, height: 20, speed: 1.5, type });
  }
}

/** 更新処理 */
function update() {
  if (gameOver || gameClear) return;

  // プレイヤー移動
  player.x += player.dx;
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) {
    player.x = canvas.width - player.width;
  }

  // 弾移動
  bullets.forEach((bullet, i) => {
    bullet.y -= bullet.speed;
    if (bullet.y < 0) {
      bullets.splice(i, 1);
    }
  });

  // 敵移動＆処理
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];

    // 共通：下に落ちる
    enemy.y += enemy.speed;

    // ジグザグ移動
    if (enemy.type === "zigzag") {
      // 左右に移動
      enemy.x += enemy.zigzagDir * 2;
      // 画面端で反転
      if (enemy.x < 0) {
        enemy.x = 0;
        enemy.zigzagDir *= -1;
      }
      if (enemy.x + enemy.width > canvas.width) {
        enemy.x = canvas.width - enemy.width;
        enemy.zigzagDir *= -1;
      }
      // 下まで到達したら何もせず削除
      if (enemy.y > player.y) {
        enemies.splice(i, 1);
        continue;
      }
      // プレイヤーと衝突判定
      const ex = enemy.x + enemy.width / 2;
      const ey = enemy.y + enemy.height / 2;
      const ax = player.x, ay = player.y;
      const bx = player.x + player.width / 2, by = player.y - player.height;
      const cx = player.x + player.width, cy = player.y;
      if (isPointInTriangle(ex, ey, ax, ay, bx, by, cx, cy)) {
        // 衝突したらスコア -10
        score -= 10;
        // 敵は消える
        enemies.splice(i, 1);
        continue;
      }
    } else {
      // 従来敵 (gray/orange)
      // もしプレイヤー底より下なら削除
      if (enemy.y > player.y) {
        enemies.splice(i, 1);
        continue;
      }
      // gray敵ならプレイヤー衝突→ゲームオーバー
      if (enemy.type === "gray") {
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
  }

  // 弾 vs 敵の衝突判定
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const bullet = bullets[bi];
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const enemy = enemies[ei];
      const hitX = bullet.x < enemy.x + enemy.width && bullet.x + 5 > enemy.x;
      const hitY = bullet.y < enemy.y + enemy.height && bullet.y + 10 > enemy.y;
      if (hitX && hitY) {
        // 弾を削除
        bullets.splice(bi, 1);

        // 敵の種類別処理
        if (enemy.type === "zigzag") {
          // HPを減らし、まだ残っていれば続行
          enemy.hp--;
          if (enemy.hp <= 0) {
            // 倒したらスコア -10
            score -= 10;
            enemies.splice(ei, 1);
          }
        } else if (enemy.type === "gray") {
          // ダークグレーは +10
          score += 10;
          enemies.splice(ei, 1);
        } else if (enemy.type === "orange") {
          // オレンジは -5
          score -= 5;
          enemies.splice(ei, 1);
        }
        break;
      }
    }
  }

  // クリア判定 (200点)
  if (score >= targetScore && !gameClear) {
    gameClear = true;
    onGameClear();
  }

  draw();
}

/** 描画処理 */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // プレイヤー（三角形）：白塗り＋黒枠線
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

  // 弾は黒
  ctx.fillStyle = "#000000";
  bullets.forEach(bullet => {
    ctx.fillRect(bullet.x, bullet.y, 5, 10);
  });

  // 敵の描画
  enemies.forEach(enemy => {
    if (enemy.type === "zigzag") {
      // ジグザグ敵（白背景に映えるように濃い赤とかも可）
      // ここでは目立つように「#990000」にしてみる
      ctx.fillStyle = "#990000";
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    } else if (enemy.type === "gray") {
      ctx.fillStyle = "#333333";
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    } else if (enemy.type === "orange") {
      ctx.fillStyle = "#ffa500";
      ctx.beginPath();
      ctx.arc(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.width/2, 0, Math.PI*2);
      ctx.fill();
    }
  });

  // スコア表示（黒文字）
  ctx.fillStyle = "#000000";
  ctx.font = "16px Arial";
  ctx.fillText("Score: " + score, 10, 20);

  // ゲームオーバー表示
  if (gameOver) {
    ctx.fillStyle = "#000000";
    ctx.font = "30px Arial";
    ctx.fillText("Game Over!", canvas.width / 2 - 80, canvas.height / 2);
  }
  // クリア表示
  if (gameClear) {
    ctx.fillStyle = "#ffa500";
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
  if (enemyInterval) clearInterval(enemyInterval);
  canvas.style.display = "none";
  fetchLocationCard();
}

/** イマドコ情報を取得＆表示 */
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

/** 三角形内判定 (プレイヤー本体) */
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
