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

    checkWin();

    clearCanvas();
    drawFood();
    drawSnake();
    drawAISnakes();

    setTimeout(drawGame, 100);
}

function moveSnake() {
    const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };
    
    // Gestion du wrap-around pour le serpent
    if (head.x < 0) head.x = tileCount - 1;
    if (head.x >= tileCount) head.x = 0;
    if (head.y < 0) head.y = tileCount - 1;
    if (head.y >= tileCount) head.y = 0;
    
    snake.unshift(head);
    
    let snakeAte = false;
    // On vérifie pour chaque serpent IA
    for (let i = aiSnakes.length - 1; i >= 0; i--) {
        const aiSnake = aiSnakes[i];
        const collisionIndex = canEatSnake(snake, aiSnake.body, aiSnake.velocityX, aiSnake.velocityY);
        
        if (collisionIndex !== -1) {
            // On gagne 1 point par carré mangé
            const eatenParts = aiSnake.body.length - collisionIndex;
            score += eatenParts;
            
            // On garde seulement la partie avant la collision
            aiSnake.body = aiSnake.body.slice(0, collisionIndex);
            
            // Si le serpent est complètement mangé, on le réinitialise
            if (aiSnake.body.length === 0) {
                resetAISnake(aiSnake);
            }
            
            snakeAte = true;
        }
    }
    
    if (!eatFood() && !snakeAte) {
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
            
            let aiSnakeAte = false;
            
            // Vérifier si l'IA peut manger d'autres serpents IA
            for (let otherSnake of aiSnakes) {
                if (otherSnake !== aiSnake) {
                    const collisionIndex = canEatSnake(aiSnake.body, otherSnake.body, otherSnake.velocityX, otherSnake.velocityY);
                    if (collisionIndex !== -1) {
                        // L'IA gagne 1 point par carré mangé
                        const eatenParts = otherSnake.body.length - collisionIndex;
                        aiSnake.score += eatenParts;
                        
                        // On garde seulement la partie avant la collision
                        otherSnake.body = otherSnake.body.slice(0, collisionIndex);
                        
                        // Si le serpent est complètement mangé, on le réinitialise
                        if (otherSnake.body.length === 0) {
                            resetAISnake(otherSnake);
                        }
                        
                        aiSnakeAte = true;
                    }
                }
            }
            
            // Vérifier si l'IA peut manger le serpent du joueur
            const playerCollisionIndex = canEatSnake(aiSnake.body, snake, velocityX, velocityY);
            if (playerCollisionIndex !== -1) {
                // Réduire la taille du serpent du joueur
                snake = snake.slice(0, playerCollisionIndex);
                if (snake.length === 0) {
                    snake = [{ x: Math.floor(tileCount/2), y: Math.floor(tileCount/2) }];
                    velocityX = 0;
                    velocityY = 0;
                }
                score = snake.length * 10;
                return;
            }
            
            // Vérifier si le serpent IA mange la nourriture
            if (newHead.x === food.x && newHead.y === food.y) {
                food = {
                    x: Math.floor(Math.random() * tileCount),
                    y: Math.floor(Math.random() * tileCount)
                };
                aiSnake.score += 10;
                aiSnakeAte = true;
            }
            
            if (!aiSnakeAte) {
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
    
    // On ignore complètement les collisions avec le serpent du joueur s'il est petit
    if (snake.length >= 5) {
        for (const part of snake) {
            if (newHead.x === part.x && newHead.y === part.y) {
                return true;
            }
        }
    }
    
    return false;
}

function handleCollision() {
    const currentLength = snake.length;
    const head = snake[0];
    
    if (currentLength <= 3) {
        // Si le serpent a 3 carrés ou moins, on reste à 1 carré
        snake = [{ x: head.x, y: head.y }];
    } else {
        // Sinon on perd 2 carrés
        snake = snake.slice(0, currentLength - 2);
    }
    
    // Réinitialiser la vélocité
    velocityX = 0;
    velocityY = 0;
    
    // Ajuster le score en conséquence
    score = snake.length * 10;
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
        aiSnake.score = 0;
    });
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    velocityX = 0;
    velocityY = 0;
    score = 0;
}

// Ajout d'une fonction pour vérifier si un serpent peut en manger un autre
function canEatSnake(predator, prey, preyVelocityX, preyVelocityY) {
    const predatorHead = predator[0];
    
    // On vérifie si la tête du prédateur touche n'importe quelle partie de la proie
    for (let i = 0; i < prey.length; i++) {
        const preyPart = prey[i];
        if (predatorHead.x === preyPart.x && predatorHead.y === preyPart.y) {
            // On retourne l'index de la partie touchée pour savoir où couper
            return i;
        }
    }
    
    return -1; // Aucune collision
}

// Nouvelle fonction pour réinitialiser un serpent IA
function resetAISnake(aiSnake) {
    // Trouver une position aléatoire libre
    let newX, newY;
    do {
        newX = Math.floor(Math.random() * tileCount);
        newY = Math.floor(Math.random() * tileCount);
    } while (isPositionOccupied(newX, newY));
    
    aiSnake.body = [{ x: newX, y: newY }];
    aiSnake.velocityX = 0;
    aiSnake.velocityY = 0;
    aiSnake.score = 0;
}

// Fonction utilitaire pour vérifier si une position est occupée
function isPositionOccupied(x, y) {
    // Vérifier le serpent du joueur
    if (snake.some(part => part.x === x && part.y === y)) return true;
    
    // Vérifier les serpents IA
    for (const aiSnake of aiSnakes) {
        if (aiSnake.body.some(part => part.x === x && part.y === y)) return true;
    }
    
    // Vérifier la nourriture
    if (food.x === x && food.y === y) return true;
    
    return false;
}

// Remplacer la fonction gameOver par checkWin
function checkWin() {
    // Vérifier si un serpent a atteint la taille 10
    if (snake.length >= 10) {
        alert('Vous avez gagné ! Score: ' + score);
        resetGame();
        return true;
    }
    
    for (const aiSnake of aiSnakes) {
        if (aiSnake.body.length >= 10) {
            alert('Un serpent IA est vainqueur !');
            resetGame();
            return true;
        }
    }
    
    // Gérer les collisions sans game over
    const head = snake[0];
    let collision = false;
    
    // Wrap-around pour les murs
    if (head.x < 0) {
        snake[0].x = tileCount - 1;
    } else if (head.x >= tileCount) {
        snake[0].x = 0;
    } else if (head.y < 0) {
        snake[0].y = tileCount - 1;
    } else if (head.y >= tileCount) {
        snake[0].y = 0;
    }

    // Vérifier collision avec soi-même
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            collision = true;
            break;
        }
    }

    // Vérifier collision avec les serpents IA seulement si assez grand
    if (snake.length >= 5) {
        for (const aiSnake of aiSnakes) {
            for (const part of aiSnake.body) {
                if (head.x === part.x && head.y === part.y) {
                    collision = true;
                    break;
                }
            }
            if (collision) break;
        }
    }

    if (collision) {
        handleCollision();
    }

    return false;
}

drawGame(); 