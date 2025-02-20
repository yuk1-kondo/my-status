document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, starting game...");

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // 画面を小さめに固定（320×240）
  canvas.width = 320;
  canvas.height = 240;

  // プレイヤー初期設定
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
  const targetScore = 10; // ★ 10点でクリアに設定

  // スマホ判定（ユーザーエージェント）
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  // PCならタッチボタンを非表示に
  if (!isMobile) {
    document.getElementById("controls").style.display = "none";
  } else {
    // スマホの場合、タッチ操作を設定
    const leftBtn = document.getElementById("leftBtn");
    const rightBtn = document.getElementById("rightBtn");
    const shootBtn = document.getElementById("shootBtn");

    leftBtn.addEventListener("touchstart", () => player.dx = -player.speed);
    rightBtn.addEventListener("touchstart", () => player.dx = player.speed);
    shootBtn.addEventListener("touchstart", shoot);

    // 指を離したら停止
    document.querySelectorAll(".button").forEach(button => {
      button.addEventListener("touchend", () => player.dx = 0);
    });
  }

  // PC向けキーボード操作
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") player.dx = -player.speed;
    if (e.key === "ArrowRight") player.dx = player.speed;
    // スペースかエンターで弾発射
    if (e.key === " " || e.key === "Enter") shoot();
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") player.dx = 0;
  });

  // 弾を発射（最大5発）
  function shoot() {
    if (bullets.length < 5) {
      bullets.push({ x: player.x + player.width / 2, y: player.y, speed: 4 });
    }
  }

  // 敵を生成（1.5秒ごと、ゆっくり移動）
  function spawnEnemy() {
    if (!gameOver && !gameClear) {
      const x = Math.random() * (canvas.width - 20);
      enemies.push({ x, y: 0, width: 20, height: 20, speed: 1.5 });
    }
  }

  // メインループでゲームを更新
  function update() {
    if (gameOver || gameClear) return;

    // プレイヤー移動
    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) {
      player.x = canvas.width - player.width;
    }

    // 弾の移動
    bullets.forEach((bullet, i) => {
      bullet.y -= bullet.speed;
      if (bullet.y < 0) bullets.splice(i, 1);
    });

    // 敵の移動
    enemies.forEach((enemy, i) => {
      enemy.y += enemy.speed;
      // 画面下に到達でゲームオーバー
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

    // クリア判定（スコア10点でクリア）
    if (score >= targetScore && !gameClear) {
      gameClear = true;
      onGameClear();
    }

    draw();
  }

  // クリア時の処理
  function onGameClear() {
    console.log("Game Cleared!");
    // 敵・弾を消す
    enemies = [];
    bullets = [];

    // キャンバスを非表示
    canvas.style.display = "none";
    // スマホ用ボタンも隠す
    document.getElementById("controls").style.display = "none";

    // イマココ情報を取得し、カードを表示
    fetchLocationCard();
  }

  // 「イマココ」カードの表示
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

    // locationCard を表示
    document.getElementById("locationCard").style.display = "block";
  }

  // 描画
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // プレイヤー（青い三角形）
    ctx.fillStyle = "cyan";
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + player.width / 2, player.y - player.height);
    ctx.lineTo(player.x + player.width, player.y);
    ctx.closePath();
    ctx.fill();

    // 弾
    ctx.fillStyle = "white";
    bullets.forEach(b => {
      ctx.fillRect(b.x, b.y, 5, 10);
    });

    // 敵
    ctx.fillStyle = "red";
    enemies.forEach(e => {
      ctx.fillRect(e.x, e.y, e.width, e.height);
    });

    // スコア表示
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

  // メインループ
  function gameLoop() {
    update();
    // クリア or オーバーなら停止
    if (!gameOver && !gameClear) {
      requestAnimationFrame(gameLoop);
    }
  }

  // 1.5秒ごとに敵を生成
  setInterval(spawnEnemy, 1500);

  gameLoop();
});
