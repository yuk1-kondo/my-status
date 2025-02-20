document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded. Starting game.");

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // 画面サイズをやや小さめにして操作しやすく
  // (PCでもスマホでも大きすぎないように制限)
  canvas.width = Math.min(window.innerWidth * 0.8, 500);
  canvas.height = Math.min(window.innerHeight * 0.6, 350);

  const player = {
    x: canvas.width / 2,
    y: canvas.height - 30,
    width: 20,
    height: 20,
    speed: 5,
    dx: 0
  };

  let bullets = [];
  let enemies = [];
  let score = 0;
  let gameOver = false;
  let gameClear = false;
  const targetScore = 100; // スコア100点でクリア

  // 機種判定：スマホなら true
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  // PCの場合、タッチボタンを非表示
  if (!isMobile) {
    document.getElementById("controls").style.display = "none";
  } else {
    // スマホ用ボタン
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

  // PC向けキーボード操作
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") player.dx = -player.speed;
    if (e.key === "ArrowRight") player.dx = player.speed;
    if (e.key === " " || e.key === "Enter") shoot();
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") player.dx = 0;
  });

  // 弾を発射（最大5発まで）
  function shoot() {
    if (bullets.length < 5) {
      bullets.push({ x: player.x + player.width / 2, y: player.y, speed: 4 });
    }
  }

  // 敵を生成（ゆっくり移動）
  function spawnEnemy() {
    if (!gameOver && !gameClear) {
      const x = Math.random() * (canvas.width - 20);
      enemies.push({ x, y: 0, width: 20, height: 20, speed: 1.5 });
    }
  }

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

    // 敵移動
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
      showLocation();
    }

    draw();
  }

  // ゲームクリア時に「イマココ」を取得＆表示
  async function showLocation() {
    try {
      const response = await fetch("location.json?nocache=" + Date.now());
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      document.getElementById("status").textContent = data.status;
      document.getElementById("lastUpdated").textContent = new Date().toLocaleString("ja-JP");
    } catch (error) {
      document.getElementById("status").textContent = "取得失敗";
      document.getElementById("lastUpdated").textContent = "-";
    }

    // 敵や弾を消して画面をスッキリ
    enemies = [];
    bullets = [];

    // スマホ用ボタンも隠す
    document.getElementById("controls").style.display = "none";

    // 0.5秒後に「イマココ」オーバーレイを表示
    setTimeout(() => {
      document.getElementById("locationContainer").style.display = "block";
    }, 500);
  }

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

    // スコア
    ctx.fillStyle = "green";
    ctx.font = "16px Arial";
    ctx.fillText("Score: " + score, 10, 20);

    // ゲームオーバー
    if (gameOver) {
      ctx.fillStyle = "red";
      ctx.font = "30px Arial";
      ctx.fillText("Game Over!", canvas.width / 2 - 80, canvas.height / 2);
    }

    // クリア
    if (gameClear) {
      ctx.fillStyle = "yellow";
      ctx.font = "30px Arial";
      ctx.fillText("You Win!", canvas.width / 2 - 60, canvas.height / 2);
    }
  }

  function gameLoop() {
    update();
    if (!gameOver && !gameClear) {
      requestAnimationFrame(gameLoop);
    }
  }

  setInterval(spawnEnemy, 1500);
  gameLoop();
});
