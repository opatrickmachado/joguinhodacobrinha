const getPreferredColorScheme = () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
    } else {
        return 'dark';
    }
}
const updateBackgroundColor = () => {
    const colorScheme = getPreferredColorScheme();
    canvas.style.backgroundColor = colorScheme === 'light' ? '#ddd' : '#191919';
}

const canvas = document.querySelector('canvas');
canvas.width = 600;  // Use o tamanho desejado aqui
canvas.height = 600;  // Use o tamanho desejado aqui
const ctx = canvas.getContext("2d")

const scoreElement = document.querySelector(".score--value")
const levelElement = document.querySelector(".level--value")
const livesElement = document.querySelector(".lives--value")
const finalScore = document.querySelector(".final-score > span")
const menu = document.querySelector(".menu-screen")
const buttonPlay = document.querySelector(".btn-play")

const audio = new Audio("../assets/audio.mp3")

const size = 30

const initialPosition = { x: 270, y: 240 }

let snake = [initialPosition]
let lives = 3
let level = 1

const incrementScore = () => {
    const newScore = +scoreElement.innerText + 10
    scoreElement.innerHTML = "&nbsp;" + newScore.toString().padStart(2, '0');

    if (newScore % 100 === 0) {
        level++
        levelElement.innerHTML = "&nbsp;" + level.toString().padStart(2, '0');
    }
}

const decrementLives = () => {
    lives--
    livesElement.innerHTML = "&nbsp;" + lives.toString().padStart(2, '0');
}

const randomNumber = (min, max) => {
    return Math.round(Math.random() * (max - min) + min)
}

const randomPosition = () => {
    const number = randomNumber(0, canvas.width - size)
    return Math.round(number / 30) * 30
}

const randomColor = () => {
    const red = randomNumber(0, 255)
    const green = randomNumber(0, 255)
    const blue = randomNumber(0, 255)

    return `rgb(${red}, ${green}, ${blue})`
}

const food = {
    x: randomPosition(),
    y: randomPosition(),
    color: randomColor(),
    digesting: 0
}

let direction, loopId

const drawFood = () => {
    const colorScheme = getPreferredColorScheme();
    const { x, y } = food

    const color = colorScheme === 'light' ? 'blue' : 'red';

    ctx.shadowColor = color
    ctx.shadowBlur = 6
    ctx.fillStyle = color

    // Alteramos essa linha para desenhar um círculo em vez de um quadrado
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0
}

const isNearFood = () => {
    const head = snake[snake.length - 1];
    const xDiff = Math.abs(head.x - food.x);
    const yDiff = Math.abs(head.y - food.y);

    return (xDiff <= size && yDiff <= size);
};

const drawSnake = () => {
    const colorScheme = getPreferredColorScheme();

    snake.forEach((position, index) => {
        const isHead = (index == snake.length - 1);
        const nearFood = isHead && isNearFood(); // alterado para nearFood

        const isDigesting = (index >= snake.length - 1 - level) && justAte;
        const radius = nearFood || isDigesting ? size * 1.5 / 2 : size / 2; // alterado para nearFood

        ctx.fillStyle = isHead ? (colorScheme === 'light' ? '#000' : 'white') : (colorScheme === 'light' ? '#222' : '#ddd');
        ctx.beginPath();
        ctx.arc(position.x + size / 2, position.y + size / 2, radius, 0, 2 * Math.PI);
        ctx.fill();
    });

    if (justAte) {
        justAte = false;
    }
};

const moveSnake = () => {
    if (!direction) return

    const head = snake[snake.length - 1]

    if (direction == "right") {
        snake.push({ x: head.x + size, y: head.y })
    }

    if (direction == "left") {
        snake.push({ x: head.x - size, y: head.y })
    }

    if (direction == "down") {
        snake.push({ x: head.x, y: head.y + size })
    }

    if (direction == "up") {
        snake.push({ x: head.x, y: head.y - size })
    }

    snake.shift()
}

const drawGrid = () => {
    const colorScheme = getPreferredColorScheme();
    ctx.lineWidth = 1;
    ctx.strokeStyle = colorScheme === 'light' ? '#191919' : '#ddd';
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 1;
    ctx.strokeStyle = colorScheme === 'light' ? '#191919' : '#ddd';

    for (let i = 30; i < canvas.width; i += 30) {
        ctx.beginPath();
        ctx.lineTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.lineTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
}

let justAte = false;

const checkEat = () => {
    const head = snake[snake.length - 1];

    if (head.x == food.x && head.y == food.y) {
        incrementScore();
        snake.push(head);
        audio.play();

        let x = randomPosition();
        let y = randomPosition();

        while (snake.find((position) => position.x == x && position.y == y)) {
            x = randomPosition();
            y = randomPosition();
        }

        food.x = x;
        food.y = y;
        food.color = randomColor();

        justAte = true; // A cobra acabou de comer
    }
};

const checkCollision = () => {
    const head = snake[snake.length - 1]
    const canvasLimit = canvas.width - size
    const neckIndex = snake.length - 2

    const wallCollision =
        head.x < 0 || head.x > canvasLimit || head.y < 0 || head.y > canvasLimit

    const selfCollision = snake.find((position, index) => {
        return index < neckIndex && position.x == head.x && position.y == head.y
    })

    if (wallCollision || selfCollision) {
        if (lives > 0) {
            decrementLives()
            snake = [initialPosition]
            direction = undefined
        } else {
            gameOver()
        }
    }
}

const rankingElement = document.querySelector(".ranking--value")

const gameOver = () => {
    const score = Number(scoreElement.innerText);
    const currentHighScore = Number(localStorage.getItem('ranking') || "0");
    const newHighScore = Math.max(score, currentHighScore);

    direction = undefined;

    menu.style.display = "flex";
    finalScore.innerText = score;
    canvas.style.filter = "blur(2px)";
    
    // Save the new high score
    localStorage.setItem('ranking', newHighScore.toString());

    // Display the high score
    rankingElement.innerHTML = "&nbsp;" + newHighScore.toString().padStart(2, '0');
}

// When the game starts, load and display the top score from the ranking
buttonPlay.addEventListener("click", () => {
    const ranking = Number(localStorage.getItem('ranking') || "0")
    scoreElement.innerHTML = "&nbsp;00"
    levelElement.innerHTML = "&nbsp;01"
    livesElement.innerHTML = "&nbsp;03"
    rankingElement.innerHTML = "&nbsp;" + ranking.toString().padStart(2, '0')
    menu.style.display = "none"
    canvas.style.filter = "none"

    snake = [initialPosition]
    level = 1
    lives = 3
    gameLoop()
})

const gameLoop = () => {
    clearInterval(loopId)
    
    updateBackgroundColor(); // Adicione esta linha para atualizar a cor de fundo

    ctx.clearRect(0, 0, 600, 600)
    drawGrid()
    drawFood()
    moveSnake()
    drawSnake()
    checkEat() // corrigido de chackEat para checkEat
    checkCollision()

    loopId = setTimeout(() => {
        gameLoop()
    }, 300 / level) // Aumentando a velocidade conforme o level aumenta
}

gameLoop()

document.addEventListener("keydown", (event) => {
    const { key } = event;

    if (key === "ArrowRight" && direction !== "left") {
        direction = "right";
    } else if (key === "ArrowLeft" && direction !== "right") {
        direction = "left";
    } else if (key === "ArrowUp" && direction !== "down") {
        direction = "up";
    } else if (key === "ArrowDown" && direction !== "up") {
        direction = "down";
    }
});


buttonPlay.addEventListener("click", () => {
    const ranking = Number(localStorage.getItem('ranking') || "0")
    scoreElement.innerHTML = "&nbsp;00"
    levelElement.innerHTML = "&nbsp;01"
    livesElement.innerHTML = "&nbsp;03"

    if (isNaN(ranking)) {
        rankingElement.innerHTML = "&nbsp;00";
    } else {
        rankingElement.innerHTML = "&nbsp;" + ranking.toString().padStart(2, '0');
    }
    
    menu.style.display = "none"
    canvas.style.filter = "none"

    snake = [initialPosition]
    level = 1
    lives = 3
    gameLoop()
})

window.onload = () => {
    const highScore = Number(localStorage.getItem('ranking') || "0");

    scoreElement.innerHTML = "&nbsp;00";
    levelElement.innerHTML = "&nbsp;01";
    livesElement.innerHTML = "&nbsp;03";
    rankingElement.innerHTML = "&nbsp;" + highScore.toString().padStart(2, '0');
};

// Inicializa uma nova conexão WebSocket.
let socket = new WebSocket("ws://localhost:8080");

// Defina as funções de tratamento de eventos do WebSocket.
socket.onopen = function(e) {
  console.log("[open] Conexão estabelecida");
};

socket.onmessage = function(event) {
  console.log(`[message] Dados recebidos do servidor: ${event.data}`);
  switch(event.data) {
    case 'UP':
      // Adicione aqui o código para mover a cobrinha para cima
      break;
    case 'DOWN':
      // Adicione aqui o código para mover a cobrinha para baixo
      break;
    case 'LEFT':
      // Adicione aqui o código para mover a cobrinha para esquerda
      break;
    case 'RIGHT':
      // Adicione aqui o código para mover a cobrinha para direita
      break;
  }
};

socket.onclose = function(event) {
  console.log(`[close] Conexão fechada (código ${event.code}), motivo: ${event.reason}`);
};

socket.onerror = function(error) {
  console.log(`[error] ${error.message}`);
};

document.querySelector(".up-button").addEventListener("touchstart", (event) => {
    event.preventDefault();
    if (direction !== "down") {
        direction = "up";
    }
});

document.querySelector(".down-button").addEventListener("touchstart", (event) => {
    event.preventDefault();
    if (direction !== "up") {
        direction = "down";
    }
});

document.querySelector(".left-button").addEventListener("touchstart", (event) => {
    event.preventDefault();
    if (direction !== "right") {
        direction = "left";
    }
});

document.querySelector(".right-button").addEventListener("touchstart", (event) => {
    event.preventDefault();
    if (direction !== "left") {
        direction = "right";
    }
});
