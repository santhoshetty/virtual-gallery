// Core Gallery Module - Shared functionality for both mobile and desktop
class CoreGallery {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.paintings = [];
        this.raycaster = new THREE.Raycaster();
        this.targetFov = 75;
        
        // Painting data
        this.paintingsData = [
            {
                id: 'painting1',
                title: 'Eternal Flame',
                description: 'A portrait of Swami Vivekananda, standing resolute by the sea, draped in saffron robes. This piece captures his unwavering spirit and timeless message of strength, clarity, and awakening—a beacon for seekers across generations.',
                imageSrc: 'assets/paintings/painting1.jpeg',
                width: 3,
                height: 4
            },
            {
                id: 'painting2',
                title: 'Forest Whispers',
                description: 'A romantic ode painted in earthy tones, this artwork captures an intimate moment beneath a tree\'s quiet canopy. Infused with elegance and mystique, it evokes the timeless rhythm of love and nature entwined in harmony.',
                imageSrc: 'assets/paintings/painting2.jpeg',
                width: 4,
                height: 2.5
            },
            {
                id: 'painting3',
                title: 'Silent Anchorage',
                description: 'Bathed in dusky hues, this evocative seascape captures a lone boat moored at twilight. With its delicate interplay of light and shadow, the painting speaks of stillness, journeys paused, and the quiet poetry of waiting.',
                imageSrc: 'assets/paintings/painting3.jpeg',
                width: 4,
                height: 2.7
            },
            {
                id: 'painting4',
                title: 'Guardians of the Frontier',
                description: 'This bold and commanding piece captures three mounted warriors in mid-watch, eyes cast over a distant horizon. With detailed armor, proud steeds, and an air of unwavering vigilance, the painting pays tribute to the strength, unity, and enduring spirit of those who stand guard at the edges of history.',
                imageSrc: 'assets/paintings/painting4.jpeg',
                width: 4,
                height: 3.3
            },
            {
                id: 'painting5',
                title: 'Raga of the Flame',
                description: 'Immersed in sacred rhythm, this evocative painting portrays a woman lost in the spiritual ecstasy of her music. Surrounded by the warm glow of oil lamps and adorned in traditional attire, she becomes one with the melody—an embodiment of devotion, passion, and inner fire.',
                imageSrc: 'assets/paintings/painting5.jpeg',
                width: 3,
                height: 4
            },
            {
                id: 'painting6',
                title: 'The Silent Buddha',
                description: 'A tranquil depiction of the Buddha beneath a radiant full moon, this piece radiates peace and reflection. Surrounded by still waters and silent skies, it invites the viewer into a meditative moment—where nature, spirit, and silence become one.',
                imageSrc: 'assets/paintings/painting6.jpeg',
                width: 3.4,
                height: 4
            }
        ];
    }

    initScene(isMobile = false) {
        console.log('Initializing 3D scene for:', isMobile ? 'Mobile' : 'Desktop');
        
        try {
            // 1. Scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x87ceeb);
            this.scene.fog = new THREE.Fog(0x87ceeb, 0, 75);

            // 2. Camera
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.camera.position.set(0, 1.8, 8);
            this.camera.lookAt(0, 2, 2.5);
            this.targetFov = this.camera.fov;

            // 3. Renderer with mobile optimizations
            this.renderer = new THREE.WebGLRenderer({
                antialias: !isMobile,
                powerPreference: isMobile ? 'low-power' : 'high-performance'
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = !isMobile;
            if (!isMobile) {
                this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            }
            document.body.appendChild(this.renderer.domElement);

            // 4. Lighting
            this.setupLighting(isMobile);

            // 5. Gallery Room
            this.createGalleryRoom();

            // 6. Paintings
            this.placePaintings();
            this.loadPaintings(isMobile);

            console.log('3D scene initialized successfully');
            return true;

        } catch (error) {
            console.error('Error initializing 3D scene:', error);
            return false;
        }
    }

    setupLighting(isMobile) {
        const hex_light = 0x0e182a;
        
        // Ambient light
        const ambientLight = new THREE.AmbientLight(hex_light, 0.6);
        this.scene.add(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(hex_light, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = !isMobile;
        this.scene.add(directionalLight);
    }

    createGalleryRoom() {
        // Wall materials
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide });
        const wallHeight = 6;
        const wallThickness = 0.2;
        
        // Main Floor
        const floorGeometry = new THREE.PlaneGeometry(70, 70);
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // --- Modern Couch (replaces red debug cube) ---
        // Couch base
        const couchBaseGeometry = new THREE.BoxGeometry(3, 0.5, 1.2);
        const couchBaseMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 }); // dark gray
        const couchBase = new THREE.Mesh(couchBaseGeometry, couchBaseMaterial);
        couchBase.position.set(0, 0.5, 0);
        couchBase.castShadow = true;
        couchBase.receiveShadow = true;
        this.scene.add(couchBase);

        // Create entrance steps
        for (let i = 0; i < 5; i++) {
            const stepGeometry = new THREE.BoxGeometry(6, 0.2, 0.5);
            const stepMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
            const step = new THREE.Mesh(stepGeometry, stepMaterial);
            step.position.set(0, 0.1 + (i * 0.2), 5 - (i * 0.5));
            step.receiveShadow = true;
            step.castShadow = true;
            this.scene.add(step);
        }
        
        // Welcome Plaque
        const plaqueGeometry = new THREE.PlaneGeometry(4, 1);
        const plaqueTexture = this.createPlaqueTexture("Welcome to Mom's \n Art Gallery");
        const plaqueMaterial = new THREE.MeshBasicMaterial({ map: plaqueTexture });
        const plaque = new THREE.Mesh(plaqueGeometry, plaqueMaterial);
        plaque.position.set(0, 4, 2.5);
        this.scene.add(plaque);
        
        // Walls (simplified for better mobile performance)
        this.createWalls(wallMaterial, wallHeight, wallThickness);
        
        // Ceiling
        const ceilingGeometry = new THREE.PlaneGeometry(50, 50);
        const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, side: THREE.DoubleSide });
        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.position.y = wallHeight;
        ceiling.rotation.x = Math.PI / 2;
        ceiling.receiveShadow = true;
        this.scene.add(ceiling);
        
        // Add area lights
        this.addAreaLighting();
    }

    addAreaLighting() {
        // Entrance area light
        const entranceLight = new THREE.SpotLight(0xffffff, 1);
        entranceLight.position.set(0, 4, 2);
        entranceLight.angle = Math.PI / 4;
        entranceLight.penumbra = 0.2;
        entranceLight.castShadow = true;
        entranceLight.shadow.mapSize.width = 512;
        entranceLight.shadow.mapSize.height = 512;
        this.scene.add(entranceLight);
        
        // Left wing lights
        const leftWingLight1 = new THREE.SpotLight(0xffffff, 1);
        leftWingLight1.position.set(-8, 4, -6);
        leftWingLight1.angle = Math.PI / 6;
        leftWingLight1.penumbra = 0.2;
        leftWingLight1.castShadow = true;
        leftWingLight1.shadow.mapSize.width = 512;
        leftWingLight1.shadow.mapSize.height = 512;
        this.scene.add(leftWingLight1);
        
        const leftWingLight2 = new THREE.SpotLight(0xffffff, 1);
        leftWingLight2.position.set(-15, 4, -10);
        leftWingLight2.angle = Math.PI / 6;
        leftWingLight2.penumbra = 0.2;
        leftWingLight2.castShadow = true;
        leftWingLight2.shadow.mapSize.width = 512;
        leftWingLight2.shadow.mapSize.height = 512;
        this.scene.add(leftWingLight2);
        
        // Right wing lights
        const rightWingLight1 = new THREE.SpotLight(0xffffff, 1);
        rightWingLight1.position.set(8, 4, -6);
        rightWingLight1.angle = Math.PI / 6;
        rightWingLight1.penumbra = 0.2;
        rightWingLight1.castShadow = true;
        rightWingLight1.shadow.mapSize.width = 512;
        rightWingLight1.shadow.mapSize.height = 512;
        this.scene.add(rightWingLight1);
        
        const rightWingLight2 = new THREE.SpotLight(0xffffff, 1);
        rightWingLight2.position.set(15, 4, -10);
        rightWingLight2.angle = Math.PI / 6;
        rightWingLight2.penumbra = 0.2;
        rightWingLight2.castShadow = true;
        rightWingLight2.shadow.mapSize.width = 512;
        rightWingLight2.shadow.mapSize.height = 512;
        this.scene.add(rightWingLight2);
        
        // Back area light
        const backAreaLight = new THREE.SpotLight(0xffffff, 1);
        backAreaLight.position.set(0, 4, -16);
        backAreaLight.angle = Math.PI / 5;
        backAreaLight.penumbra = 0.2;
        backAreaLight.castShadow = true;
        backAreaLight.shadow.mapSize.width = 512;
        backAreaLight.shadow.mapSize.height = 512;
        this.scene.add(backAreaLight);
    }

    createWalls(wallMaterial, wallHeight, wallThickness) {
        // ----- MAIN ENTRANCE HALL -----
        // Main entrance walls (wider opening)
        const entranceWallLeft = new THREE.BoxGeometry(15, wallHeight, wallThickness);
        const leftWallEntrance = new THREE.Mesh(entranceWallLeft, wallMaterial);
        leftWallEntrance.position.set(-10.5, wallHeight / 2, 3);
        leftWallEntrance.receiveShadow = true;
        leftWallEntrance.castShadow = true;
        this.scene.add(leftWallEntrance);
        
        const entranceWallRight = new THREE.BoxGeometry(15, wallHeight, wallThickness);
        const rightWallEntrance = new THREE.Mesh(entranceWallRight, wallMaterial);
        rightWallEntrance.position.set(10.5, wallHeight / 2, 3);
        rightWallEntrance.receiveShadow = true;
        rightWallEntrance.castShadow = true;
        this.scene.add(rightWallEntrance);
        
        // ----- CENTRAL AREA -----
        // Central back wall with openings for corridors
        const centralBackWallLeft = new THREE.BoxGeometry(8, wallHeight, wallThickness);
        const backWallLeft = new THREE.Mesh(centralBackWallLeft, wallMaterial);
        backWallLeft.position.set(-6, wallHeight / 2, -5);
        backWallLeft.receiveShadow = true;
        backWallLeft.castShadow = true;
        this.scene.add(backWallLeft);
        
        const centralBackWallRight = new THREE.BoxGeometry(8, wallHeight, wallThickness);
        const backWallRight = new THREE.Mesh(centralBackWallRight, wallMaterial);
        backWallRight.position.set(6, wallHeight / 2, -5);
        backWallRight.receiveShadow = true;
        backWallRight.castShadow = true;
        this.scene.add(backWallRight);
        
        // ----- LEFT WING -----
        // Left corridor wall (outer wall only)
        const leftPassageWallBack = new THREE.BoxGeometry(0.2, wallHeight, 28);
        const leftPassageBack = new THREE.Mesh(leftPassageWallBack, wallMaterial);
        leftPassageBack.position.set(-20, wallHeight / 2, -11);
        leftPassageBack.receiveShadow = true;
        leftPassageBack.castShadow = true;
        this.scene.add(leftPassageBack);
        
        // ----- RIGHT WING -----
        // Right corridor wall (outer wall only)
        const rightPassageWallBack = new THREE.BoxGeometry(0.2, wallHeight, 28);
        const rightPassageBack = new THREE.Mesh(rightPassageWallBack, wallMaterial);
        rightPassageBack.position.set(20, wallHeight / 2, -11);
        rightPassageBack.receiveShadow = true;
        rightPassageBack.castShadow = true;
        this.scene.add(rightPassageBack);
        
        // ----- BACK AREA -----
        // Continuous back wall spanning from left to right wall
        const backDisplayWall = new THREE.BoxGeometry(40, wallHeight, 0.2);
        const backDisplay = new THREE.Mesh(backDisplayWall, wallMaterial);
        backDisplay.position.set(0, wallHeight / 2, -25);
        backDisplay.receiveShadow = true;
        backDisplay.castShadow = true;
        this.scene.add(backDisplay);
        
        // ----- INNER WALLS -----
        // Left inner wall (10 units inward from left outer wall)
        const leftInnerWall = new THREE.BoxGeometry(0.2, wallHeight, 15);
        const leftInner = new THREE.Mesh(leftInnerWall, wallMaterial);
        leftInner.position.set(-12, wallHeight / 2, -15);
        leftInner.receiveShadow = true;
        leftInner.castShadow = true;
        this.scene.add(leftInner);
        
        // Right inner wall (10 units inward from right outer wall)
        const rightInnerWall = new THREE.BoxGeometry(0.2, wallHeight, 10);
        const rightInner = new THREE.Mesh(rightInnerWall, wallMaterial);
        rightInner.position.set(12, wallHeight / 2, -15);
        rightInner.receiveShadow = true;
        rightInner.castShadow = true;
        this.scene.add(rightInner);
        
        // Back inner wall (10 units inward from back outer wall)
        const backInnerWall = new THREE.BoxGeometry(15, wallHeight, 0.2);
        const backInner = new THREE.Mesh(backInnerWall, wallMaterial);
        backInner.position.set(0, wallHeight / 2, -20);
        backInner.receiveShadow = true;
        backInner.castShadow = true;
        this.scene.add(backInner);
    }

    createPlaqueTexture(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = '#000000';
        context.font = "bold 44px 'Playwrite Magyarország', Calibri, sans-serif";
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        const line1 = "Welcome to Mom's";
        const line2 = "Art Gallery";
        context.fillText(line1, canvas.width / 2, canvas.height / 2 - 28);
        context.fillText(line2, canvas.width / 2, canvas.height / 2 + 28);
        
        return new THREE.CanvasTexture(canvas);
    }

    placePaintings() {
        const y = 2.5;
        const smallOffset = 0.01;

        // Painting positions
        this.paintingsData[0].position = new THREE.Vector3(-12 + this.paintingsData[0].width / 2 + smallOffset, y, 2.5);
        this.paintingsData[0].rotationY = Math.PI;

        this.paintingsData[1].position = new THREE.Vector3(-21 + this.paintingsData[1].width / 2 + smallOffset, y, -15);
        this.paintingsData[1].rotationY = Math.PI / 2;

        this.paintingsData[2].position = new THREE.Vector3(-8, y, -26.5 + this.paintingsData[2].width / 2 + smallOffset);
        this.paintingsData[2].rotationY = 0;

        this.paintingsData[3].position = new THREE.Vector3(8, y, -26.5 + this.paintingsData[3].width / 2 + smallOffset);
        this.paintingsData[3].rotationY = 0;

        this.paintingsData[4].position = new THREE.Vector3(21 - this.paintingsData[4].width / 2 - smallOffset, y, -15);
        this.paintingsData[4].rotationY = -Math.PI / 2;

        if (this.paintingsData.length > 5) {
            this.paintingsData[5].position = new THREE.Vector3(12 - this.paintingsData[5].width / 2 - smallOffset, y, 2.5);
            this.paintingsData[5].rotationY = -Math.PI;
        }
    }

    loadPaintings(isMobile) {
        const textureLoader = new THREE.TextureLoader();
        
        this.paintingsData.forEach((data, index) => {
            textureLoader.load(
                data.imageSrc,
                (texture) => {
                    const paintingMaterial = new THREE.MeshBasicMaterial({ map: texture });
                    const paintingGeometry = new THREE.PlaneGeometry(data.width, data.height);
                    const paintingMesh = new THREE.Mesh(paintingGeometry, paintingMaterial);
                    
                    paintingMesh.position.copy(data.position);
                    paintingMesh.rotation.y = data.rotationY;
                    paintingMesh.userData = {
                        id: data.id,
                        title: data.title,
                        description: data.description,
                        imageSrc: data.imageSrc
                    };
                    
                    this.scene.add(paintingMesh);
                    this.paintings.push(paintingMesh);
                    
                    // Add lighting for paintings (desktop only for performance)
                    if (!isMobile) {
                        this.addPaintingLight(paintingMesh, data);
                    }
                    
                    console.log(`Painting ${index + 1} loaded:`, data.title);
                },
                undefined,
                (error) => {
                    console.error(`Error loading painting ${index + 1}:`, error);
                }
            );
        });
    }

    addPaintingLight(paintingMesh, data) {
        const lightY = paintingMesh.position.y + data.height / 2 + 0.3;
        const lightPos = new THREE.Vector3(paintingMesh.position.x, lightY, paintingMesh.position.z);
        
        const spotLight = new THREE.SpotLight(0xfff2cc, 1.2, 5, Math.PI / 4, 0.4, 1.2);
        spotLight.position.copy(lightPos);
        spotLight.target.position.copy(paintingMesh.position);
        spotLight.castShadow = true;
        spotLight.shadow.mapSize.width = 512;
        spotLight.shadow.mapSize.height = 512;
        
        this.scene.add(spotLight);
        this.scene.add(spotLight.target);
    }

    onWindowResize() {
        if (this.camera && this.renderer) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    animate() {
        if (this.scene && this.camera && this.renderer) {
            // Smooth FOV interpolation
            if (Math.abs(this.camera.fov - this.targetFov) > 0.1) {
                this.camera.fov += (this.targetFov - this.camera.fov) * 0.15;
                this.camera.updateProjectionMatrix();
            }
            
            this.renderer.render(this.scene, this.camera);
        }
    }
}

// Export for use in other modules
window.CoreGallery = CoreGallery; 