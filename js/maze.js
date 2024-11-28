var ctx, wid, hei, cols, rows, maze, stack = [], stack_next = [], stack_wfs = [], begin = { x: -1, y: -1 }, start = { x: -1, y: -1 }, end = { x: -1, y: -1 }, grid = 8, tmp;
var game = 0, solver = 0, minRow = 10, minCol = 10, maxRow = 160, maxCol = 160, isAniSolv = true, isAniMaze = true;
var colorIdx = 0, solverIdx = 0, colors;

let stepsTaken = [];
let pathLength = 0; 
let timeComplexity = "";

colors = [
	["#64FFDA", "#111111", "#FE53BB", "#3A86FF", "#FF6B35", "#8338EC", "#F7D716"], //Neon Nights
    ["#00B4D8", "#111111", "#FF006E", "#8338EC", "#3A86FF", "#FB5607", "#FFBE0B"], //Cyber Punk
    ["#004D4D", "#008B8B", "#00FFFF", "#00BFFF", "#20B2AA", "#00CED1", "#00FFFF"], //Ocean Deep
	["#E0FFFF", "#B0E0E6", "#FFFFFF", "#000000", "#E0FFFF", "#000000", "#000000"] //Arctic Frost
];

document.addEventListener('DOMContentLoaded', function() {
    // Menu toggle functionality
    const menuIcon = document.querySelector('.menu');
    const navUl = document.querySelector('nav ul');

    menuIcon.addEventListener('click', function() {
        navUl.classList.toggle('show');
        menuIcon.classList.toggle('active');
    });

    // Game start functionality
    init();
    const startButton = document.querySelector('.btn.primary');
    if (startButton) {
        startButton.addEventListener('click', function() {
            document.getElementById('create-username').style.display = 'block';
            gameStart();
        });
    }
});

function openUsernameModal() {
	const modal = document.getElementById("username-modal");
	modal.style.display = "flex";
  }
  
  function closeUsernameModal() {
	const modal = document.getElementById("username-modal");
	modal.style.display = "none";
  }
  
  function createUsername() {
	const usernameInput = document.getElementById("username-input").value.trim();
  
	if (usernameInput === "") {
	  alert("Please enter a valid username!");
	  return;
	}
  
	localStorage.setItem("username", usernameInput);
  
	const modalTemplate = document.getElementById("modal-template").content.cloneNode(true);
	modalTemplate.querySelector(".username-highlight").textContent = usernameInput;
	
	const modalContent = document.getElementById("modal-content");
	modalContent.innerHTML = "";
	modalContent.appendChild(modalTemplate);	
  }

function goToSettings() {
	alert("Navigating to Settings...");
	closeUsernameModal();
	window.location.hash = "#settings";
  }

let startTime, endTime, timerInterval;
let isTimerRunning = false;
let leaderboard = [];
let currentAlgorithm = "BFS";
const algorithms = ["BFS", "A*", "WFS", "DFS", "Dijkstra's"];

function updateTimerDisplay() {
    const timerElement = document.getElementById('timer-display');
    if (!timerElement) return;

    const currentTime = new Date();
    const elapsedTime = (currentTime - startTime) / 1000;
    timerElement.textContent = `Time: ${elapsedTime.toFixed(2)}s`;
}

function startTimer() {
    if (isTimerRunning) return;
    
    startTime = new Date();
    isTimerRunning = true;
    timerInterval = setInterval(updateTimerDisplay, 10);
}

function stopTimer() {
    if (!isTimerRunning) return;
    
    clearInterval(timerInterval);
    endTime = new Date();
    isTimerRunning = false;
    
    const finalTime = (endTime - startTime) / 1000;
    const username = localStorage.getItem('username') || 'Anonymous';
    updateLeaderboard(username, finalTime);
    
    return finalTime;
}

function getCursorPos(event) {
    if (!game) return;

    var rect = this.getBoundingClientRect();
    var x = Math.floor((event.clientX - rect.left) / grid),
        y = Math.floor((event.clientY - rect.top) / grid);

    if (maze[x][y] !== undefined) {
        // Toggle way block
        if (maze[x][y] === 1) {
            maze[x][y] = 0; // Add way block
            drawRect({ x: x, y: y }, 0); // Update canvas
        } else if (maze[x][y] === 0) {
            maze[x][y] = 1; // Add barrier
            drawRect({ x: x, y: y }, 1); // Update canvas
        }

        // Handle start and end points
        if (start.x === -1) {
            start = { x: x, y: y };
            drawRect(start, 6);
        } else if (end.x === -1) {
            end = { x: x, y: y };
            drawRect(end, 5);
            prompt_play("Solving Maze. Enjoy ^_^");
            if (isAniSolv) {
                $("#skp-btn2").fadeIn("slow");
            }
            startTimer();
            solveMaze();
        }
    }
}

function updateLeaderboard(username, time) {
    leaderboard.push({ username: username, time: time, algorithm: currentAlgorithm });
    leaderboard.sort((a, b) => a.time - b.time);

    if (leaderboard.length > 10) {
        leaderboard = leaderboard.slice(0, 10);
    }

    displayLeaderboard();
}

function displayLeaderboard() {
    const leaderboardEntries = document.getElementById('leaderboard-entries');
    leaderboardEntries.innerHTML = "";

    leaderboard.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.username}</td>
            <td>${entry.time.toFixed(2)}</td>
			<td>${entry.algorithm}</td>
        `;
        leaderboardEntries.appendChild(row);
    });
}

function saveLeaderboard(username, time, algorithm) {
    fetch('http://127.0.0.1:5000/save_leaderboard', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, time, algorithm })
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
}

function fetchLeaderboard() {
    fetch('http://127.0.0.1:5000/get_leaderboard')
        .then(response => response.json())
        .then(data => {
            console.log('Leaderboard:', data);
        })
        .catch(error => console.error('Error:', error));
}


// stack stores the visited addresses, stack_next stores the next possible positions
// tmp stores the top element of the stack every time the function pops from the stack after the path search ends
// game = 1 means the game is running, 0 means the game is over
// solver represents the solving method: 0 : BFS search / 1 : A* search / 2 : BFS / 3 : DFS (original program) / 4 : Dijkstra
function solverChange() {
    if (game) {
        prompt_settings("It's gaming! Please Change it after game!");
        return;
    }
    solverIdx = parseInt($("input[name='solvers']:checked").val());
    currentAlgorithm = algorithms[solverIdx];
}

function colorChange() {
	// Using jQuery to return the selected value of colors
	colorIdx = parseInt( $("input[name='colors']:checked").val() );
	// Using jQuery, if the canvas element exists, re-render it
	if ($("#canvas").length > 0)
		drawMaze();
}
// skip just skips the animation once, and the value of $("#inAniSolv") will restore it later
function skip1() {
	if (isAniMaze) {
		isAniMaze = false;
		$("#skp-btn1").fadeOut("slow");
	}
}
function skip2() {
	if (isAniSolv) {
		isAniSolv = false;
		$("#skp-btn2").fadeOut("slow");
	}
}
function iniGame() {
    stack = [];
    stack_next = [];
    stack_wfs = [];
    begin = { x: -1, y: -1 };
    start = { x: -1, y: -1 };
    end = { x: -1, y: -1 };
    stepsTaken = [];
    pathLength = 0;
    timeComplexity = "";
}

function gameOver() {
    if (isTimerRunning) {
        const finalTime = stopTimer();
        prompt_play(`Maze completed in ${finalTime.toFixed(2)} seconds!`);

        // Calculate time complexity based on the algorithm
		if (solverIdx === 0 || solverIdx === 3) { // BFS or DFS
			timeComplexity = `O(${cols * rows} + ${cols * rows * 4})`;
		} else if (solverIdx === 4) { // Dijkstra
			timeComplexity = `O(${cols * rows}^2)`;
		} else if (solverIdx === 1) { // A*
			let branchingFactor = 4; // Up, down, left, right
			let depth = Math.ceil(Math.sqrt(cols * rows)); // Approximate maximum depth in a grid
			timeComplexity = `O(${branchingFactor}^${depth}) or O(${cols * rows})`;
		} else if (solverIdx === 2) { // WFS
			timeComplexity = `O(${cols} * ${rows}) or O(${cols}^3)`;
		}		

        console.log("Steps Taken:", stepsTaken.length);
        console.log("Path Length:", pathLength);
        console.log("Time Complexity:", timeComplexity);

        showAlgorithmExplanation(currentAlgorithm, stepsTaken.length, pathLength, timeComplexity);
		openModal();
    }

    iniGame();
    $("#skp-btn2").fadeOut("slow");
    isAniSolv = $("#inAniSolv").prop('checked');
    $("#solver0").attr("disabled", false);
    $("#solver1").attr("disabled", false);
    $("#solver2").attr("disabled", false);
    $("#solver3").attr("disabled", false);

    onGameEnd();
}
	
function prompt_settings(message) {
	// Use jQuery method to modify the content of the <p> tag, the following is the native JS method
	// document.getElementById("#hint_settings").innerHTML = message;
	$("#hint_settings").hide();
	$("#hint_settings").html(message);
	$("#hint_settings").fadeIn("slow");
}
function prompt_play(message) {
	$("#hint_play").hide();
	$("#hint_play").html(message);
	$("#hint_play").fadeIn("slow");
}
function sorter(var_a, var_b) {
	// A* path weight calculation
	if (solverIdx == 1) {
		var Dis1 = Math.abs(var_a.x - begin.x) + Math.abs(var_a.y - begin.y) + Math.abs(var_a.x - end.x) + Math.abs(var_a.y - end.y);
		var Dis2 = Math.abs(var_b.x - begin.x) + Math.abs(var_b.y - begin.y) + Math.abs(var_b.x - end.x) + Math.abs(var_b.y - end.y);
	}
	// BFS path weight calculation
	if (solverIdx == 0) {
		var Dis1 = Math.abs(var_a.x - end.x) + Math.abs(var_a.y - end.y);
		var Dis2 = Math.abs(var_b.x - end.x) + Math.abs(var_b.y - end.y);
	}
	return Dis2 > Dis1;
}
// Check if two coordinates are adjacent
function isNext(a, b) {
	return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) == 1;
}

function drawRect(VAR, TO) {
    maze[VAR.x][VAR.y] = TO;

    ctx.shadowColor = "rgba(100, 255, 218, 0.8)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    if (colorIdx < 0 || colorIdx >= colors.length) {
        console.error("Invalid colorIdx:", colorIdx);
        return;
    }

    // Set fill color based on the type of cell
    switch (TO) {
        case 0: ctx.fillStyle = colors[colorIdx][0]; break;   // Path
        case 1: ctx.fillStyle = colors[colorIdx][1]; break;   // Wall
        case 2: ctx.fillStyle = colors[colorIdx][2]; break;   // Current path
        case 3: ctx.fillStyle = colors[colorIdx][3]; break;   // Correct path
        case 4: ctx.fillStyle = colors[colorIdx][4]; break;   // Path to go / Wrong path
        case 5: ctx.fillStyle = colors[colorIdx][5]; break;   // Starting point
        case 6: ctx.fillStyle = colors[colorIdx][6]; break;   // End point
        default: console.error("Invalid TO value:", TO); return; // Handle invalid TO
    }

    ctx.fillRect(VAR.x * grid, VAR.y * grid, grid, grid);
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
}
const DIFFICULTY_SETTINGS = {
    easy: { cols: 40, rows: 30 },
    medium: { cols: 70, rows: 50 },
    hard: { cols: 90, rows: 70 }
};

function setDifficultyLevel() {
    const difficultySelect = document.getElementById('difficulty-select');
    const selectedDifficulty = difficultySelect.value;
    
    cols = DIFFICULTY_SETTINGS[selectedDifficulty].cols;
    rows = DIFFICULTY_SETTINGS[selectedDifficulty].rows;
    
    prompt_settings(`Difficulty set to: ${selectedDifficulty}`);
}
const algorithmExplanations = {
    "BFS": "Breadth-First Search (BFS) explores all possible paths level by level, ensuring the shortest path is found in an unweighted grid.",
    "A*": "A* Search uses heuristics to prioritize paths that seem closer to the goal, balancing speed and accuracy.",
    "WFS": "Wavefront Search propagates outward like BFS but can be optimized for specific scenarios.",
    "DFS": "Depth-First Search (DFS) explores as far as possible along a branch before backtracking, which may not guarantee the shortest path.",
    "Dijkstra's": "Dijkstra's Algorithm systematically calculates the shortest path from the start to the goal using edge weights."
};
function showAlgorithmExplanation(algorithm, stepsTakenCount, pathLength, timeComplexity) {
    const explanationModal = document.getElementById("algorithm-explanation-modal");
    const explanationText = document.getElementById("algorithm-explanation-text");

    let explanation = algorithmExplanations[algorithm] || "Explanation not available.";
    
    let analysisMessage = `Algorithm: ${algorithm}\n`;
    analysisMessage += `Steps taken: ${stepsTakenCount}\n`;
    analysisMessage += `Path Length: ${pathLength}\n`;
    analysisMessage += `Time Complexity: ${timeComplexity}\n`;
    
    explanation += `\n\n${analysisMessage}`;
    
    explanationText.innerText = explanation;
    explanationModal.style.display = "block";
}
function closeModal() {
    const explanationModal = document.getElementById("algorithm-explanation-modal");
    explanationModal.style.display = "none";
}
function onGameEnd() {
    showAlgorithmExplanation(currentAlgorithm);
}

function drawMaze() {
	for (var i = 0; i < cols; i++) {
		for (var j = 0; j < rows; j++) {
			switch (maze[i][j]) {
				case 0: ctx.fillStyle = colors[colorIdx][0]; break;
				case 1: ctx.fillStyle = colors[colorIdx][1]; break;
				case 2: ctx.fillStyle = colors[colorIdx][2]; break;
				case 3: ctx.fillStyle = colors[colorIdx][3]; break;
				case 4: ctx.fillStyle = colors[colorIdx][4]; break;
				case 5: ctx.fillStyle = colors[colorIdx][5]; break; 
				case 6: ctx.fillStyle = colors[colorIdx][6]; break; 
			}
			ctx.fillRect(grid * i, grid * j, grid, grid);
		}
	}
}
function getFNeighbours(n, sx, sy, a) {
	if (sx - 1 > 0 && maze[sx - 1][sy] == a) {
		n.push({ x: sx - 1, y: sy });
	}
	if (sx + 1 < cols - 1 && maze[sx + 1][sy] == a) {
		n.push({ x: sx + 1, y: sy });
	}
	if (sy - 1 > 0 && maze[sx][sy - 1] == a) {
		n.push({ x: sx, y: sy - 1 });
	}
	if (sy + 1 < rows - 1 && maze[sx][sy + 1] == a) {
		n.push({ x: sx, y: sy + 1 });
	}
	return n;
}
function drawPath() {
    if (start.x == -1) return;
    do {
        tmp = stack.pop();
        stepsTaken.push({ x: tmp.x, y: tmp.y });
        pathLength++;

        console.log("Steps Taken:", stepsTaken.length);
        console.log("Path Length:", pathLength);

        if (isNext(tmp, start)) {
            if (maze[tmp.x][tmp.y] == 2) drawRect(tmp, 3);
            start = tmp;
            break;
        }
        if (maze[tmp.x][tmp.y] == 2) drawRect(tmp, 4);
    } while (stack.length && !isNext(tmp, start))
    if (stack.length < 1) {
        gameOver();
        return;
    }
}
function BFS_Astar() {
	if (start.x == -1)
		return;
	while (true) {
		if (game == 0 || (start.x == end.x && start.y == end.y) ) {
			game = 0;
			drawPath();
			if (stack.length < 1) 
				return;
		}
		else {
			var neighbours = [];
			getFNeighbours(neighbours, start.x, start.y, 0);
			getFNeighbours(neighbours, start.x, start.y, 5);
			// Push the current step into the stack
			stack.push(start);
			// If the place being moved to is a "to be walked" position, and not the start/end point, change it to "current path" color
			if (maze[start.x][start.y] == 4)
				drawRect(start, 2);
			// If there are places around the current node
			if (neighbours.length) {
				// Push all walkable places into the "walkable stack", stack_next, and greedily sort stack_next by BFS
				for (var i = 0; i < neighbours.length; ++i) {
					stack_next.push(neighbours[i]);
					// Change the color of the "to be walked" empty spots
					if (maze[neighbours[i].x][neighbours[i].y] == 0)
						drawRect(neighbours[i], 4);
				}
				stack_next.sort(sorter);
			}
			// Use the most greedy position as the next step to explore
			start = stack_next.pop();
		}
		if (isAniSolv) {
			requestAnimationFrame(BFS_Astar);
			return;
		}
	}
}

function WFS() {
	if (start.x == -1)
		return;
	while (true) {
		if (game == 0 || (start.x == end.x && start.y == end.y) ) {
			game = 0;
			drawPath();
			if (stack.length < 1) 
				return;
		}
		else {
			var neighbours = [];
			stack.push(start);
			// First, check all locations in stack_next, store connected places in neighbours
			while (stack_next.length > 0){
				start = stack_next.pop();
				getFNeighbours(neighbours, start.x, start.y, 0);
				getFNeighbours(neighbours, start.x, start.y, 5);
				// Found it, directly terminate
				if (start.x == end.x && start.y == end.y){
					requestAnimationFrame( WFS );
					return;
				}
				stack.push(start);
				if (maze[start.x][start.y] == 4)
					drawRect(start, 2);
			}
			// Then store the values of neighbours into stack_next for the next search
			if (neighbours.length > 0) {
				for (var i = 0; i < neighbours.length; ++i) {
					stack_next.push(neighbours[i]);
					if (maze[neighbours[i].x][neighbours[i].y] == 0)
						drawRect(neighbours[i], 4);
				}
			}
		}
		if (isAniSolv) {
			requestAnimationFrame( WFS );
			return;
		}
	}
}
function DFS() {
	if (start.x == -1)
		return;
	while (true) {
		if (game == 0 || (start.x == end.x && start.y == end.y) ) {
			game = 0;
			drawPath();
			if (stack.length < 1) 
				return;
		}
		else {
			var neighbours = [];
			getFNeighbours(neighbours, start.x, start.y, 0);
			getFNeighbours(neighbours, start.x, start.y, 5);
			stack.push(start);
			if ( maze[start.x][start.y] == 0 )
				drawRect(start, 2);
			if ( neighbours.length > 0 ) {
				for (var i = 0; i < neighbours.length; ++i) {
					stack.push(neighbours[i]);
				}
			}
			else{
				drawRect(start, 4);
				start = stack.pop();
			}
			start = stack.pop();
		}
		if (isAniSolv) {
			requestAnimationFrame(DFS);
			return;
		}
	}
}
function Dijkstra() {
	if (start.x === -1) return;

	// Initialize distance and priority queue for visualization
	let distance = Array.from(Array(maze.length), () => Array(maze[0].length).fill(Infinity));
	distance[start.x][start.y] = 0;

	let priorityQueue = [{ x: start.x, y: start.y, dist: 0 }];
	let visited = new Set();

	function step() {
		if (priorityQueue.length === 0) {
            return;
        }

		// Sort queue to get the cell with the smallest distance
		priorityQueue.sort((a, b) => a.dist - b.dist);
		let { x, y, dist } = priorityQueue.shift();
		let currentKey = `${x}-${y}`;
		if (visited.has(currentKey)) {
			if (isAniSolv) {
				requestAnimationFrame(step);
			} else {
				step();
			}
			return;
		}
		visited.add(currentKey);

		// Check if we've reached the end
		if (x === end.x && y === end.y) {
			game = 0;
            stopTimer();
            drawPath();
			return;
		}

		// Get neighbors and process each one
		let neighbours = [];
		getFNeighbours(neighbours, x, y, 0);
		getFNeighbours(neighbours, x, y, 5);

		for (let i = 0; i < neighbours.length; i++) {
			let nx = neighbours[i].x;
			let ny = neighbours[i].y;
			let newDist = dist + 1; // Assuming uniform cost of 1

			if (newDist < distance[nx][ny]) {
				distance[nx][ny] = newDist;
				priorityQueue.push({ x: nx, y: ny, dist: newDist });
				stack.push({ x: nx, y: ny });

				if (maze[nx][ny] === 0) drawRect(neighbours[i], 4);
			}
		}

		// Visualize current path point
		if (maze[x][y] === 4) drawRect({ x, y }, 2);
		if (isAniSolv) {
			requestAnimationFrame(step);
		} else {
			step();
		}
	}

	if (isAniSolv) {
		requestAnimationFrame(step);
	} else {
		step();
	}
}

function solveMaze() {
    if (start.x == -1 || end.x == -1) return;
    stepsTaken = [];
    pathLength = 0;
    pathCoordinates = [];
    switch (solverIdx) {
        case 0: 
            timeComplexity = "O(V + E)"; // BFS
            BFS_Astar(); 
            break;
        case 1: 
            timeComplexity = "O(V + E)"; // A*
            BFS_Astar(); 
            break;
        case 2: 
            timeComplexity = "O(V + E)"; // WFS
            stack_next.push(start); 
            WFS(); 
            break;
        case 3: 
            timeComplexity = "O(V + E)"; // DFS
            DFS(); 
            break;
        case 4: 
            timeComplexity = "O(E log V)"; // Dijkstra
            Dijkstra(); 
            break;
    }
}
// Bug: The fadeIn animation doesn't work properly when loading, and fadeOut doesn't take effect
function scrollEvent(event) {
	if (event.wheelDelta || event.detail) {
		//console.log(document.documentElement.scrollTop);
		if (document.documentElement.scrollTop > 550 && $("#topNav").is(":visible") == false)
			//topNav.style.cssText="display: inline;";
			$("#topNav").fadeIn("slow");
		if (document.documentElement.scrollTop < 550 && $("#topNav").is(":visible") == true)
			//topNav.style.display = "none";
			//topNav.style.cssText="display: none";
			$("#topNav").fadeOut("slow");
	}
}

function getNeighbours(sx, sy, a) {
	var n = [];
	if (sx - 1 > 0 && maze[sx - 1][sy] == a && sx - 2 > 0 && maze[sx - 2][sy] == a) {
		n.push({ x: sx - 1, y: sy }); n.push({ x: sx - 2, y: sy });
	}
	if (sx + 1 < cols - 1 && maze[sx + 1][sy] == a && sx + 2 < cols - 1 && maze[sx + 2][sy] == a) {
		n.push({ x: sx + 1, y: sy }); n.push({ x: sx + 2, y: sy });
	}
	if (sy - 1 > 0 && maze[sx][sy - 1] == a && sy - 2 > 0 && maze[sx][sy - 2] == a) {
		n.push({ x: sx, y: sy - 1 }); n.push({ x: sx, y: sy - 2 });
	}
	if (sy + 1 < rows - 1 && maze[sx][sy + 1] == a && sy + 2 < rows - 1 && maze[sx][sy + 2] == a) {
		n.push({ x: sx, y: sy + 1 }); n.push({ x: sx, y: sy + 2 });
	}
	return n;
}
function createArray(c, r) {
	var m = new Array(c);
	for (var i = 0; i < c; i++) {
		m[i] = new Array(r);
		for (var j = 0; j < r; j++) {
			m[i][j] = 1;
		}
	}
	return m;
}
function createMaze() {
	if (start.x == -1)
		return;
	while (true) {
		var neighbours = getNeighbours(start.x, start.y, 1), l;
		if (neighbours.length < 1) {
			if (stack.length < 1) {
				$("#skp-btn2").fadeOut("slow");
				isAniMaze = $("#inAniMaze").prop('checked');
				prompt_play("Note: Please select two points for path observation by computer.");
				return;
			}
			// Pop all operations that do not need rendering to speed up the algorithm by avoiding redundant rendering
			do {
				start = stack.pop();
				neighbours = getNeighbours(start.x, start.y, 1);
			} while (neighbours.length < 1 && stack.length > 0)
			if (stack.length < 1) {
				stack = [];
				start.x = start.y = -1;
				document.getElementById("canvas").addEventListener("mousedown", getCursorPos, false);
				$("#skp-btn1").fadeOut("slow");
				isAniMaze = $("#inAniMaze").prop('checked');
				prompt_play("Note: Please select two points for path observation by computer.");
				return;
			}
		} else {
			var i = 2 * Math.floor(Math.random() * (neighbours.length / 2))
			l = neighbours[i]; drawRect(l, 0);
			l = neighbours[i + 1]; drawRect(l, 0);
			start = l
			stack.push(start)
		}
		if (isAniMaze) {
			requestAnimationFrame(createMaze);
			break;
		}
	}
}

function createCanvas(w, h) {
    var canvas = document.createElement("canvas");
    wid = w; hei = h;
    canvas.width = wid; canvas.height = hei;
    canvas.id = "canvas";
    ctx = canvas.getContext("2d");
    ctx.fillStyle = "black"; ctx.fillRect(0, 0, wid, hei);
    var div = document.getElementById("maze");
    div.appendChild(canvas);
    canvas.addEventListener("mousedown", getCursorPos, false);
}

function gameStart() {
	alert("Starting the game...");
    closeUsernameModal();
	window.location.hash = "#play";

    if (game)
        return;
    
    if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
    }
    
    game = 1;
    iniGame();
    $("#solver0").attr("disabled", true);
    $("#solver1").attr("disabled", true);
    $("#solver2").attr("disabled", true);
    $("#solver3").attr("disabled", true);
    prompt_settings("You can change solver and difficulty after game!");
    
    const mazeContainer = document.getElementById("maze");
    mazeContainer.innerHTML = "";
    var div = document.getElementById("maze");
    var canvas = document.getElementById("canvas");
    if (canvas)
        div.removeChild(canvas);
    
    createCanvas(grid * cols, grid * rows);
    maze = createArray(cols, rows);
    
    // Randomize start point within the first half of the maze
    start.x = Math.floor(Math.random() * (cols / 2));
    start.y = Math.floor(Math.random() * (rows / 2));
    
    // Ensure start coordinates are odd for maze generation
    if (!(start.x & 1)) start.x++;
    if (!(start.y & 1)) start.y++;
    
    drawRect(start, 0);
    $("#rst-btn").fadeIn("slow");
    prompt_play("Creating Maze~");
    
    if (isAniMaze)
        $("#skp-btn1").fadeIn("slow");
    
    createMaze();
    drawMaze();
}

function gameRestart() {
	game = 0;
	var div = document.getElementById("maze");
	var canvas = document.getElementById("canvas");
	div.removeChild(canvas);
	gameStart();

	// Force animation mode for maze generation
    isAniMaze = true;
    $("#inAniMaze").prop("checked", true);

	// Navigate to settings section
    window.location.hash = "#settings";

    // Re-enable algorithm selection buttons
    $("#solver0").attr("disabled", false);
    $("#solver1").attr("disabled", false);
    $("#solver2").attr("disabled", false);
    $("#solver3").attr("disabled", false);

    // Clear any previous game state
    iniGame();
    
    // Prompt user to select start and end points
    prompt_play("Note: Please select two points for path observation by computer.");
}

function checkChange() {
	if (!game) {
		prompt_settings("Setting done!");
		isAniSolv = $("#inAniSolv").prop('checked');
		isAniMaze = $("#inAniMaze").prop('checked');
	}
	else {
		prompt_settings("It's gaming, please change it after game!!");
		$("#inAniSolv").prop("checked", isAniSolv);
		$("#inAniMaze").prop("checked", isAniMaze);
	}
}

function init() {
	$("#color0").attr('checked', true);
	$("#solver0").attr('checked', true);
	cols = 120; rows = 80;
	$("#toNav").hide();
	$("#rst-btn").hide();
	$("#skp-btn1").hide();
	$("#skp-btn2").hide();
	// Default the checkboxes to checked
	$("#inAniSolv").prop("checked", true);
	$("#inAniMaze").prop("checked", true);
	solverChange();
	colorChange();
	isAniSolv = true; isAniMaze = true;
	document.addEventListener('DOMMouseScroll', scrollEvent, false);
	document.getElementById('difficulty-select').value = 'medium';
	document.getElementById('difficulty-select').addEventListener('change', setDifficultyLevel);
	setDifficultyLevel();
	}
