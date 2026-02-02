document.addEventListener('DOMContentLoaded', () => {
    const startScreen = document.getElementById('start-screen');
    const yesBtn = document.getElementById('yes-btn');
    const noBtn = document.getElementById('no-btn');
    const canvas = document.getElementById('mazeCanvas');
    const ctx = canvas.getContext('2d');
    const winMessage = document.getElementById('win-message');
    
    // Overlays
    const memoryOverlay = document.getElementById('memory-overlay');
    const memoryImgEl = document.getElementById('memory-img');
    const closeMemoryBtn = document.getElementById('close-memory-btn');
    
    // Video Elements
    const videoOverlay = document.getElementById('video-overlay');
    const danceVideo = document.getElementById('dance-video');

    // Audio Elements
    const bgMusic = document.getElementById('bg-music');
    const cheerSound = document.getElementById('cheer-sound');
    const sadSound = document.getElementById('sad-sound');
    const snackSound = document.getElementById('snack-sound'); 

    let gameStarted = false;
    let gameWon = false;
    let gamePaused = false; 
    let frameCount = 0; 

    // =============== MEMORIES ARRAY ===============
    const memories = [
        { src: "mem1.png" }, 
        { src: "mem2.png" },
        { src: "mem3.png" },
        { src: "mem4.png" },
        { src: "mem5.png" }
    ];
    let memoryIndex = 0;

    // =============== No Button Logic ===============
    noBtn.addEventListener('click', (e) => { e.preventDefault(); moveNoButton(); });
    noBtn.addEventListener('mouseenter', () => { moveNoButton(); });

    function moveNoButton() {
        const padding = 50; 
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const btnWidth = noBtn.offsetWidth;
        const btnHeight = noBtn.offsetHeight;
        const safeMaxX = Math.max(padding, screenWidth - btnWidth - padding);
        const safeMaxY = Math.max(padding, screenHeight - btnHeight - padding);
        const randomX = Math.floor(Math.random() * (safeMaxX - padding)) + padding;
        const randomY = Math.floor(Math.random() * (safeMaxY - padding)) + padding;
        noBtn.style.position = 'fixed';
        noBtn.style.left = `${randomX}px`;
        noBtn.style.top = `${randomY}px`;
    }

    // =============== Start Game ===============
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
        
        if(bgMusic) {
            bgMusic.volume = 0.5; 
            bgMusic.play().catch(error => console.log("Music play failed:", error));
        }
        
        gameLoop();
    });

    // =============== FIXED MAZE LAYOUT (23x23) ===============
    // 0=Path, 1=Wall, 2=Exit, 3=Reset, 4=Matcha, 5=Polaroid, 6=Video
    const maze = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,4,0,1,0,0,0,0,0,1,5,1,0,0,0,1], // Start at [1,1]
        [1,0,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,0,1,1,1],
        [1,0,1,0,0,0,1,5,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
        [1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1],
        [1,0,0,0,4,0,0,0,0,0,0,0,1,0,0,0,0,0,4,0,0,0,1],
        [1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,0,1,0,1,1,1,1,1],
        [1,6,0,0,1,0,0,0,5,0,0,0,1,0,0,0,1,0,0,0,0,0,1], 
        [1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,1,1,0,1,0,1],
        [1,0,0,0,0,0,1,0,1,0,0,0,0,0,1,4,0,0,1,0,1,0,1],
        [1,0,1,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1],
        [1,0,0,0,1,0,0,0,0,0,0,0,4,0,0,0,1,0,1,0,0,0,1],
        [1,0,1,1,1,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,1,0,1,5,1,0,0,0,1,0,0,0,0,0,1], 
        [1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1,1,1,1,1,0,1],
        [1,4,0,0,1,0,1,0,1,0,0,0,0,0,1,0,0,0,4,0,1,0,1],
        [1,0,1,0,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,5,0,1,0,0,0,1], 
        [1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1],
        [1,0,0,0,1,4,0,0,1,0,0,0,0,0,1,0,1,0,0,0,4,0,1],
        [1,1,1,0,1,0,1,1,1,0,1,1,1,0,1,0,1,1,1,1,1,0,1],
        [1,3,0,0,0,0,1,4,0,0,2,0,0,0,0,0,0,0,0,0,0,0,1], // FIXED: Open path to 2 (Exit)
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    // INCREASED SIZE for better visibility
    const cellSize = 40; 
    
    // High-DPI Scaling
    const dpr = window.devicePixelRatio || 1;
    const mazeWidth = maze[0].length * cellSize;
    const mazeHeight = maze.length * cellSize;
    
    canvas.width = mazeWidth * dpr;
    canvas.height = mazeHeight * dpr;
    canvas.style.width = `${mazeWidth}px`;
    canvas.style.height = `${mazeHeight}px`;
    ctx.scale(dpr, dpr);

    // Images
    const playerImg = new Image(); playerImg.src = "ami.png";
    const exitImg = new Image(); exitImg.src = "me.png";
    const snackImg = new Image(); snackImg.src = "matcha.png";
    const cameraImg = new Image(); cameraImg.src = "camera.png"; 

    // Wall Gradient
    const wallGradient = ctx.createLinearGradient(0, 0, mazeWidth, mazeHeight);
    wallGradient.addColorStop(0, "#4cc9f0");
    wallGradient.addColorStop(0.5, "#4cc9f0");
    wallGradient.addColorStop(1, "#4cc9f0");

    let player = { x: 1, y: 1 };
    let particles = [];

    function createParticle(x, y) {
        particles.push({
            x: x * cellSize + cellSize / 2,
            y: y * cellSize + cellSize / 2,
            size: Math.random() * 4 + 4, opacity: 1, life: 40
        });
    }

    function drawParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = "pink";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            p.y += 0.3; p.opacity -= 0.02; p.life--;
            if (p.life <= 0) particles.splice(i, 1);
        }
    }

    function drawMaze() {
        const floatOffset = Math.sin(frameCount * 0.1) * 3; 

        for (let row = 0; row < maze.length; row++) {
            for (let col = 0; col < maze[row].length; col++) {
                const tile = maze[row][col];
                const x = col * cellSize;
                const y = row * cellSize;

                if (tile === 1) {
                    ctx.fillStyle = wallGradient;
                    ctx.fillRect(x, y, cellSize, cellSize);
                } else {
                    ctx.fillStyle = "#ffe6eb";
                    ctx.fillRect(x, y, cellSize, cellSize);
                    
                    if (tile === 2) { // YES
                        ctx.fillStyle = "#e63946"; ctx.font = "bold 14px Arial";
                        ctx.fillText("YES", x + cellSize/2 - 12, y + cellSize/2 + 5);
                    } else if (tile === 3) { // NO
                        ctx.fillStyle = "#555"; ctx.font = "bold 14px Arial";
                        ctx.fillText("NO", x + cellSize/2 - 10, y + cellSize/2 + 5);
                    } else if (tile === 4) { // Matcha
                        drawItem(snackImg, x, y, floatOffset, "#88c999");
                    } else if (tile === 5) { // Polaroid
                        drawItem(cameraImg, x, y, floatOffset, "#333");
                    } else if (tile === 6) { // Video Easter Egg
                        ctx.fillStyle = "#ff69b4"; 
                        ctx.font = "24px Arial"; // Bigger music note
                        ctx.fillText("🎵", x + 10, y + 28 + floatOffset);
                    }
                }
            }
        }
        // Draw Exit (Me)
        // Manual check for exit position in row 21
        const exitX = 11; const exitY = 21; 
        // Draw ME bigger (full cell)
        if (exitImg.complete) ctx.drawImage(exitImg, exitX*cellSize, exitY*cellSize, cellSize, cellSize);
    }

    function drawItem(img, x, y, offset, fallbackColor) {
        if (img.complete && img.naturalHeight !== 0) {
            // Draw FULL SIZE (no padding) for better visibility
            ctx.drawImage(img, x, y + offset, cellSize, cellSize);
        } else {
            ctx.fillStyle = fallbackColor;
            ctx.beginPath();
            ctx.arc(x + cellSize/2, y + cellSize/2 + offset, 10, 0, Math.PI*2);
            ctx.fill();
        }
    }

    function drawPlayer() {
        if (playerImg.complete) {
             // Draw PLAYER FULL SIZE (no padding)
             ctx.drawImage(playerImg, player.x * cellSize, player.y * cellSize, cellSize, cellSize);
        } else {
            ctx.fillStyle = "red";
            ctx.fillRect(player.x * cellSize, player.y * cellSize, cellSize, cellSize);
        }
    }

    // --- LOGIC FOR MEMORIES & VIDEO ---

    function showMemory() {
        gamePaused = true; 
        const mem = memories[memoryIndex % memories.length];
        memoryImgEl.src = mem.src;
        memoryOverlay.classList.remove('hidden');
        memoryIndex++;
    }

    closeMemoryBtn.addEventListener('click', () => {
        memoryOverlay.classList.add('hidden');
        gamePaused = false; 
    });

    function triggerVideo() {
        gamePaused = true;
        if(bgMusic) bgMusic.pause(); 
        
        videoOverlay.classList.remove('hidden');
        danceVideo.currentTime = 0;
        danceVideo.play().catch(e => console.log("Video play error", e));

        danceVideo.onended = () => {
            videoOverlay.classList.add('hidden');
            if(bgMusic) bgMusic.play(); 
            gamePaused = false;
        };
    }

    function checkTile(x, y) {
        const tile = maze[y][x];
        if (tile === 2) { // WIN
            gameWon = true;
            winMessage.classList.remove('hidden');
            winMessage.classList.add('visible');
            if(cheerSound) cheerSound.play().catch(e => {});
        } else if (tile === 3) { // RESET
            player.x = 1; player.y = 1;
            if(sadSound) sadSound.play().catch(e => {});
        } else if (tile === 4) { // MATCHA
            maze[y][x] = 0;
            if(snackSound) { snackSound.currentTime = 0; snackSound.play().catch(e => {}); }
        } else if (tile === 5) { // CAMERA
            maze[y][x] = 0;
            if(snackSound) { snackSound.currentTime = 0; snackSound.play().catch(e => {}); }
            showMemory();
        } else if (tile === 6) { // EASTER EGG VIDEO
            maze[y][x] = 0; 
            triggerVideo();
        }
    }

    function movePlayer(e) {
        if (gameWon || gamePaused) return; 
        
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
    
    // Mobile Touch
    let touchStartX = 0, touchStartY = 0;
    canvas.addEventListener("touchstart", (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    canvas.addEventListener("touchend", (e) => {
        if (gamePaused) return;
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

    document.querySelectorAll("#controls button").forEach(btn => {
        btn.addEventListener("click", () => {
            let dir = btn.getAttribute("data-dir");
            let k = "";
            if (dir==="up") k="ArrowUp"; if(dir==="down") k="ArrowDown";
            if (dir==="left") k="ArrowLeft"; if(dir==="right") k="ArrowRight";
            movePlayer({key: k});
        });
    });

    function gameLoop() {
        frameCount++;
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
    let dIndex = 0;
    const dEl = document.getElementById("dialogue");
    const cImg = document.getElementById("chat-img");
    const nBtn = document.getElementById("next-btn");
    const rBtn = document.getElementById("restart-btn");
    if(nBtn) {
        nBtn.addEventListener("click", () => {
            dIndex++;
            if (dIndex < dialogues.length) {
                dEl.textContent = dialogues[dIndex].text;
                cImg.src = dialogues[dIndex].img;
            } else {
                nBtn.classList.add("hidden");
                rBtn.classList.remove("hidden");
            }
        });
    }
});