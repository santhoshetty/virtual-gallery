let scene, camera, renderer, controls;
let paintings = []; // To store painting meshes and their data
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(); // Not directly used for PointerLock, but good for other interactions
let targetFov = 75; // For smooth zoom

// HTML Elements for info panel
const infoPanel = document.getElementById('info-panel');
const paintingTitleEl = document.getElementById('painting-title');
const paintingDescriptionEl = document.getElementById('painting-description');
const closePanelBtn = document.getElementById('close-panel-btn');
const popupPaintingImageEl = document.getElementById('popup-painting-image');

// Painting Data (You will populate this)
const paintingsData = [
    {
        id: 'painting1',
        title: 'Eternal Flame',
        description: 'A portrait of Swami Vivekananda, standing resolute by the sea, draped in saffron robes. This piece captures his unwavering spirit and timeless message of strength, clarity, and awakening—a beacon for seekers across generations.',
        imageSrc: 'assets/paintings/painting1.jpeg',
        width: 3, // world units
        height: 4 // world units
    },
    {
        id: 'painting2',
        title: 'Ocean Dreams',
        description: 'A textured piece capturing the turbulent yet serene nature of the deep ocean.',
        imageSrc: 'assets/paintings/painting2.jpeg',
        width: 4,
        height: 2.5
    },
    {
        id: 'painting3',
        title: 'City Lights',
        description: 'The vibrant energy of a city at night, depicted through bold strokes and colors.',
        imageSrc: 'assets/paintings/painting3.jpeg',
        width: 4,
        height: 2.7
    },
    {
        id: 'painting4',
        title: 'Forest Whisper',
        description: 'A tranquil scene from a mystical forest, inviting contemplation.',
        imageSrc: 'assets/paintings/painting4.jpeg',
        width: 4,
        height: 3.3
    },
    {
        id: 'painting5',
        title: 'Silent Portrait',
        description: 'A study in human emotion, captured in a moment of quiet reflection.',
        imageSrc: 'assets/paintings/painting5.jpeg',
        width: 3,
        height: 4
    },
    {
        id: 'painting6',
        title: 'Silent Portrait',
        description: 'A study in human emotion, captured in a moment of quiet reflection.',
        imageSrc: 'assets/paintings/painting6.jpeg',
        width: 3.4,
        height: 4
    }
    // Add more paintings here
];

// --- Background Music Variables ---
let bgListener, bgSound, bgAudioLoaded = false, bgFadeInterval = null;
const BG_MUSIC_SRC = 'assets/audio/ethereal-bg.mp3';
const BG_MUSIC_TARGET_VOLUME = 0.3;
const BG_MUSIC_FADE_TIME = 1000; // ms

// --- Ambient Audio Variables ---
let ambientSounds = [];
const AMBIENT_AUDIO_PATHS = {
    entrance: 'assets/audio/entrance-ambience.mp3',
    leftWing: 'assets/audio/left-wing-ambience.mp3',
    rightWing: 'assets/audio/right-wing-ambience.mp3',
    backArea: 'assets/audio/back-area-ambience.mp3'
};

// Function to autospace paintings along the back wall
function autospacePaintingsOnBackWall(paintingsData, wallWidth = 40, wallZ = -14.8, y = 2.5) {
    const n = paintingsData.length;
    const spacing = wallWidth / (n + 1);
    for (let i = 0; i < n; i++) {
        paintingsData[i].position = new THREE.Vector3(
            -wallWidth / 2 + spacing * (i + 1),
            y,
            wallZ
        );
        paintingsData[i].rotationY = 0;
    }
}

// New function to place paintings throughout the gallery
function placePaintingsThroughoutGallery(paintingsData) {
    // All paintings at y = 2.5
    const y = 2.5;
    // For left walls, paintings are at wallX + (width/2) + small offset
    // For right walls, paintings are at wallX - (width/2) - small offset
    const smallOffset = 0.01;

    // Painting 1: Left wall of front-left passage
    paintingsData[0].position = new THREE.Vector3(
        -12 + paintingsData[0].width / 2 + smallOffset, y, 2.5
    );
    paintingsData[0].rotationY = Math.PI;

    // Painting 2: Left wall of left passage
    paintingsData[1].position = new THREE.Vector3(
        -21 + paintingsData[1].width / 2 + smallOffset, y, -15
    );
    paintingsData[1].rotationY = Math.PI / 2;

    // Painting 3: Back wall (left side)
    paintingsData[2].position = new THREE.Vector3(
        -8, y, -26.5 + paintingsData[2].width / 2 + smallOffset
    );
    paintingsData[2].rotationY = 0;

    // Painting 4: Back wall (right side)
    paintingsData[3].position = new THREE.Vector3(
        8, y, -26.5 + paintingsData[3].width / 2 + smallOffset
    );
    paintingsData[3].rotationY = 0;

    // Painting 5: Left wall of right passage
    paintingsData[4].position = new THREE.Vector3(
        21 - paintingsData[4].width / 2 - smallOffset, y, -15
    );
    paintingsData[4].rotationY = -Math.PI / 2;

    // Painting 6: Left wall of right-front passage
    if (paintingsData.length > 5) {
        paintingsData[5].position = new THREE.Vector3(
            12 - paintingsData[5].width / 2 - smallOffset, y, 2.5
        );
        paintingsData[5].rotationY = -Math.PI;
    }
}

init();
animate();

function init() {
    // 1. Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Light sky blue background
    scene.fog = new THREE.Fog(0x87ceeb, 0, 75); // Fog for depth effect

    // --- Modern Couch (replaces red debug cube) ---
    // Couch base
    const couchBaseGeometry = new THREE.BoxGeometry(3, 0.5, 1.2);
    const couchBaseMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 }); // dark gray
    const couchBase = new THREE.Mesh(couchBaseGeometry, couchBaseMaterial);
    couchBase.position.set(0, 0.5, 0);
    couchBase.castShadow = true;
    couchBase.receiveShadow = true;
    scene.add(couchBase);

    // 2. Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.8, 8); // Initial camera position (at entrance)
    camera.lookAt(0, 2, 2.5); // Look at the welcome plaque
    targetFov = camera.fov; // Set initial targetFov

    // --- Background Music Setup ---
    bgListener = new THREE.AudioListener();
    camera.add(bgListener);
    bgSound = new THREE.Audio(bgListener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(BG_MUSIC_SRC, function(buffer) {
        bgSound.setBuffer(buffer);
        bgSound.setLoop(true);
        bgSound.setVolume(0); // Start silent, fade in
        bgAudioLoaded = true;
    });
    // Play on first user click
    function playBGSoundOnce() {
        if (bgAudioLoaded && !bgSound.isPlaying) {
            bgSound.play();
            fadeBGMusic(true); // Fade in
        }
        document.body.removeEventListener('click', playBGSoundOnce);
    }
    document.body.addEventListener('click', playBGSoundOnce);
    
    // Setup ambient audio cues for different areas
    setupAmbientAudio();

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // Enable shadows
    document.body.appendChild(renderer.domElement);

    hex_light = 0x0e182a
    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(hex_light, 0.6); // Soft white light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(hex_light, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // 5. Gallery Room (complex layout with multiple areas)
    createGalleryRoom();

    // 6. Place paintings throughout the gallery
    placePaintingsThroughoutGallery(paintingsData);
    loadPaintings();

    // 7. Controls (PointerLockControls for WASD + Mouse)
    setupControls();

    // Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    closePanelBtn.addEventListener('click', closeInfoAndPopup);
    popupPaintingImageEl.addEventListener('click', closeInfoAndPopup);

    // Add zoom in/out on scroll (mouse wheel)
    window.addEventListener('wheel', function(event) {
        if (
            controls && controls.isLocked &&
            infoPanel.style.display === 'none' &&
            popupPaintingImageEl.style.display === 'none'
        ) {
            const minFov = 30;
            const maxFov = 100;
            targetFov += event.deltaY * 0.03; // Smoother, smaller steps
            targetFov = Math.max(minFov, Math.min(maxFov, targetFov));
            event.preventDefault();
        }
    }, { passive: false });

    // Add click event for painting popup
    window.addEventListener('click', onPaintingClick, false);
}

function createGalleryRoom() {
    // Wall materials
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 }); // Black walls
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide }); // Grey floor
    const wallHeight = 6;
    const wallThickness = 0.2;
    
    // Main Floor (slightly larger area)
    const floorGeometry = new THREE.PlaneGeometry(70, 70);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    floor.receiveShadow = true;
    scene.add(floor);

    // ----- ENTRANCE AREA WITH STEPS AND WELCOME PLAQUE -----
    // Create entrance steps (5 steps leading up)
    for (let i = 0; i < 5; i++) {
        const stepGeometry = new THREE.BoxGeometry(6, 0.2, 0.5);
        const stepMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const step = new THREE.Mesh(stepGeometry, stepMaterial);
        step.position.set(0, 0.1 + (i * 0.2), 5 - (i * 0.5));
        step.receiveShadow = true;
        step.castShadow = true;
        scene.add(step);
    }
    
    // Welcome Plaque
    const plaqueGeometry = new THREE.PlaneGeometry(4, 1);
    const plaqueTexture = createPlaqueTexture("Welcome to Mom's \n Art Gallery");
    const plaqueMaterial = new THREE.MeshBasicMaterial({
        map: plaqueTexture
    });
    const plaque = new THREE.Mesh(plaqueGeometry, plaqueMaterial);
    plaque.position.set(0, 4, 2.5); // Positioned at the top of the steps
    plaque.receiveShadow = true;
    plaque.castShadow = true;
    scene.add(plaque);
    
    // ----- MAIN ENTRANCE HALL -----
    // Main entrance walls (wider opening)
    const entranceWallLeft = new THREE.BoxGeometry(15, wallHeight, wallThickness);
    const leftWallEntrance = new THREE.Mesh(entranceWallLeft, wallMaterial);
    leftWallEntrance.position.set(-10.5, wallHeight / 2, 3);
    leftWallEntrance.receiveShadow = true;
    leftWallEntrance.castShadow = true;
    scene.add(leftWallEntrance);
    
    const entranceWallRight = new THREE.BoxGeometry(15, wallHeight, wallThickness);
    const rightWallEntrance = new THREE.Mesh(entranceWallRight, wallMaterial);
    rightWallEntrance.position.set(10.5, wallHeight / 2, 3);
    rightWallEntrance.receiveShadow = true;
    rightWallEntrance.castShadow = true;
    scene.add(rightWallEntrance);
    
    // ----- CENTRAL AREA -----
    // Central back wall with openings for corridors
    const centralBackWallLeft = new THREE.BoxGeometry(8, wallHeight, wallThickness);
    const backWallLeft = new THREE.Mesh(centralBackWallLeft, wallMaterial);
    backWallLeft.position.set(-6, wallHeight / 2, -5);
    backWallLeft.receiveShadow = true;
    backWallLeft.castShadow = true;
    scene.add(backWallLeft);
    
    const centralBackWallRight = new THREE.BoxGeometry(8, wallHeight, wallThickness);
    const backWallRight = new THREE.Mesh(centralBackWallRight, wallMaterial);
    backWallRight.position.set(6, wallHeight / 2, -5);
    backWallRight.receiveShadow = true;
    backWallRight.castShadow = true;
    scene.add(backWallRight);
    
    // ----- LEFT WING -----
    // Left corridor wall (outer wall only)
    const leftPassageWallBack = new THREE.BoxGeometry(0.2, wallHeight, 28);
    const leftPassageBack = new THREE.Mesh(leftPassageWallBack, wallMaterial);
    leftPassageBack.position.set(-20, wallHeight / 2, -11);
    leftPassageBack.receiveShadow = true;
    leftPassageBack.castShadow = true;
    scene.add(leftPassageBack);
    
    // ----- RIGHT WING -----
    // Right corridor wall (outer wall only)
    const rightPassageWallBack = new THREE.BoxGeometry(0.2, wallHeight, 28);
    const rightPassageBack = new THREE.Mesh(rightPassageWallBack, wallMaterial);
    rightPassageBack.position.set(20, wallHeight / 2, -11);
    rightPassageBack.receiveShadow = true;
    rightPassageBack.castShadow = true;
    scene.add(rightPassageBack);
    
    // ----- BACK AREA -----
    // Continuous back wall spanning from left to right wall
    const backDisplayWall = new THREE.BoxGeometry(40, wallHeight, 0.2);
    const backDisplay = new THREE.Mesh(backDisplayWall, wallMaterial);
    backDisplay.position.set(0, wallHeight / 2, -25);
    backDisplay.receiveShadow = true;
    backDisplay.castShadow = true;
    scene.add(backDisplay);
    
    // ----- INNER WALLS -----
    // Left inner wall (10 units inward from left outer wall)
    const leftInnerWall = new THREE.BoxGeometry(0.2, wallHeight, 15);
    const leftInner = new THREE.Mesh(leftInnerWall, wallMaterial);
    leftInner.position.set(-12, wallHeight / 2, -15);
    leftInner.receiveShadow = true;
    leftInner.castShadow = true;
    scene.add(leftInner);
    
    // Right inner wall (10 units inward from right outer wall)
    const rightInnerWall = new THREE.BoxGeometry(0.2, wallHeight, 10);
    const rightInner = new THREE.Mesh(rightInnerWall, wallMaterial);
    rightInner.position.set(12, wallHeight / 2, -15);
    rightInner.receiveShadow = true;
    rightInner.castShadow = true;
    scene.add(rightInner);
    
    // Back inner wall (10 units inward from back outer wall)
    const backInnerWall = new THREE.BoxGeometry(15, wallHeight, 0.2);
    const backInner = new THREE.Mesh(backInnerWall, wallMaterial);
    backInner.position.set(0, wallHeight / 2, -20);
    backInner.receiveShadow = true;
    backInner.castShadow = true;
    scene.add(backInner);
    
    // ----- CEILING -----
    const ceilingGeometry = new THREE.PlaneGeometry(50, 50);
    const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, side: THREE.DoubleSide });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.y = wallHeight;
    ceiling.rotation.x = Math.PI / 2;
    ceiling.receiveShadow = true;
    scene.add(ceiling);
    
    // Add area lights
    addAreaLighting();
}

// Helper function to create plaque texture
function createPlaqueTexture(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    
    // Background
    context.fillStyle = '#FFFFFF'; // White background
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Text settings
    context.fillStyle = '#000000'; // Black text
    context.font = "bold 44px 'Playwrite Magyarország', Calibri, sans-serif";
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Draw two lines, centered
    const line1 = "Welcome to Mom's";
    const line2 = "Art Gallery";
    context.fillText(line1, canvas.width / 2, canvas.height / 2 - 28);
    context.fillText(line2, canvas.width / 2, canvas.height / 2 + 28);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

function loadPaintings() {
    const textureLoader = new THREE.TextureLoader();
    paintingsData.forEach(data => {
        const paintingTexture = textureLoader.load(data.imageSrc);
        const paintingMaterial = new THREE.MeshBasicMaterial({ map: paintingTexture });
        const paintingGeometry = new THREE.PlaneGeometry(data.width, data.height);

        const paintingMesh = new THREE.Mesh(paintingGeometry, paintingMaterial);
        paintingMesh.position.copy(data.position); // Use position from data
        paintingMesh.rotation.y = data.rotationY; // Use rotation from data

        paintingMesh.userData = { id: data.id, title: data.title, description: data.description, imageSrc: data.imageSrc }; // Store metadata
        paintingMesh.castShadow = true; // Paintings themselves don't usually cast strong shadows but can receive them if material supports it

        scene.add(paintingMesh);
        paintings.push(paintingMesh); // Add to array for raycasting
        console.log('Added painting:', data.imageSrc, paintingMesh.position);

        // --- Add bulb and spotlight above each painting ---
        // Bulb position: above the painting center
        const bulbY = paintingMesh.position.y + data.height / 2 + 0.3;
        const bulbPos = new THREE.Vector3(
            paintingMesh.position.x,
            bulbY,
            paintingMesh.position.z
        );
        // Bulb mesh (small sphere)
        const bulbGeometry = new THREE.SphereGeometry(0.12, 16, 16);
        const bulbMaterial = new THREE.MeshStandardMaterial({
            color: 0xfff2cc,
            emissive: 0xffe4a0,
            emissiveIntensity: 0.7,
            metalness: 0.2,
            roughness: 0.5
        });
        const bulbMesh = new THREE.Mesh(bulbGeometry, bulbMaterial);
        bulbMesh.position.copy(bulbPos);
        bulbMesh.castShadow = false;
        bulbMesh.receiveShadow = false;
        // scene.add(bulbMesh);

        // SpotLight
        const spotColor = 0xfff2cc; // warm white
        const spotLight = new THREE.SpotLight(spotColor, 1.2, 5, Math.PI / 4, 0.4, 1.2);
        spotLight.position.copy(bulbPos);
        // Aim at painting center
        spotLight.target.position.copy(paintingMesh.position);
        scene.add(spotLight);
        scene.add(spotLight.target);
        spotLight.castShadow = true;
        spotLight.shadow.mapSize.width = 512;
        spotLight.shadow.mapSize.height = 512;
        spotLight.shadow.bias = -0.0005;
        // Optionally, make the bulb mesh slightly brighter if you want more glow
    });
}

function setupControls() {
    controls = new THREE.PointerLockControls(camera, document.body);

    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    instructions.addEventListener('click', function () {
        controls.lock();
    });

    controls.addEventListener('lock', function () {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
        infoPanel.style.display = 'none'; // Hide panel when controls are locked
        popupPaintingImageEl.style.display = 'none';
    });

    controls.addEventListener('unlock', function () {
        blocker.style.display = 'block';
        instructions.style.display = '';
    });

    scene.add(controls.getObject()); // Add the camera to the scene via controls

    // Movement control variables
    const moveSpeed = 0.15;
    let moveForward = false;
    let moveBackward = false;
    let moveLeft = false;
    let moveRight = false;
    
    // Set up movement key events
    const onKeyDown = function (event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                moveBackward = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                moveRight = true;
                break;
        }
    };
    
    const onKeyUp = function (event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                moveBackward = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                moveRight = false;
                break;
        }
    };
    
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    // Animation loop for continuous movement
    function moveCamera() {
        if (controls.isLocked) {
            if (moveForward) controls.moveForward(moveSpeed);
            if (moveBackward) controls.moveForward(-moveSpeed);
            if (moveLeft) controls.moveRight(-moveSpeed);
            if (moveRight) controls.moveRight(moveSpeed);
        }
        requestAnimationFrame(moveCamera);
    }
    
    // Start the movement loop
    moveCamera();
}


function checkPaintingInteraction() {
    if (!controls.isLocked) return;
    raycaster.setFromCamera({ x: 0, y: 0 }, camera);
    const intersects = raycaster.intersectObjects(paintings);
    if (intersects.length > 0) {
        const intersectedPainting = intersects[0].object;
        const distance = intersects[0].distance;
        if (distance < 10) {
            paintingTitleEl.textContent = intersectedPainting.userData.title;
            paintingDescriptionEl.textContent = intersectedPainting.userData.description;
            infoPanel.style.display = 'block';
            popupPaintingImageEl.src = intersectedPainting.userData.imageSrc;
            // --- Fade out music when info panel opens ---
            fadeBGMusic(false);
            if (!document.body._popupClickListener) {
                document.body._popupClickListener = function(event) {
                    if (infoPanel.style.display === 'block' && !infoPanel.contains(event.target)) {
                        if (controls.isLocked) {
                            popupPaintingImageEl.style.display = 'block';
                            controls.unlock();
                            document.body.removeEventListener('click', document.body._popupClickListener);
                            document.body._popupClickListener = null;
                        }
                    }
                };
                document.body.addEventListener('click', document.body._popupClickListener);
            }
        } else {
            hideInfoPanelIfSafe();
        }
        // Store for click event
        window._centeredPainting = (distance < 10) ? intersectedPainting : null;
    } else {
        hideInfoPanelIfSafe();
        window._centeredPainting = null;
    }
}

function hideInfoPanelIfSafe() {
    if (popupPaintingImageEl.style.display === 'none') {
        infoPanel.style.display = 'none';
        // --- Fade in music when info panel closes ---
        fadeBGMusic(true);
        if (document.body._popupClickListener) {
            document.body.removeEventListener('click', document.body._popupClickListener);
            document.body._popupClickListener = null;
        }
    }
}

function closeInfoAndPopup() {
    infoPanel.style.display = 'none';
    popupPaintingImageEl.style.display = 'none';
    // --- Fade in music when info panel closes ---
    fadeBGMusic(true);
    if (controls && !controls.isLocked) controls.lock();
    if (document.body._popupClickListener) {
        document.body.removeEventListener('click', document.body._popupClickListener);
        document.body._popupClickListener = null;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    // Smoothly interpolate camera FOV for zoom
    if (Math.abs(camera.fov - targetFov) > 0.1) {
        camera.fov += (targetFov - camera.fov) * 0.15;
        camera.updateProjectionMatrix();
    }
    if (controls.isLocked === true) {
        // You can add movement updates here if PointerLockControls doesn't handle it internally
        // Or if you add click-to-move:
        // if (targetPosition) camera.position.lerp(targetPosition, 0.1);
    }
    checkPaintingInteraction(); // Check for painting interaction every frame
    renderer.render(scene, camera);
}

// --- Initial Click to start for audio context (if you add audio later) ---
// document.body.addEventListener('click', () => {
//     if (audioContext && audioContext.state === 'suspended') {
//         audioContext.resume();
//     }
// }, { once: true });

function onPaintingClick(event) {
    // Only trigger if controls are locked and a painting is centered and close
    if (controls && controls.isLocked && window._centeredPainting) {
        popupPaintingImageEl.src = window._centeredPainting.userData.imageSrc;
        popupPaintingImageEl.style.display = 'block';
        infoPanel.style.display = 'none';
        controls.unlock();
    }
}

// --- Background Music Fade Helpers ---
function fadeBGMusic(fadeIn) {
    if (!bgSound) return;
    if (bgFadeInterval) clearInterval(bgFadeInterval);
    const startVol = bgSound.getVolume();
    const endVol = fadeIn ? BG_MUSIC_TARGET_VOLUME : 0;
    const steps = 30;
    let step = 0;
    bgFadeInterval = setInterval(() => {
        step++;
        const t = step / steps;
        const newVol = startVol + (endVol - startVol) * t;
        bgSound.setVolume(Math.max(0, Math.min(BG_MUSIC_TARGET_VOLUME, newVol)));
        if (step >= steps) {
            bgSound.setVolume(endVol);
            clearInterval(bgFadeInterval);
            bgFadeInterval = null;
        }
    }, BG_MUSIC_FADE_TIME / steps);
}

// Function to add area-specific lighting
function addAreaLighting() {
    // Entrance area light
    const entranceLight = new THREE.SpotLight(0xffffff, 1);
    entranceLight.position.set(0, 4, 2);
    entranceLight.angle = Math.PI / 4;
    entranceLight.penumbra = 0.2;
    entranceLight.castShadow = true;
    entranceLight.shadow.mapSize.width = 512;
    entranceLight.shadow.mapSize.height = 512;
    scene.add(entranceLight);
    
    // Left wing lights
    const leftWingLight1 = new THREE.SpotLight(0xffffff, 1);
    leftWingLight1.position.set(-8, 4, -6);
    leftWingLight1.angle = Math.PI / 6;
    leftWingLight1.penumbra = 0.2;
    leftWingLight1.castShadow = true;
    leftWingLight1.shadow.mapSize.width = 512;
    leftWingLight1.shadow.mapSize.height = 512;
    scene.add(leftWingLight1);
    
    const leftWingLight2 = new THREE.SpotLight(0xffffff, 1);
    leftWingLight2.position.set(-15, 4, -10);
    leftWingLight2.angle = Math.PI / 6;
    leftWingLight2.penumbra = 0.2;
    leftWingLight2.castShadow = true;
    leftWingLight2.shadow.mapSize.width = 512;
    leftWingLight2.shadow.mapSize.height = 512;
    scene.add(leftWingLight2);
    
    // Right wing lights
    const rightWingLight1 = new THREE.SpotLight(0xffffff, 1);
    rightWingLight1.position.set(8, 4, -6);
    rightWingLight1.angle = Math.PI / 6;
    rightWingLight1.penumbra = 0.2;
    rightWingLight1.castShadow = true;
    rightWingLight1.shadow.mapSize.width = 512;
    rightWingLight1.shadow.mapSize.height = 512;
    scene.add(rightWingLight1);
    
    const rightWingLight2 = new THREE.SpotLight(0xffffff, 1);
    rightWingLight2.position.set(15, 4, -10);
    rightWingLight2.angle = Math.PI / 6;
    rightWingLight2.penumbra = 0.2;
    rightWingLight2.castShadow = true;
    rightWingLight2.shadow.mapSize.width = 512;
    rightWingLight2.shadow.mapSize.height = 512;
    scene.add(rightWingLight2);
    
    // Back area light
    const backAreaLight = new THREE.SpotLight(0xffffff, 1);
    backAreaLight.position.set(0, 4, -16);
    backAreaLight.angle = Math.PI / 5;
    backAreaLight.penumbra = 0.2;
    backAreaLight.castShadow = true;
    backAreaLight.shadow.mapSize.width = 512;
    backAreaLight.shadow.mapSize.height = 512;
    scene.add(backAreaLight);
}

// Function to set up ambient audio cues throughout the gallery
function setupAmbientAudio() {
    if (!bgListener) return; // Make sure audio listener is ready
    
    const audioLoader = new THREE.AudioLoader();
    
    // Entrance ambient sound
    const entranceSound = new THREE.PositionalAudio(bgListener);
    audioLoader.load(AMBIENT_AUDIO_PATHS.entrance || BG_MUSIC_SRC, function(buffer) {
        entranceSound.setBuffer(buffer);
        entranceSound.setRefDistance(5);
        entranceSound.setLoop(true);
        entranceSound.setVolume(0.2);
        entranceSound.position.set(0, 2, 2);
    });
    scene.add(entranceSound);
    ambientSounds.push(entranceSound);
    
    // Left wing ambient sound
    const leftWingSound = new THREE.PositionalAudio(bgListener);
    audioLoader.load(AMBIENT_AUDIO_PATHS.leftWing || BG_MUSIC_SRC, function(buffer) {
        leftWingSound.setBuffer(buffer);
        leftWingSound.setRefDistance(5);
        leftWingSound.setLoop(true);
        leftWingSound.setVolume(0.2);
        leftWingSound.position.set(-10, 2, -10);
    });
    scene.add(leftWingSound);
    ambientSounds.push(leftWingSound);
    
    // Right wing ambient sound
    const rightWingSound = new THREE.PositionalAudio(bgListener);
    audioLoader.load(AMBIENT_AUDIO_PATHS.rightWing || BG_MUSIC_SRC, function(buffer) {
        rightWingSound.setBuffer(buffer);
        rightWingSound.setRefDistance(5);
        rightWingSound.setLoop(true);
        rightWingSound.setVolume(0.2);
        rightWingSound.position.set(10, 2, -10);
    });
    scene.add(rightWingSound);
    ambientSounds.push(rightWingSound);
    
    // Back area ambient sound
    const backAreaSound = new THREE.PositionalAudio(bgListener);
    audioLoader.load(AMBIENT_AUDIO_PATHS.backArea || BG_MUSIC_SRC, function(buffer) {
        backAreaSound.setBuffer(buffer);
        backAreaSound.setRefDistance(5);
        backAreaSound.setLoop(true);
        backAreaSound.setVolume(0.2);
        backAreaSound.position.set(0, 2, -18);
    });
    scene.add(backAreaSound);
    ambientSounds.push(backAreaSound);
    
    // Play on first user click
    function playAmbientSoundsOnce() {
        ambientSounds.forEach(sound => {
            if (sound.buffer && !sound.isPlaying) {
                sound.play();
            }
        });
        document.body.removeEventListener('click', playAmbientSoundsOnce);
    }
    document.body.addEventListener('click', playAmbientSoundsOnce);
}