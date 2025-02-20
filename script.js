const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 画面サイズを調整
canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.7;

// プレイヤー設定
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
const targetScore = 100; // 100点でゲームクリア

// "イマココ"の表示エリアを非表示にする
document.getElementById("locationContainer").style.display = "none";

// 仮想ボタンイベント（スマホ用）
document.getElementById("leftBtn").addEventListener("touchstart", () => player.dx = -player.speed);
document.getElementById("rightBtn").addEventListener("touchstart", () => player.dx = player.speed);
document.getElementById("shootBtn").addEventListener("touchstart", shoot);
document.querySelectorAll(".button").forEach(button => {
    button.addEventListener("touchend", () => player.dx = 0);
});

// キーボード対応
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") player.dx = -player.speed;
    if (e.key === "ArrowRight") player.dx = player.speed;
    if (e.key === " ") shoot();
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") player.dx = 0;
});

// 弾を発射
function shoot() {
    if (bullets.length < 5) { // 最大5発まで
        bullets.push({ x: player.x + player.width / 2, y: player.y, speed: 4 });
    }
}

// 敵を生成（難易度を簡単にするため遅めに）
function spawnEnemy() {
    if (!gameOver && !gameClear) {
        const x = Math.random() * (canvas.width - 20);
        enemies.push({ x, y: 0, width: 20, height: 20, speed: 1.5 }); // 敵の速度を遅くする
    }
}

// ゲーム更新
function update() {
    if (gameOver || gameClear) return;

    // プレイヤー移動
    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // 弾の移動
    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.y < 0) bullets.splice(index, 1);
    });

    // 敵の移動
    enemies.forEach((enemy, index) => {
        enemy.y += enemy.speed;
        if (enemy.y > canvas.height) gameOver = true;
    });

    // 衝突判定（弾と敵）
    bullets.forEach((bullet, bIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + 5 > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + 10 > enemy.y
            ) {
                enemies.splice(eIndex, 1);
                bullets.splice(bIndex, 1);
                score += 10;
            }
        });
    });

    // ゲームクリア判定
    if (score >= targetScore && !gameClear) {
        gameClear = true;
        showLocation(); // クリア時に位置情報を表示
    }

    draw();
}

// "イマココ"の場所を取得＆表示
async function showLocation() {
    try {
        const response = await fetch("location.json?nocache=" + Date.now());
        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();
        document.getElementById("status").textContent = data.status;
        document.getElementById("lastUpdated").textContent = new Date().toLocaleString("ja-JP");

        // 1秒後に"イマココ"を表示
        setTimeout(() => {
            document.getElementById("locationContainer").style.display = "block";
        }, 1000);
    } catch (error) {
        document.getElementById("status").textContent = "取得失敗";
        document.getElementById("lastUpdated").textContent = "-";
    }
}

// 描画処理
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // プレイヤー
    ctx.fillStyle = "cyan";
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + player.width / 2, player.y - player.height);
    ctx.lineTo(player.x + player.width, player.y);
    ctx.closePath();
    ctx.fill();

    // 弾
    ctx.fillStyle = "white";
    bullets.forEach((bullet) => ctx.fillRect(bullet.x, bullet.y, 5, 10));

    // 敵
    ctx.fillStyle = "red";
    enemies.forEach((enemy) => ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height));

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

    // ゲームクリア表示
    if (gameClear) {
        ctx.fillStyle = "yellow";
        ctx.font = "30px Arial";
        ctx.fillText("You Win!", canvas.width / 2 - 60, canvas.height / 2);
    }
}

// ループ処理
function gameLoop() {
    update();
    if (!gameOver && !gameClear) requestAnimationFrame(gameLoop);
}

// 敵を定期的に出現（難易度を下げるため出現間隔を遅めに）
setInterval(spawnEnemy, 1500);
gameLoop();