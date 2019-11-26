// Essentials //
let camera, scene, renderer, container, directionalLight;
let ship;
let laneIndex = 1;
let asteroids;
let coins;

// Post processing //

let composer;
let renderPass, bloomPass, chromaticAberrationPass;

// Game cycle //

let time          = 0;
let deltaTime     = 0;
let lastTimestamp = undefined;

let   normalizedDragTilt = 0;
const dragTilt           = 5;

let lastlaneObjectSpawnCooldown = 0;

let isStarted  = false;
let isGameOver = false;
let gameOverContainer;

// Gameplay //

let   score                   = 0;
let   timeAlive               = 0;
let   normalizedDifficulty    = 0;
let   laneObjectSpeed         = 0.05;
let   laneObjectHeightGain    = laneObjectSpeed * 0.2;
let   laneObjectSpawnCooldown = 0.75;
const maxDifficultyTimeAlive  = 3600; // One factor raised to the power of 2.

let scoreText;
let timeAliveText;

// Leaderboard //

let leaderboard = []
let leaderboardList;

// Constants //

const laneWidth         = 1;
const laneObjectSpawnZ  = -20;
const laneObjectTargetZ = 3;
const asteroidCount     = 20;
const asteroidRadius    = 0.2;
const coinCount         = 10;
const coinRadius        = 0.15;

// Helper class.
class GameObject {
    constructor(obj, geometry) {
        this.obj = obj;
        this.geometry = geometry;
        this.geometry.computeBoundingBox();
        this.boundingBox = geometry.boundingBox.clone();
    }

    updateGameObjectCollider() {
        this.boundingBox.copy(this.geometry.boundingBox).applyMatrix4(this.obj.matrixWorld);
    }
}

function degToRad(degrees)
{
    return degrees * (Math.PI / 180);
}

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

// Ping pongs value between -length and length.
function pingPong(time, length, speed = 1) {
    return Math.sin(time * speed) * length;
}

function collisionWithPlayer(hitbox) {
    return ship.boundingBox.intersectsBox(hitbox);
}

$(document).ready(function() {
    init();
    addComposer();
    onWindowResize();
});

$(window).resize(function() {
    onWindowResize();
});

function start() {
    isStarted = true;

    lastTimestamp = Date.now();

    $("#game-ui-container").css("display", "inherit");
    $("#start-game-container").css("display", "none");

    setInterval(function () {
        update();
    }, 1);
}

function retry() {
    isGameOver = false;

    scoreText.text("Score: 0");
    timeAliveText.text("Time alive: 0 seconds");
    gameOverContainer.css("display", "none");
}

function loadingDone() {
    createAsteroidPool();
    createCoinPool();
    animate();
}

function init() {
    container = $("#game-scene")[0];

    canvas = $(".canvas")[0];
    camera = new THREE.PerspectiveCamera(70, container.clientWidth / container.clientHeight, 0.01, 100);
    camera.position.set(0, 0.5, 1);
    camera.lookAt(0, 0.35, -2);

    scene = new THREE.Scene();

    directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    scene.add(directionalLight);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    scoreText     = $("#score-text").first();
    timeAliveText = $("#time-alive-text").first();

    leaderboardList = $("#leaderboard-list");

    loadLeaderboard();

    $(document).keypress(function(e) {
        if (e.key.toLowerCase() == "a") {
            switchLane(false);
        }
        else if (e.key.toLowerCase() == "d") {
            switchLane(true);
        }
    });

    gameOverContainer = $("#game-over-container");

    {
        const loader = new THREE.CubeTextureLoader();
        const texture = loader.load([
            'images/skyboxes/space-skybox-2-pos-x.jpg',
            'images/skyboxes/space-skybox-2-neg-x.jpg',
            'images/skyboxes/space-skybox-2-pos-y.jpg',
            'images/skyboxes/space-skybox-2-neg-y.jpg',
            'images/skyboxes/space-skybox-2-pos-z.jpg',
            'images/skyboxes/space-skybox-2-neg-z.jpg',
        ]);
        scene.background = texture;
    }

    {
        var loader = new THREE.GLTFLoader();
        loader.load("../meshes/player_ship.glb", function (glb) {
            let model = glb.scene.children[0];
            
            model.position.set(0, 0, 0);
            model.scale.set(0.075, 0.075, 0.075);
            model.rotateY(degToRad(180));
            
            geometry = model.children[0].geometry;
            
            ship = new GameObject(model, geometry);

            scene.add(ship.obj);

            loadingDone();
        }, undefined, function (error) {
        	console.error(error);

            let geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
            let material = new THREE.MeshNormalMaterial();
        
            let model = new THREE.Mesh(geometry, material);

            ship = new GameObject(model, geometry);

            scene.add(ship.obj);

            loadingDone();
        });
    }
}

function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.zoom   = camera.aspect / 1.77 * 0.75;
    camera.updateProjectionMatrix();

    chromaticAberrationPass.uniforms["resolution"].value = new THREE.Vector2(
		container.clientWidth,
		container.clientHeight
    );
    bloomPass.setSize(container.clientWidth, container.clientHeight);

    composer.setSize(container.clientWidth, container.clientHeight);
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    requestAnimationFrame(gameLoop);

    ship.obj.position.lerp(new THREE.Vector3((laneIndex - 1) * laneWidth, 0, 0), 0.1);        
    ship.obj.translateY(pingPong(time, 0.005, 3) - 0.01);
    ship.obj.rotateZ(degToRad(normalizedDragTilt));
    normalizedDragTilt = THREE.Math.lerp(normalizedDragTilt, 0, 0.1);

    ship.updateGameObjectCollider();

    composer.render();
}

function update() {
    const timestamp = Date.now();
    deltaTime = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;
    time += deltaTime;

    lastlaneObjectSpawnCooldown -= deltaTime;

    calculateDifficulty();

    if (!isGameOver) {
        timeAlive += deltaTime;

        timeAliveText.text("Time alive: " + timeAlive.toFixed(1) + " seconds");
    }

    if (lastlaneObjectSpawnCooldown < 0 && !isGameOver) {
        lastlaneObjectSpawnCooldown = laneObjectSpawnCooldown;

        let chance = Math.random();

        if (chance > 0.25) {
            spawnObject(randomInt(0, 3), asteroids);
        }
        else {
            spawnObject(randomInt(0, 3), coins);
        }
    }

    // Calculates the normalized difficulty and sets
    // lane object speed, height gain, and spawn cooldown.
    function calculateDifficulty() {
        // timeAlive : t0
        // maxDifficultyTimeAlive : t1
        // normalizedDifficulty = nd = t0^2 / t1
        // speed = s = 0.05 + 0.45 * nd
        // heightGain = s * 0.2

        normalizedDifficulty    = Math.min(Math.pow(timeAlive, 2) / maxDifficultyTimeAlive, 1);
        laneObjectSpeed         = 0.05 + 0.45 * normalizedDifficulty;
        laneObjectHeightGain    = laneObjectSpeed * 0.2;
        laneObjectSpawnCooldown = 0.75 - normalizedDifficulty * 0.5;
    }
}

function switchLane(right) {
    if (isStarted) {
        if (!((laneIndex === 0 && !right) || (laneIndex === 2 && right))) {
            laneIndex = Math.min(Math.max(laneIndex + (right ? 1 : -1), 0), 2);

            normalizedDragTilt += right ? -dragTilt : dragTilt;
        }
    }
}

function gameLoop() {
    if (!isGameOver) {
        updateAsteroids();
        updateCoins();
    }

    function updateAsteroids() {
        asteroids.forEach(gameObject => {
            const obj = gameObject.obj;

            if (obj.visible) {
                obj.translateZ(laneObjectSpeed);
                obj.position.lerp(new THREE.Vector3(obj.position.x, 0, obj.position.z), laneObjectHeightGain);
                gameObject.updateGameObjectCollider();

                if (obj.position.z >= laneObjectTargetZ) {
                    despawnObject(gameObject, asteroids);
                }
                else if (collisionWithPlayer(gameObject.boundingBox)) {
                    gameOver();
                }
            }
        });
    }

    function updateCoins() {
        coins.forEach(gameObject => {
            const obj = gameObject.obj;

            if (obj.visible) {
                obj.translateY(laneObjectSpeed);
                obj.position.lerp(new THREE.Vector3(obj.position.x, 0, obj.position.z), laneObjectHeightGain);
                gameObject.updateGameObjectCollider();

                if (obj.position.z >= laneObjectTargetZ) {
                    despawnObject(gameObject, coins);
                }
                else if (collisionWithPlayer(gameObject.boundingBox)) {
                    despawnObject(gameObject, coins);
                    increaseScore();
                }
            }
        });
    }
}

function createAsteroidPool() {
    asteroids = [];

    for (let i = 0; i < asteroidCount; i++) {
        geometry = new THREE.SphereGeometry(asteroidRadius, asteroidRadius, asteroidRadius);
        material = new THREE.MeshBasicMaterial({ color: 0xf70f4d });

        const obj = new THREE.Mesh(geometry, material);
        obj.visible = false;
        scene.add(obj);
        asteroids.push(new GameObject(obj, geometry));
    }
}

function createCoinPool() {
    coins = [];

    for (let i = 0; i < coinCount; i++) {
        geometry = new THREE.SphereGeometry(coinRadius, coinRadius, coinRadius);
        material = new THREE.MeshBasicMaterial({ color: 0xffffff });

        const obj = new THREE.Mesh(geometry, material);
        obj.visible = false;
        obj.rotateX(degToRad(90));
        scene.add(obj);
        coins.push(new GameObject(obj, geometry));
    }
}

function spawnObject(lane, pool) {
    for (let i = 0; i < pool.length; i++) {
        const element = pool[i].obj;

        if (!element.visible) {
            element.position.set((lane - 1) * laneWidth, -10, laneObjectSpawnZ);
            element.visible = true;
            break;
        }
    }
}

function despawnObject(object, pool) {
    for (let i = 0; i < pool.length; i++) {
        const element = pool[i];
        
        if (element === object) {
            element.obj.visible = false;
            break;
        }
    }
}

function despawnAllObjects(pool) {
    pool.forEach(element => {
        element.obj.visible = false;
    });
}

function increaseScore() {
    score++;
    scoreText.text("Score: " + score);
}

function gameOver() {
    isGameOver = true;

    createLeaderboardUser(prompt("Input username"), score, timeAlive);

    score     = 0;
    timeAlive = 0;

    gameOverContainer.css("display", "grid");

    despawnAllObjects(asteroids);
    despawnAllObjects(coins);
}

function addComposer() {
	//composer
	composer = new THREE.EffectComposer(renderer);

	//passes
	renderPass = new THREE.RenderPass(scene, camera);

	let chromaticAberration = {
		uniforms: {
			tDiffuse: { type: "t", value: null },
			resolution: {
				value: new THREE.Vector2(
					container.clientWidth,
					container.clientHeight
				)
			},
			power: { value: 0.5 }
		},

		vertexShader: `
    
        varying vec2 vUv;
    
        void main() {
    
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    
        }
        `,

		fragmentShader: `
			uniform sampler2D tDiffuse;
			uniform vec2 resolution;

			vec2 barrelDistortion(vec2 coord, float amt) {
				vec2 cc = coord - 0.5;
				float dist = dot(cc, cc);
				return coord + cc * dist * amt;
			}

			float sat( float t )
			{
				return clamp( t, 0.0, 1.0 );
			}

			float linterp( float t ) {
				return sat( 1.0 - abs( 2.0*t - 1.0 ) );
			}

			float remap( float t, float a, float b ) {
				return sat( (t - a) / (b - a) );
			}

			vec4 spectrum_offset( float t ) {
				vec4 ret;
				float lo = step(t,0.5);
				float hi = 1.0-lo;
				float w = linterp( remap( t, 1.0/6.0, 5.0/6.0 ) );
				ret = vec4(lo,1.0,hi, 1.0) * vec4(1.0-w, w, 1.0-w, 1.);

				return pow( ret, vec4(1.0/2.2) );
			}

			const float max_distort = 0.8;
			const int num_iter = 8;
			const float reci_num_iter_f = 1.0 / float(num_iter);

			void main()
			{	
				vec2 uv=(gl_FragCoord.xy/resolution.xy*1.0);

				vec4 sumcol = vec4(0.0);
				vec4 sumw = vec4(0.0);	
				for ( int i=0; i<num_iter;++i )
				{
					float t = float(i) * reci_num_iter_f;
					vec4 w = spectrum_offset( t );
					sumw += w;
					sumcol += w * texture2D( tDiffuse, barrelDistortion(uv, .6 * max_distort*t ) );
				}

				gl_FragColor = sumcol / sumw;
			}
      `
	};
	chromaticAberrationPass = new THREE.ShaderPass(chromaticAberration);

	bloomPass = new THREE.UnrealBloomPass(
		new THREE.Vector2(container.clientWidth, container.clientHeight),
		1.5,
		0.4,
		0.85
    );
	bloomPass.threshold = 0.0;
	bloomPass.strength  = 1.0;
	bloomPass.radius    = 1.0;

	let antialiasPass = new THREE.ShaderPass(THREE.FXAAShader);

	composer.addPass(renderPass);
	composer.addPass(bloomPass);
	composer.addPass(chromaticAberrationPass);
	composer.addPass(antialiasPass);
	antialiasPass.renderToScreen = true;
}

function loadLeaderboard() {
    let cookies = document.cookie;

    // A leaderboard exists:
    if (cookies !== undefined && cookies.length > 0) {
        leaderboard = JSON.parse(cookies);

        buildLeaderboardList();
    }
}

function saveLeaderboard() {
    document.cookie = JSON.stringify(leaderboard);
}

function createLeaderboardUser(username, score, timeAlive) {
    if (!username || username.length === 0) {
        username = "User " + randomInt(1, 1000);
    }

    leaderboard.push({ username, score, timeAlive });

    // Sort the leaderboard by score and time alive (equal weight).
    leaderboard.sort((a, b) => ((b.score - a.score) + (b.timeAlive - a.timeAlive)));

    // Trim the array to a maximum length of 5.
    leaderboard = leaderboard.slice(0, Math.min(leaderboard.length, 5));

    buildLeaderboardList();

    saveLeaderboard();
}

function buildLeaderboardList() {
    leaderboardList.empty();

    leaderboard.forEach(user => {
        createLeaderboardUserItem(user);
    });
}

function createLeaderboardUserItem(user) {
    let element = $.parseHTML(
    `<li>
        <h3>${user.username}</h3>
        <p>Got ${user.score} score in ${user.timeAlive.toFixed(1)} seconds</p>
    </li>`);

    leaderboardList.append(element);
}