const canvas = document.querySelector("#gameCanvas");

if (!canvas) {
    console.error("Could not find the game canvas.");
} else {
    const ctx = canvas.getContext("2d");

    //setting game sizes, positions, speeds
    const settings = {
        background: {
            width: 1000,
            height: 700,
            speed: 45
        },

        surface: {
            width: 600,
            height: 170,
            speed: 350
        },

        princess: {
            x: 150,
            width: 160,
            height: 160
        },

        rock: {
            width: 100,
            height: 90,
            spawnOffset: 20,
            yOffset: 20,
            cropLeft: 0,
            cropTop: 0,
            cropRight: 0,
            cropBottom: 50
        },

        floatingRock: {
            width: 100,
            height: 100,
            spawnOffset: 20,
            yOffset: -95,
            cropLeft: 0,
            cropTop: 0,
            cropRight: 0,
            cropBottom: 0
        },

        spear: {
            width: 95,
            height: 50,
            spawnOffset: 20,
            yOffset: -10,
            cropLeft: 0,
            cropTop: 0,
            cropRight: 0,
            cropBottom: 0
        },

        gravity: 1800,
        jumpPower: -650,
        goalScore: 500,
        startingHealth: 100,
        collisionDamage: 25
    };

    //adjusting the princess animation rows and cropping
    const poseAdjust = [
        { x: 0, y: 10, cropLeft: 20, cropRight: 0, cropTop: 10, cropBottom: 0 },
        { x: 0, y: 0, cropLeft: 15, cropRight: 0, cropTop: 10, cropBottom: 0 },
        { x: 0, y: 0, cropLeft: 30, cropRight: 0, cropTop: 50, cropBottom: 0 }
    ];

    //finding music, game controls, overlay, and display elements
    const music = document.querySelector("#gameMusic");
    const musicButton = document.querySelector("#musicButton");
    const signOutButton = document.querySelector("#signOutButton");

    const scoreDisplay = document.querySelector("#scoreDisplay");
    const healthDisplay = document.querySelector("#healthDisplay");
    const levelDisplay = document.querySelector("#levelDisplay");

    const gameEndOverlay = document.querySelector("#gameEndOverlay");
    const gameOverMessage = document.querySelector("#gameOverMessage");
    const levelCompleteMessage = document.querySelector("#levelCompleteMessage");
    const allLevelsCompleteMessage = document.querySelector("#allLevelsCompleteMessage");
    const nextLevelButton = document.querySelector("#nextLevelButton");
    const replayButton = document.querySelector("#replayButton");
    const pauseButton = document.querySelector("#pauseButton");
    const pauseOverlay = document.querySelector("#pauseOverlay");

    // function for loading an image file
    function loadImage(path) {
        return new Promise(resolve => {
            const image = new Image();

            image.onload = () => resolve(image);

            image.onerror = () => {
                console.error("Could not load " + path);
                resolve(null);
            };

            image.src = path;
        });
    }

    //loading the game images using async to asynchronise before starting the game
    async function startGame() {
        const [
            princessImage,
            backgroundImage,
            surfaceImage,
            rockImage,
            floatingRockImage,
            spearImage
        ] = await Promise.all([
            loadImage("images/princess-sheet.png"),
            loadImage("images/background.png"),
            loadImage("images/running-surface.png"),
            loadImage("images/rock.png"),
            loadImage("images/floating-rock.png"),
            loadImage("images/spear.png")
        ]);

        if (!princessImage) return;

        runGame({
            princessImage,
            backgroundImage,
            surfaceImage,
            rockImage,
            floatingRockImage,
            spearImage
        });
    }

    function runGame(images) {
        const columns = 8;
        const rows = 3;
        const frameCount = 8;
        const frameDelay = 70;

        const frameWidth = images.princessImage.width / columns;
        const frameHeight = images.princessImage.height / rows;
        const groundTop = canvas.height - settings.surface.height;

        // reading and limiting the selected level.
        const level = Math.max(
            1,
            Math.min(
                3,
                Number(localStorage.getItem("undernileSelectedLevel")) || 1
            )
        );

        // princess and setting her start position.
        const princess = {
            x: settings.princess.x,
            y: 0,
            width: settings.princess.width,
            height: settings.princess.height,
            jumpSpeed: 0,
            jumping: false
        };

        const groundY = groundTop - princess.height;
        princess.y = groundY;

        //score, health, obstacles, animation, and game state.
        let score = 0;
        let health = settings.startingHealth;
        let obstacles = [];

        let currentFrame = 0;
        let currentRow = 0;
        let lastFrameTime = 0;
        let previousTime = 0;

        let backgroundOffset = 0;
        let surfaceOffset = 0;
        let spawnTimer = 1.5;

        let downPressed = false;
        let paused = false;
        let gameOver = false;
        let levelCompleted = false;

        const gameSpeed = settings.surface.speed + (level - 1) * 100;

        //display the selected level
        if (levelDisplay) {
            levelDisplay.textContent = level;
        }

        // setting the background music.
        if (music) {
            music.loop = true;
            music.volume = 0.25;
        }

        // connecting the music, sign-out, replay, and level buttons
        if (musicButton && music) {
            musicButton.addEventListener("click", toggleMusic);
        }

        if (pauseButton) {
            pauseButton.addEventListener("click", togglePause);
        }

        if (signOutButton) {
            signOutButton.addEventListener("click", function () {
                localStorage.removeItem("undernileCurrentUser");
                window.location.href = "login.html";
            });
        }

        if (nextLevelButton) {
            nextLevelButton.addEventListener("click", () => {
                if (level < 3) {
                    localStorage.setItem(
                        "undernileSelectedLevel",
                        String(level + 1)
                    );
                    window.location.reload();
                }
            });
        }

        if (replayButton) {
            replayButton.addEventListener("click", () => {
                window.location.reload();
            });
        }

        // registering the keyboard events and starting the game loop.
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("keyup", handleKeyUp);

        updateDisplays();
        requestAnimationFrame(gameLoop);

        // Toggling the music on or off.
        function toggleMusic() {
            if (!music) return;

            if (music.paused) {
                playMusic();
            } else {
                music.pause();
                musicButton.textContent = "Music: Off";
            }
        }

        // playing music
        function playMusic() {
            if (!music) return;

            music.play()
                .then(() => {
                    if (musicButton) {
                        musicButton.textContent = "Music: On";
                    }
                })
                .catch(() => {
                    if (musicButton) {
                        musicButton.textContent = "Music: Off";
                    }
                });
        }

        // updating the pause button.
        function togglePause() {
            if (gameOver) return;

            paused = !paused;

            if (pauseButton) {
                pauseButton.textContent = paused ? "Resume" : "Pause";
                pauseButton.setAttribute("aria-pressed", String(paused));
            }

            if (pauseOverlay) {
                pauseOverlay.hidden = !paused;
            }
        }

        // Handling jump, slide, pause, and restart keys
        function handleKeyDown(event) {
            if (
                event.code === "ArrowUp" ||
                event.code === "ArrowDown" ||
                event.code === "Space"
            ) {
                event.preventDefault();
            }

            playMusic();

            if (
                (event.code === "ArrowUp" || event.code === "Space") &&
                !princess.jumping &&
                !downPressed &&
                !paused &&
                !gameOver
            ) {
                princess.jumping = true;
                princess.jumpSpeed = settings.jumpPower;
            }

            if (event.code === "ArrowDown" && !paused && !gameOver) {
                downPressed = true;
            }

            if (event.code === "KeyR" && gameOver) {
                window.location.reload();
            }

            if (event.code === "Escape") {
                window.location.href = "game.html";
            }
        }

        // Handling the sliding key 
        function handleKeyUp(event) {
            if (event.code === "ArrowDown") {
                downPressed = false;
            }
        }

        // Updating and drawing the game on each animation frame
        function gameLoop(time) {
            if (previousTime === 0) {
                previousTime = time;
            }

            const delta = Math.min((time - previousTime) / 1000, 0.05);
            previousTime = time;

            if (!paused && !gameOver) {
                update(delta);
            }

            draw(time);
            requestAnimationFrame(gameLoop);
        }

        // updating movement, score, and obstacles
        function update(delta) {
            backgroundOffset += settings.background.speed * delta;
            surfaceOffset += gameSpeed * delta;
            score += delta * 10;

            if (princess.jumping) {
                princess.y += princess.jumpSpeed * delta;
                princess.jumpSpeed += settings.gravity * delta;

                if (princess.y >= groundY) {
                    princess.y = groundY;
                    princess.jumpSpeed = 0;
                    princess.jumping = false;
                }
            }

            spawnTimer -= delta;

            if (spawnTimer <= 0) {
                spawnObstacle();
                spawnTimer = 1.5 + Math.random() * 1.2;
            }

            moveObstacles(delta);
            checkCollisions();
            updateDisplays();

            if (score >= settings.goalScore) {
                finishGame(true);
            }
        }

        // drawing the current scene and animation frame
        function draw(time) {
            updateAnimationRow(time);

            if (time - lastFrameTime >= frameDelay) {
                currentFrame = (currentFrame + 1) % frameCount;
                lastFrameTime = time;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            drawBackground();
            drawSurface();
            drawObstacles();
            drawPrincess();
        }

        // selecting the animations
        function updateAnimationRow(time) {
            let row = 0;

            if (princess.jumping) {
                row = 1;
            } else if (downPressed) {
                row = 2;
            }

            if (row !== currentRow) {
                currentRow = row;
                currentFrame = 0;
                lastFrameTime = time;
            }
        }

        // drawing the background image
        function drawBackground() {
            if (images.backgroundImage) {
                drawLoopingImage(
                    images.backgroundImage,
                    backgroundOffset,
                    0,
                    settings.background.width,
                    settings.background.height
                );
            } else {
                ctx.fillStyle = "rgb(4, 20, 36)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }

        // drawing the running surface.
        function drawSurface() {
            if (images.surfaceImage) {
                drawLoopingImage(
                    images.surfaceImage,
                    surfaceOffset,
                    groundTop,
                    settings.surface.width,
                    settings.surface.height
                );
            } else {
                ctx.fillStyle = "rgb(35, 75, 95)";
                ctx.fillRect(
                    0,
                    groundTop,
                    canvas.width,
                    settings.surface.height
                );
            }
        }

        // Repeating an image across the canvas.
        function drawLoopingImage(image, offset, y, width, height) {
            const shift = offset % width;

            for (let x = -shift; x < canvas.width; x += width) {
                ctx.drawImage(image, x, y, width, height);
            }
        }

        // Drawing the current princess frame 
        function drawPrincess() {
            const pose = poseAdjust[currentRow];

            const cropLeft = Math.max(0, pose.cropLeft);
            const cropRight = Math.max(0, pose.cropRight);
            const cropTop = Math.max(0, pose.cropTop);
            const cropBottom = Math.max(0, pose.cropBottom);

            const sourceWidth = frameWidth - cropLeft - cropRight;
            const sourceHeight = frameHeight - cropTop - cropBottom;

            if (sourceWidth <= 0 || sourceHeight <= 0) return;

            const scaleX = princess.width / frameWidth;
            const scaleY = princess.height / frameHeight;

            ctx.drawImage(
                images.princessImage,
                currentFrame * frameWidth + cropLeft,
                currentRow * frameHeight + cropTop,
                sourceWidth,
                sourceHeight,
                princess.x + pose.x + cropLeft * scaleX,
                princess.y + pose.y + cropTop * scaleY,
                sourceWidth * scaleX,
                sourceHeight * scaleY
            );
        }

        // choosing and creating random obstacle
        function spawnObstacle() {
            const types = [
                { image: images.rockImage, settings: settings.rock },
                {
                    image: images.floatingRockImage,
                    settings: settings.floatingRock
                },
                { image: images.spearImage, settings: settings.spear }
            ];

            const choice = types[Math.floor(Math.random() * types.length)];
            const obstacleSettings = choice.settings;

            obstacles.push({
                image: choice.image,
                x: canvas.width + obstacleSettings.spawnOffset,
                y:
                    groundTop -
                    obstacleSettings.height +
                    obstacleSettings.yOffset,
                width: obstacleSettings.width,
                height: obstacleSettings.height,
                cropLeft: obstacleSettings.cropLeft,
                cropTop: obstacleSettings.cropTop,
                cropRight: obstacleSettings.cropRight,
                cropBottom: obstacleSettings.cropBottom,
                hasHit: false
            });
        }

        // Moving obstacles and removing them 
        function moveObstacles(delta) {
            obstacles.forEach(obstacle => {
                obstacle.x -= gameSpeed * delta;
            });

            obstacles = obstacles.filter(
                obstacle => obstacle.x + obstacle.width > 0
            );
        }

        // adding obstacles
        function drawObstacles() {
            obstacles.forEach(obstacle => {
                if (!obstacle.image) return;

                const left = Math.max(0, obstacle.cropLeft || 0);
                const top = Math.max(0, obstacle.cropTop || 0);
                const right = Math.max(0, obstacle.cropRight || 0);
                const bottom = Math.max(0, obstacle.cropBottom || 0);

                const sourceWidth =
                    obstacle.image.naturalWidth - left - right;
                const sourceHeight =
                    obstacle.image.naturalHeight - top - bottom;

                if (sourceWidth <= 0 || sourceHeight <= 0) return;

                ctx.drawImage(
                    obstacle.image,
                    left,
                    top,
                    sourceWidth,
                    sourceHeight,
                    obstacle.x,
                    obstacle.y,
                    obstacle.width,
                    obstacle.height
                );
            });
        }

        // Checking for collisions and reducing health.
        function checkCollisions() {
            const playerLeft = princess.x + 40;
            const playerRight = princess.x + princess.width - 40;

            const playerTop = downPressed && !princess.jumping
                ? groundTop - 65
                : princess.y + 20;

            const playerBottom = downPressed && !princess.jumping
                ? groundTop - 5
                : princess.y + princess.height - 10;

            for (const obstacle of obstacles) {
                if (obstacle.hasHit) continue;

                const obstacleLeft = obstacle.x + obstacle.width * 0.15;
                const obstacleRight = obstacle.x + obstacle.width * 0.85;
                const obstacleTop = obstacle.y + obstacle.height * 0.15;
                const obstacleBottom = obstacle.y + obstacle.height * 0.85;

                const hit =
                    playerRight > obstacleLeft &&
                    playerLeft < obstacleRight &&
                    playerBottom > obstacleTop &&
                    playerTop < obstacleBottom;

                if (hit) {
                    obstacle.hasHit = true;
                    health = Math.max(
                        0,
                        health - settings.collisionDamage
                    );

                    updateDisplays();

                    if (health === 0) {
                        finishGame(false);
                        return;
                    }
                }
            }
        }

        // Updating the score and health
        function updateDisplays() {
            if (scoreDisplay) {
                scoreDisplay.textContent = Math.floor(score);
            }

            if (healthDisplay) {
                healthDisplay.textContent = health;
            }
        }

        // game level finish, saving progress, and showing the correct message.
        function finishGame(won) {
            if (gameOver) return;

            gameOver = true;
            levelCompleted = won;
            saveHighScore();

            if (pauseOverlay) {
                pauseOverlay.hidden = true;
            }

            if (pauseButton) {
                pauseButton.textContent = "Pause";
                pauseButton.setAttribute("aria-pressed", "false");
            }

            if (won && level < 3) {
                const oldUnlockedLevel =
                    Number(localStorage.getItem("undernileUnlockedLevel")) || 1;

                localStorage.setItem(
                    "undernileUnlockedLevel",
                    String(Math.max(oldUnlockedLevel, level + 1))
                );
            }

            if (gameEndOverlay) {
                gameEndOverlay.hidden = false;
            }

            if (gameOverMessage) {
                gameOverMessage.hidden = won;
            }

            if (levelCompleteMessage) {
                levelCompleteMessage.hidden = !(won && level < 3);
            }

            if (allLevelsCompleteMessage) {
                allLevelsCompleteMessage.hidden = !(won && level === 3);
            }

            if (nextLevelButton) {
                nextLevelButton.hidden = !(won && level < 3);
            }
        }

        // function for saving the player's high score.
        function saveHighScore() {
            const email = (
                localStorage.getItem("undernileCurrentUser") || ""
            ).toLowerCase();

            if (!email) return;

            try {
                const users = JSON.parse(
                    localStorage.getItem("undernileUsers") || "[]"
                );

                const user = users.find(
                    account => (account.email || "").toLowerCase() === email
                );

                if (user) {
                    user.highScore = Math.max(
                        Number(user.highScore) || 0,
                        Math.floor(score)
                    );

                    localStorage.setItem(
                        "undernileUsers",
                        JSON.stringify(users)
                    );
                }
            } catch {
                console.error("Could not save the high score.");
            }
        }

        // adding the pause message on the canvas.
        function drawMessage(title, instruction) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.textAlign = "center";
            ctx.fillStyle = "white";
            ctx.font = "bold 42px Arial";
            ctx.fillText(title, canvas.width / 2, canvas.height / 2);

            ctx.font = "20px Arial";
            ctx.fillText(
                instruction,
                canvas.width / 2,
                canvas.height / 2 + 42
            );
        }
    }

    // Starting the game.
    startGame();
}