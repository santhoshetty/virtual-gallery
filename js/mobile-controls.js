// Mobile Controls Module
class MobileControls {
    constructor(camera, gallery) {
        this.camera = camera;
        this.gallery = gallery;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveSpeed = 0.15;
        
        this.touchControls = {
            rotationSpeed: 0.002
        };
        
        // Track active painting info for distance-based closing
        this.activePainting = null;
        this.infoPanelOpen = false;
        this.imagePopupOpen = false;
        this.maxInfoDistance = 20; // Distance threshold for auto-closing info
        
        this.init();
    }

    init() {
        console.log('Initializing mobile controls...');
        
        // Hide desktop UI elements
        this.hideDesktopUI();
        
        // Create mobile loading screen
        this.createMobileLoadingScreen();
    }

    hideDesktopUI() {
        const blocker = document.getElementById('blocker');
        const instructions = document.getElementById('instructions');
        
        if (blocker) blocker.style.display = 'none';
        if (instructions) instructions.style.display = 'none';
        
        console.log('Desktop UI hidden for mobile');
    }

    createMobileLoadingScreen() {
        const loadingScreen = document.createElement('div');
        loadingScreen.id = 'mobile-loading-screen';
        loadingScreen.innerHTML = `
            <div style="text-align: center; max-width: 400px;">
                <h1 style="font-size: 3em; margin-bottom: 20px;">🎨</h1>
                <h2 style="margin-bottom: 20px; color: white;">Mom's Art Gallery</h2>
                <p style="margin-bottom: 30px; line-height: 1.6; opacity: 0.9;">
                    Welcome to an immersive virtual gallery experience.<br>
                    Use touch controls to navigate and explore beautiful artworks.
                </p>
                <div style="margin-bottom: 30px; font-size: 14px; opacity: 0.8;">
                    <p>📱 Touch and drag to look around</p>
                    <p>🕹️ Use virtual joystick to move</p>
                    <p>ℹ️ Tap info button near paintings</p>
                </div>
                <button id="mobile-start-btn">Start Gallery Tour</button>
            </div>
        `;
        
        loadingScreen.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            // background: linear-gradient(135deg,rgb(179, 234, 102) 0%,rgb(216, 149, 180) 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
            font-family: 'Arial', sans-serif;
            z-index: 9998;
            padding: 20px;
            box-sizing: border-box;
        `;
        
        // Add button styles
        const style = document.createElement('style');
        style.textContent = `
            #mobile-start-btn {
                background: rgba(255, 255, 255, 0.2);
                border: 2px solid rgba(255, 255, 255, 0.5);
                color: white;
                padding: 15px 30px;
                font-size: 18px;
                border-radius: 25px;
                cursor: pointer;
                transition: background 0.3s ease;
            }
            #mobile-start-btn:hover, #mobile-start-btn:active {
                background: rgba(255, 255, 255, 0.3);
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(loadingScreen);
        
        // Add button functionality
        document.getElementById('mobile-start-btn').addEventListener('click', () => {
            loadingScreen.style.display = 'none';
            this.initMobileGallery();
        });
        
        console.log('Mobile loading screen created');
    }

    initMobileGallery() {
        console.log('Initializing mobile gallery...');
        
        // Initialize the 3D scene
        const success = this.gallery.initScene(true); // true = mobile mode
        
        if (success) {
            // IMPORTANT: Update camera reference after scene initialization
            this.camera = this.gallery.camera;
            console.log('Camera reference updated:', this.camera ? 'SUCCESS' : 'FAILED');
            
            // Setup mobile-specific controls
            this.setupTouchControls();
            this.setupMobileUI();
            this.startMovementLoop();
            this.startAnimationLoop();
            
            console.log('Mobile gallery initialized successfully');
        } else {
            console.error('Failed to initialize mobile gallery');
            alert('Sorry, there was an error loading the gallery on your device.');
        }
    }

    setupTouchControls() {
        let lastTouchX = 0, lastTouchY = 0, isRotating = false;
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        const PI_2 = Math.PI / 2;
        
        document.addEventListener('touchstart', (event) => {
            if (event.touches.length === 1) {
                isRotating = true;
                lastTouchX = event.touches[0].pageX;
                lastTouchY = event.touches[0].pageY;
            }
            event.preventDefault();
        }, { passive: false });
        
        document.addEventListener('touchmove', (event) => {
            if (isRotating && event.touches.length === 1) {
                const touch = event.touches[0];
                const movementX = touch.pageX - lastTouchX;
                const movementY = touch.pageY - lastTouchY;
                
                euler.setFromQuaternion(this.camera.quaternion);
                euler.y -= movementX * this.touchControls.rotationSpeed;
                euler.x -= movementY * this.touchControls.rotationSpeed;
                euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
                this.camera.quaternion.setFromEuler(euler);
                
                lastTouchX = touch.pageX;
                lastTouchY = touch.pageY;
            }
            event.preventDefault();
        }, { passive: false });
        
        document.addEventListener('touchend', (event) => {
            isRotating = false;
            event.preventDefault();
        }, { passive: false });
        
        // Pinch-to-zoom
        this.setupPinchZoom();
        
        console.log('Touch controls setup complete');
    }

    setupPinchZoom() {
        let initialDistance = 0;
        
        document.addEventListener('touchstart', (event) => {
            if (event.touches.length === 2) {
                const dx = event.touches[0].pageX - event.touches[1].pageX;
                const dy = event.touches[0].pageY - event.touches[1].pageY;
                initialDistance = Math.sqrt(dx * dx + dy * dy);
            }
        });
        
        document.addEventListener('touchmove', (event) => {
            if (event.touches.length === 2) {
                const dx = event.touches[0].pageX - event.touches[1].pageX;
                const dy = event.touches[0].pageY - event.touches[1].pageY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (initialDistance > 0) {
                    const scale = distance / initialDistance;
                    const minFov = 40;
                    const maxFov = 90;
                    this.gallery.targetFov = Math.max(minFov, Math.min(maxFov, this.gallery.targetFov / scale));
                    initialDistance = distance;
                }
                event.preventDefault();
            }
        }, { passive: false });
    }

    setupMobileUI() {
        // Create control container
        const controlsContainer = document.createElement('div');
        controlsContainer.id = 'mobile-controls';
        controlsContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            pointer-events: none;
            z-index: 1000;
        `;
        
        // Create virtual joystick
        const joystickContainer = this.createVirtualJoystick();
        
        // Create info button
        const infoButton = this.createInfoButton();
        
        controlsContainer.appendChild(joystickContainer);
        controlsContainer.appendChild(infoButton);
        document.body.appendChild(controlsContainer);
        
        console.log('Mobile UI created');
    }

    createVirtualJoystick() {
        const joystickContainer = document.createElement('div');
        joystickContainer.style.cssText = `
            width: 120px;
            height: 120px;
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            position: relative;
            pointer-events: all;
            touch-action: none;
        `;
        
        const joystick = document.createElement('div');
        joystick.style.cssText = `
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            position: absolute;
            left: 50%;
            top: 50%;
            margin-left: -20px;
            margin-top: -20px;
            pointer-events: none;
        `;
        
        joystickContainer.appendChild(joystick);
        
        // Joystick functionality
        let joystickActive = false;
        const joystickCenter = { x: 60, y: 60 };
        
        joystickContainer.addEventListener('touchstart', (e) => {
            joystickActive = true;
            e.stopPropagation();
            e.preventDefault();
        });
        
        joystickContainer.addEventListener('touchmove', (e) => {
            if (!joystickActive) return;
            
            const rect = joystickContainer.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left - joystickCenter.x;
            const y = touch.clientY - rect.top - joystickCenter.y;
            
            const distance = Math.sqrt(x * x + y * y);
            const maxDistance = 40;
            
            if (distance > maxDistance) {
                const angle = Math.atan2(y, x);
                const constrainedX = Math.cos(angle) * maxDistance;
                const constrainedY = Math.sin(angle) * maxDistance;
                joystick.style.left = (joystickCenter.x + constrainedX) + 'px';
                joystick.style.top = (joystickCenter.y + constrainedY) + 'px';
                joystick.style.marginLeft = '-20px';
                joystick.style.marginTop = '-20px';
            } else {
                joystick.style.left = (joystickCenter.x + x) + 'px';
                joystick.style.top = (joystickCenter.y + y) + 'px';
                joystick.style.marginLeft = '-20px';
                joystick.style.marginTop = '-20px';
            }
            
            // Convert to movement
            const normalizedX = Math.max(-1, Math.min(1, x / maxDistance));
            const normalizedY = Math.max(-1, Math.min(1, y / maxDistance));
            
            const prevMoveLeft = this.moveLeft;
            const prevMoveRight = this.moveRight;
            const prevMoveForward = this.moveForward;
            const prevMoveBackward = this.moveBackward;
            
            this.moveLeft = normalizedX < -0.3;
            this.moveRight = normalizedX > 0.3;
            this.moveForward = normalizedY < -0.3;
            this.moveBackward = normalizedY > 0.3;
            
            // Visual feedback: Change joystick color when moving
            const isMoving = this.moveLeft || this.moveRight || this.moveForward || this.moveBackward;
            joystick.style.background = isMoving ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
            
            // Debug: Log when movement state changes
            if (this.moveLeft !== prevMoveLeft || this.moveRight !== prevMoveRight || 
                this.moveForward !== prevMoveForward || this.moveBackward !== prevMoveBackward) {
                console.log('Joystick movement flags updated:', {
                    normalizedX,
                    normalizedY,
                    moveLeft: this.moveLeft,
                    moveRight: this.moveRight,
                    moveForward: this.moveForward,
                    moveBackward: this.moveBackward
                });
            }
            
            e.stopPropagation();
            e.preventDefault();
        });
        
        joystickContainer.addEventListener('touchend', (e) => {
            joystickActive = false;
            joystick.style.left = '50%';
            joystick.style.top = '50%';
            joystick.style.marginLeft = '-20px';
            joystick.style.marginTop = '-20px';
            joystick.style.background = 'rgba(255, 255, 255, 0.8)'; // Reset color
            this.moveLeft = this.moveRight = this.moveForward = this.moveBackward = false;
            console.log('Joystick reset to center');
            e.stopPropagation();
            e.preventDefault();
        });
        
        return joystickContainer;
    }

    createInfoButton() {
        const infoButton = document.createElement('button');
        infoButton.innerHTML = 'ℹ️';
        infoButton.style.cssText = `
            width: 60px;
            height: 60px;
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            color: white;
            font-size: 24px;
            pointer-events: all;
            cursor: pointer;
        `;
        
        infoButton.addEventListener('touchstart', (e) => {
            this.checkPaintingInteractionMobile();
            e.preventDefault();
            e.stopPropagation();
        });
        
        return infoButton;
    }

    startMovementLoop() {
        const moveCamera = () => {
            if (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight) {
                // Debug: Log movement state
                if (Math.random() < 0.1) { // Log occasionally to avoid spam
                    console.log('Movement detected:', {
                        forward: this.moveForward,
                        backward: this.moveBackward,
                        left: this.moveLeft,
                        right: this.moveRight,
                        cameraPos: this.camera ? this.camera.position.clone() : 'NO CAMERA'
                    });
                }
                
                if (!this.camera) {
                    console.error('Camera not available for movement');
                    requestAnimationFrame(moveCamera);
                    return;
                }
                
                const direction = new THREE.Vector3();
                const right = new THREE.Vector3();
                
                this.camera.getWorldDirection(direction);
                right.crossVectors(this.camera.up, direction).normalize();
                
                if (this.moveForward) this.camera.position.addScaledVector(direction, this.moveSpeed);
                if (this.moveBackward) this.camera.position.addScaledVector(direction, -this.moveSpeed);
                if (this.moveLeft) this.camera.position.addScaledVector(right, this.moveSpeed);
                if (this.moveRight) this.camera.position.addScaledVector(right, -this.moveSpeed);
            }
            requestAnimationFrame(moveCamera);
        };
        
        moveCamera();
        console.log('Mobile movement loop started');
    }

    startAnimationLoop() {
        const animate = () => {
            requestAnimationFrame(animate);
            
            // Check distance to active painting for auto-closing panels
            this.checkDistanceToActivePainting();
            
            // Render the gallery
            this.gallery.animate();
        };
        animate();
        console.log('Mobile animation loop started');
    }

    checkPaintingInteractionMobile() {
        this.gallery.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
        const intersects = this.gallery.raycaster.intersectObjects(this.gallery.paintings);
        
        if (intersects.length > 0) {
            const intersectedPainting = intersects[0].object;
            const distance = intersects[0].distance;
            
            if (distance < 15) { // Larger detection distance for mobile
                this.showMobilePaintingInfo(intersectedPainting);
            } else {
                this.showDistanceMessage();
            }
        } else {
            this.showNoPaintingMessage();
        }
    }

    showMobilePaintingInfo(painting) {
        const infoPanel = document.getElementById('info-panel');
        const titleEl = document.getElementById('painting-title');
        const descriptionEl = document.getElementById('painting-description');
        const popupContainer = document.getElementById('popup-painting-container');
        const popupImage = document.getElementById('popup-painting-image');
        
        // Track the active painting and panel state
        this.activePainting = painting;
        this.infoPanelOpen = true;
        
        if (titleEl) titleEl.textContent = painting.userData.title;
        if (descriptionEl) descriptionEl.textContent = painting.userData.description;
        if (popupImage) popupImage.src = painting.userData.imageSrc;
        if (infoPanel) infoPanel.style.display = 'block';
        
        // Auto-show full image after a delay
        setTimeout(() => {
            if (infoPanel && infoPanel.style.display === 'block') {
                if (popupContainer) {
                    popupContainer.style.display = 'block';
                    this.imagePopupOpen = true;
                }
                if (infoPanel) {
                    infoPanel.style.display = 'none';
                    this.infoPanelOpen = false;
                }
            }
        }, 3000);
        
        this.setupMobileInfoPanelControls();
    }

    showDistanceMessage() {
        this.showTemporaryMessage('Move closer to the painting to view details');
    }

    showNoPaintingMessage() {
        this.showTemporaryMessage('No painting in view. Look around to find artworks!');
    }

    showTemporaryMessage(message) {
        // Remove existing message
        const existingMessage = document.getElementById('temp-message');
        if (existingMessage) existingMessage.remove();
        
        const messageEl = document.createElement('div');
        messageEl.id = 'temp-message';
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            bottom: 200px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 1001;
            max-width: 80%;
            text-align: center;
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 2000);
    }

    setupMobileInfoPanelControls() {
        const closePanelBtn = document.getElementById('close-panel-btn');
        const popupContainer = document.getElementById('popup-painting-container');
        const popupImage = document.getElementById('popup-painting-image');
        const popupCloseBtn = document.getElementById('popup-close-btn');
        
        const closeInfoAndPopup = () => {
            const infoPanel = document.getElementById('info-panel');
            if (infoPanel) infoPanel.style.display = 'none';
            if (popupContainer) popupContainer.style.display = 'none';
            
            // Reset tracking variables
            this.activePainting = null;
            this.infoPanelOpen = false;
            this.imagePopupOpen = false;
        };
        
        // Close panel button
        if (closePanelBtn) {
            closePanelBtn.onclick = closeInfoAndPopup;
        }
        
        // Close on image click (keep this for backward compatibility)
        if (popupImage) {
            popupImage.onclick = closeInfoAndPopup;
        }
        
        // Close button (new X button)
        if (popupCloseBtn) {
            popupCloseBtn.onclick = closeInfoAndPopup;
            
            // Add touch event for mobile
            popupCloseBtn.addEventListener('touchstart', (e) => {
                closeInfoAndPopup();
                e.preventDefault();
                e.stopPropagation();
            });
        }
    }

    // Check distance to active painting and auto-close panels if too far
    checkDistanceToActivePainting() {
        if (!this.activePainting || !this.camera) return;
        if (!this.infoPanelOpen && !this.imagePopupOpen) return;
        
        // Calculate distance to the active painting
        const paintingPosition = this.activePainting.position;
        const cameraPosition = this.camera.position;
        const distance = paintingPosition.distanceTo(cameraPosition);
        
        // Close panels if too far away
        if (distance > this.maxInfoDistance) {
            console.log(`Moving away from painting (distance: ${distance.toFixed(2)}), closing info panels`);
            
            const infoPanel = document.getElementById('info-panel');
            const popupContainer = document.getElementById('popup-painting-container');
            
            if (infoPanel) infoPanel.style.display = 'none';
            if (popupContainer) popupContainer.style.display = 'none';
            
            // Reset tracking variables
            this.activePainting = null;
            this.infoPanelOpen = false;
            this.imagePopupOpen = false;
            
            this.showTemporaryMessage('Moved away from painting');
        }
    }
}

// Export for use in other modules
window.MobileControls = MobileControls; 