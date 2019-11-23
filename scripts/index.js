// Essentials
let camera, scene, renderer, container, directionalLight;
let model;

let followCursor = false;

let currentSpinSpeed  = 0;
let lastSpinDirection = new THREE.Vector3();
let lastSpinDelta     = 0;

const spinSpeed = 0.005;

function degToRad(degrees)
{
    return degrees * (Math.PI / 180);
}

// Ping pongs value between -length and length.
function pingPong(time, length, speed = 1) {
    return Math.sin(time * speed) * length;
}

function lerp(start, end, t) {
    return (1 - t) * start + t * end;
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

    onCoreCallback("onCursorHoldFinish", function() {
        followCursor = true;
    });

    onCoreCallback("onCursorUp", function() {
        followCursor = false;
    });

    $(window).scroll(function() {
        let scale = Math.max(0.01, Math.min(1, 1 - window.scrollY / window.innerHeight));
        model.scale.set(scale, scale, scale);
        cursorStyling.opacity = 1 - window.scrollY / window.innerHeight;
    });
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
            
            let scale = Math.max(0.01, Math.min(1, 1 - window.scrollY / window.innerHeight));
            model.scale.set(scale, scale, scale);
            cursorStyling.opacity = 1 - window.scrollY / window.innerHeight;

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
    
    renderer.render(scene, camera);

    if (followCursor) {
        let screenMiddle = new THREE.Vector3(container.clientWidth / 2, container.clientHeight / 2, 0);
        let cursorPoint  = new THREE.Vector3(lastCursorPoint.x, lastCursorPoint.y, 0);
        let delta        = cursorPoint.sub(screenMiddle).length();
        let direction    = cursorPoint.normalize();        
        
        currentSpinSpeed = lerp(currentSpinSpeed, 3, spinSpeed);

        lastSpinDirection = direction;
        lastSpinDelta     = delta;

        model.rotateOnWorldAxis(new THREE.Vector3(lastSpinDirection.y, lastSpinDirection.x, 0), degToRad(spinSpeed * lastSpinDelta) * currentSpinSpeed);
    }
    else {
        currentSpinSpeed = lerp(currentSpinSpeed, 0, spinSpeed);

        model.rotateOnWorldAxis(new THREE.Vector3(lastSpinDirection.y, lastSpinDirection.x, 0), degToRad(spinSpeed * lastSpinDelta) * currentSpinSpeed);
    }
}

function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.zoom   = camera.aspect / 1.77 * 0.75;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}