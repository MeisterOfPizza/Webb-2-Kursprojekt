// Essentials
let camera, scene, renderer, container, directionalLight;
let model;

let isLoading   = true;
let isAnimating = true;

let time          = 0;
let deltaTime     = 0;
let lastTimestamp = Date.now();

let followCursor = false;

function degToRad(degrees)
{
    return degrees * (Math.PI / 180);
}

// Ping pongs value between -length and length.
function pingPong(time, length, speed = 1) {
    return Math.sin(time * speed) * length;
}

$(document).ready(function() {
    init();
    onWindowResize();
});

$(window).resize(function() {
    onWindowResize();
});

function loadingDone() {
    animate();

    onCursorHoldFinish = function() {
        followCursor = true;
    }

    onCursorHoldEnd = function() {
        followCursor = false;
    }
}

function init() {
    container = $("#banner-scene")[0];

    canvas = $("#banner-canvas")[0];
    camera = new THREE.PerspectiveCamera(70, container.clientWidth / container.clientHeight, 0.01, 100);
    camera.position.set(0, 0, 15);
    camera.lookAt(0, 0, 0);

    scene = new THREE.Scene();

    directionalLight = new THREE.DirectionalLight(0xffffff, 8);
    directionalLight.position.set(0, 0, 5);
    directionalLight.lookAt(0, 0, 0);
    scene.add(directionalLight);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    renderer.setClearColor(0x000000, 0);

    {
        var loader = new THREE.GLTFLoader();
        loader.load("../meshes/barren_1.glb", function (glb) {
            model = glb.scene.children[0];
            
            model.position.set(0, 0, 0);

            scene.add(model);

            loadingDone();
        }, undefined, function (error) {
        	console.error(error);
        });
    }
}

function animate() {
    requestAnimationFrame(animate);

    const timestamp = Date.now();
    deltaTime = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;
    time += deltaTime;
    
    renderer.render(scene, camera);

    if (followCursor) {
        let screenMiddle = new THREE.Vector3(container.clientWidth / 2, container.clientHeight / 2, 0);
        let cursorPoint  = new THREE.Vector3(lastCursorPoint.x, lastCursorPoint.y, 0);
        let delta        = cursorPoint.sub(screenMiddle).length();
        let direction    = cursorPoint.normalize();        
        
        model.rotateOnAxis(new THREE.Vector3(direction.y, direction.x, 0), degToRad(0.005 * delta));
    }
}

function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.zoom   = camera.aspect / 1.77 * 0.75;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}