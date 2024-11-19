console.log("Le fichier snake.js est bien chargé");

const canvas = document.getElementById('gameCanvas');
if (!canvas) {
    console.error("Canvas non trouvé! Vérifiez que l'ID 'gameCanvas' existe dans le HTML.");
    throw new Error("Canvas non trouvé");
}
const ctx = canvas.getContext('2d');

const gridSize = 20;
const tileCount = 20;

let snake = [
    { x: 10, y: 10 }
];
let food = {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
};
let velocityX = 0;
let velocityY = 0;
let score = 0;

// Ajout des serpents IA
const aiSnakes = [
    {
        body: [{ x: 5, y: 5 }],
        velocityX: 0,
        velocityY: 0,
        color: 'blue',
        score: 0
    },
    {
        body: [{ x: 15, y: 15 }],
        velocityX: 0,
        velocityY: 0,
        color: 'purple',
        score: 0
    }
];

document.addEventListener('keydown', changeDirection);

function changeDirection(event) {
    const LEFT_KEY = 37;
    const RIGHT_KEY = 39;
    const UP_KEY = 38;
    const DOWN_KEY = 40;

    const keyPressed = event.keyCode;
    const goingUp = velocityY === -1;
    const goingDown = velocityY === 1;
    const goingRight = velocityX === 1;
    const goingLeft = velocityX === -1;

    if (keyPressed === LEFT_KEY && !goingRight) {
        velocityX = -1;
        velocityY = 0;
    }
    if (keyPressed === UP_KEY && !goingDown) {
        velocityX = 0;
        velocityY = -1;
    }
    if (keyPressed === RIGHT_KEY && !goingLeft) {
        velocityX = 1;
        velocityY = 0;
    }
    if (keyPressed === DOWN_KEY && !goingUp) {
        velocityX = 0;
        velocityY = 1;
    }
}

function drawGame() {
    moveSnake();
    moveAISnakes();

    if (gameOver()) {
        alert('Game Over! Score: ' + score);
        resetGame();
        return;
    }

    clearCanvas();
    drawFood();
    drawSnake();
    drawAISnakes();

    setTimeout(drawGame, 100);
}

function moveSnake() {
    const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };
    snake.unshift(head);
    if (!eatFood()) {
        snake.pop();
    }
}

function moveAISnakes() {
    aiSnakes.forEach(aiSnake => {
        const head = aiSnake.body[0];
        
        // Prise de décision plus intelligente
        if (Math.random() < 0.15) { // Augmentation de la fréquence de prise de décision
            // Calcul de la distance jusqu'à la nourriture
            const distanceToFood = Math.abs(food.x - head.x) + Math.abs(food.y - head.y);
            
            // Si la nourriture est proche, on la poursuit
            if (distanceToFood < 8) {
                if (food.x < head.x) aiSnake.velocityX = -1;
                else if (food.x > head.x) aiSnake.velocityX = 1;
                else aiSnake.velocityX = 0;

                if (food.y < head.y) aiSnake.velocityY = -1;
                else if (food.y > head.y) aiSnake.velocityY = 1;
                else aiSnake.velocityY = 0;
            } else {
                // Sinon, mouvement plus aléatoire mais intelligent
                const directions = [
                    { x: -1, y: 0 },
                    { x: 1, y: 0 },
                    { x: 0, y: -1 },
                    { x: 0, y: 1 }
                ];
                
                // Filtrer les directions qui mènent à une collision
                const safeDirections = directions.filter(dir => {
                    const newX = head.x + dir.x;
                    const newY = head.y + dir.y;
                    
                    // Vérifier les collisions avec les murs
                    if (newX < 0 || newX >= tileCount || newY < 0 || newY >= tileCount) {
                        return false;
                    }
                    
                    // Vérifier les collisions avec son propre corps
                    return !aiSnake.body.some(part => part.x === newX && part.y === newY);
                });
                
                if (safeDirections.length > 0) {
                    const randomDirection = safeDirections[Math.floor(Math.random() * safeDirections.length)];
                    aiSnake.velocityX = randomDirection.x;
                    aiSnake.velocityY = randomDirection.y;
                }
            }
        }

        // Déplacement
        const newHead = {
            x: head.x + aiSnake.velocityX,
            y: head.y + aiSnake.velocityY
        };

        // Gestion des bords
        if (newHead.x < 0) newHead.x = tileCount - 1;
        if (newHead.x >= tileCount) newHead.x = 0;
        if (newHead.y < 0) newHead.y = tileCount - 1;
        if (newHead.y >= tileCount) newHead.y = 0;

        // Vérification des collisions avec les autres serpents
        const hasCollision = checkAICollision(newHead, aiSnake);
        
        if (!hasCollision) {
            aiSnake.body.unshift(newHead);
            
            // Vérifier si le serpent IA mange la nourriture
            if (newHead.x === food.x && newHead.y === food.y) {
                food = {
                    x: Math.floor(Math.random() * tileCount),
                    y: Math.floor(Math.random() * tileCount)
                };
                aiSnake.score += 10;
            } else {
                aiSnake.body.pop();
            }
        }
    });
}

// Nouvelle fonction pour vérifier les collisions des serpents IA
function checkAICollision(newHead, currentSnake) {
    // Vérifier les collisions avec les autres serpents IA
    for (const aiSnake of aiSnakes) {
        if (aiSnake === currentSnake) continue;
        
        for (const part of aiSnake.body) {
            if (newHead.x === part.x && newHead.y === part.y) {
                return true;
            }
        }
    }
    
    // Vérifier les collisions avec le serpent du joueur
    for (const part of snake) {
        if (newHead.x === part.x && newHead.y === part.y) {
            return true;
        }
    }
    
    return false;
}

function gameOver() {
    const head = snake[0];
    
    // Collision avec les murs
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        return true;
    }

    // Collision avec soi-même
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }

    // Collision avec les serpents IA
    for (const aiSnake of aiSnakes) {
        for (const part of aiSnake.body) {
            if (head.x === part.x && head.y === part.y) {
                return true;
            }
        }
    }

    return false;
}

function clearCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
    ctx.fillStyle = 'green';
    snake.forEach(part => {
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
    });
}

function drawFood() {
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
}

function drawAISnakes() {
    aiSnakes.forEach(aiSnake => {
        ctx.fillStyle = aiSnake.color;
        aiSnake.body.forEach(part => {
            ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
        });
    });
}

function eatFood() {
    const head = snake[0];
    if (head.x === food.x && head.y === food.y) {
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        score += 10;
        return true;
    }
    return false;
}

function resetGame() {
    snake = [{ x: 10, y: 10 }];
    aiSnakes[0].body = [{ x: 5, y: 5 }];
    aiSnakes[1].body = [{ x: 15, y: 15 }];
    aiSnakes.forEach(aiSnake => {
        aiSnake.velocityX = 0;
        aiSnake.velocityY = 0;
    });
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    velocityX = 0;
    velocityY = 0;
    score = 0;
}

drawGame(); 