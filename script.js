document.addEventListener('DOMContentLoaded', () => {
    const startScreen = document.getElementById('start-screen');
    const yesBtn = document.getElementById('yes-btn');
    const noBtn = document.getElementById('no-btn');
    const canvas = document.getElementById('mazeCanvas');
    const ctx = canvas.getContext('2d');
    const winMessage = document.getElementById('win-message');
    
    // Audio Elements
    const bgMusic = document.getElementById('bg-music');
    const cheerSound = document.getElementById('cheer-sound');
    const sadSound = document.getElementById('sad-sound');

    let gameStarted = false;
    let gameWon = false;

    // =============== No Button Avoids Cursor ===============
    noBtn.addEventListener('click', (e) => {
        e.preventDefault();
        moveNoButton();
    });

    noBtn.addEventListener('mouseenter', () => {
        moveNoButton();
    });

    function moveNoButton() {
        const padding = 50; 
        
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const btnWidth = noBtn.offsetWidth;
        const btnHeight = noBtn.offsetHeight;

        const minX = padding;
        const maxX = screenWidth - btnWidth - padding;
        
        const minY = padding;
        const maxY = screenHeight - btnHeight - padding;

        const safeMaxX = Math.max(minX, maxX);
        const safeMaxY = Math.max(minY, maxY);

        const randomX = Math.floor(Math.random() * (safeMaxX - minX)) + minX;
        const randomY = Math.floor(Math.random() * (safeMaxY - minY)) + minY;

        noBtn.style.position = 'fixed';
        noBtn.style.left = `${randomX}px`;
        noBtn.style.top = `${randomY}px`;
    }

    // =============== Start Game on Yes ===============
    const infoScreen = document.getElementById('info-screen');
    const startGameBtn = document.getElementById('start-game-btn');

    yesBtn.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        infoScreen.classList.remove('hidden');
    });

    startGameBtn.addEventListener('click', () => {
        if (gameStarted) return;
        gameStarted = true;
        infoScreen.classList.add('hidden');
        document.addEventListener('keydown', movePlayer);
        
        // Play music when game starts
        bgMusic.volume = 0.5; 
        bgMusic.play().catch(error => console.log("Music play failed:", error));
        
        gameLoop();
    });

    // =============== Maze Code (19x19 Larger Maze) ===============
    // 0 = Path, 1 = Wall, 2 = YES (Exit), 3 = NO (Restart)
    const maze = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1], // Start (1,1)
        [1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 3, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2], // 3=NO (Left), 2=YES (Right)
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];

    const cellSize = 42; 
    
    canvas.width = maze[0].length * cellSize;
    canvas.height = maze.length * cellSize;

    let player = { x: 1, y: 1 };
    let particles = [];

    function createParticle(x, y) {
        particles.push({
            x: x * cellSize + cellSize / 2,
            y: y * cellSize + cellSize / 2,
            size: Math.random() * 4 + 4,
            opacity: 1,
            life: 40
        });
    }

    function drawParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = "pink";
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.arc(p.x - p.size / 2, p.y - p.size / 3, p.size / 3, 0, Math.PI, true);
            ctx.arc(p.x + p.size / 2, p.y - p.size / 3, p.size / 3, 0, Math.PI, true);
            ctx.lineTo(p.x, p.y + p.size / 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            p.y += 0.3;
            p.opacity -= 0.02;
            p.life--;
            if (p.life <= 0 || p.opacity <= 0) particles.splice(i, 1);
        }
    }

    const playerImg = new Image();
    playerImg.src = "ami.png";

    const exitImg = new Image();
    exitImg.src = "me.png";

    function drawMaze() {
        for (let row = 0; row < maze.length; row++) {
            for (let col = 0; col < maze[row].length; col++) {
                if (maze[row][col] === 1) {
                    const gradient = ctx.createLinearGradient(0, 0, cellSize, cellSize);
                    gradient.addColorStop(0, "#ff8fab");
                    gradient.addColorStop(0.5, "#9d4edd");
                    gradient.addColorStop(1, "#4cc9f0");
                    ctx.fillStyle = gradient;
                    ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
                } else {
                    ctx.fillStyle = "#ffe6eb";
                    ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
                    
                    ctx.font = "bold 14px Arial"; 
                    ctx.textAlign = "center";
                    
                    if (maze[row][col] === 2) {
                        ctx.fillStyle = "#e63946";
                        ctx.fillText("YES", col * cellSize + cellSize/2, row * cellSize + 15);
                    } else if (maze[row][col] === 3) {
                        ctx.fillStyle = "#555";
                        ctx.fillText("NO", col * cellSize + cellSize/2, row * cellSize + 15);
                    }
                }
            }
        }
        ctx.imageSmoothingEnabled = false;
        
        const exitX = maze[0].length - 2; 
        const exitY = maze.length - 2;
        
        ctx.drawImage(exitImg, exitX * cellSize, exitY * cellSize, cellSize, cellSize);
    }

    function drawPlayer() {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(playerImg, player.x * cellSize, player.y * cellSize, cellSize, cellSize);
    }

    function checkTile(x, y) {
        const tile = maze[y][x];
        if (tile === 2) { // YES - Player wins
            gameWon = true;
            winMessage.classList.remove('hidden');
            winMessage.classList.add('visible');
            
            // Play Cheer Sound
            cheerSound.volume = 0.8;
            cheerSound.play().catch(e => console.log("Cheer sound failed", e));
            
        } else if (tile === 3) { // NO - Reset
            player.x = 1;
            player.y = 1;
            
            // Play Sad Sound
            sadSound.volume = 0.8;
            sadSound.currentTime = 0; // Reset sound to start if played rapidly
            sadSound.play().catch(e => console.log("Sad sound failed", e));
        }
    }

    function movePlayer(e) {
        if (gameWon) return;
        let newX = player.x;
        let newY = player.y;

        createParticle(player.x, player.y);

        switch (e.key) {
            case 'ArrowUp': newY--; break;
            case 'ArrowDown': newY++; break;
            case 'ArrowLeft': newX--; break;
            case 'ArrowRight': newX++; break;
        }

        if (maze[newY] && maze[newY][newX] !== 1) {
            player.x = newX;
            player.y = newY;
            checkTile(newX, newY);
        }
    }

    document.querySelectorAll("#controls button").forEach(btn => {
        btn.addEventListener("click", () => {
            let dir = btn.getAttribute("data-dir");
            let event = { key: "" };
            if (dir === "up") event.key = "ArrowUp";
            if (dir === "down") event.key = "ArrowDown";
            if (dir === "left") event.key = "ArrowLeft";
            if (dir === "right") event.key = "ArrowRight";
            movePlayer(event);
        });
    });

    let touchStartX = 0;
    let touchStartY = 0;
    canvas.addEventListener("touchstart", (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });

    canvas.addEventListener("touchend", (e) => {
        let dx = e.changedTouches[0].clientX - touchStartX;
        let dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 30) movePlayer({ key: "ArrowRight" });
            else if (dx < -30) movePlayer({ key: "ArrowLeft" });
        } else {
            if (dy > 30) movePlayer({ key: "ArrowDown" });
            else if (dy < -30) movePlayer({ key: "ArrowUp" });
        }
    });

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawMaze();
        drawPlayer();
        drawParticles();
        if (!gameWon) requestAnimationFrame(gameLoop);
    }

    const dialogues = [
        { text: "“I knew you'd say Yes! 🥰”", img: "shoulderLevel.png" },
        { text: "“You are my favorite person in the world! 🌎”", img: "shoulderLevel.png" },
        { text: "“I love you so much, my Valentine! 💖”", img: "kissing.png" }
    ];

    let dialogueIndex = 0;
    const dialogueElement = document.getElementById("dialogue");
    const chatImg = document.getElementById("chat-img");
    const nextBtn = document.getElementById("next-btn");
    const restartBtn = document.getElementById("restart-btn");

    nextBtn.addEventListener("click", () => {
        dialogueIndex++;
        if (dialogueIndex < dialogues.length) {
            dialogueElement.textContent = dialogues[dialogueIndex].text;
            chatImg.src = dialogues[dialogueIndex].img;
        } else {
            nextBtn.classList.add("hidden");
            restartBtn.classList.remove("hidden");
        }
    });
});