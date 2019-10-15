// Essentials
let camera, scene, renderer, container, directionalLight;
let ship;

let isLoading   = true;
let isAnimating = true;

function degToRad(degrees)
{
    return degrees * (Math.PI / 180);
}

$(document).ready(function() {
    init();
});

$(window).resize(function() {
    onWindowResize();
});

function loadingDone() {
    animate();
}

function init() {
    container = $("#banner-scene")[0];

    canvas = $("#banner-canvas")[0];
    camera = new THREE.PerspectiveCamera(70, container.clientWidth / container.clientHeight, 0.01, 100);
    camera.position.set(5, 3, -2);
    camera.lookAt(0, 0, 0);

    scene = new THREE.Scene();

    directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.lookAt(0, 0, 0);
    scene.add(directionalLight);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

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
        //scene.background = texture;
        scene.background = new THREE.Color(0x080808);
    }

    {
        var loader = new THREE.GLTFLoader();
        loader.load("../meshes/player_ship.glb", function (glb) {
            ship = glb.scene.children[0];
            
            ship.position.set(0, 0, 0);
            ship.scale.set(1, 1, 1);
            ship.rotateY(degToRad(180));

            scene.add(ship);

            loadingDone();
        }, undefined, function (error) {
        	console.error(error);

            let geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
            let material = new THREE.MeshNormalMaterial();
        
            ship = new THREE.Mesh(geometry, material);
            scene.add(ship);

            loadingDone();
        });
    }
}

function animate() {
    requestAnimationFrame(animate);

    renderer.render(scene, camera);
}

function onWindowResize() {
    renderer.setSize(container.clientWidth, container.clientHeight);
}