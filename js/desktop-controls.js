// Desktop Controls Module
class DesktopControls {
    constructor(camera, gallery) {
        this.camera = camera;
        this.gallery = gallery;
        this.controls = null;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveSpeed = 0.15;
        
        this.init();
    }

    init() {
        console.log('Initializing desktop controls...');
        
        // Initialize PointerLockControls
        this.controls = new THREE.PointerLockControls(this.camera, document.body);
        this.gallery.scene.add(this.controls.getObject());

        // Setup UI event listeners
        this.setupUI();
        
        // Setup keyboard controls
        this.setupKeyboardControls();
        
        // Setup mouse wheel zoom
        this.setupMouseWheel();
        
        // Start movement loop
        this.startMovementLoop();
    }

    setupUI() {
        const blocker = document.getElementById('blocker');
        const instructions = document.getElementById('instructions');

        if (instructions) {
            instructions.addEventListener('click', () => {
                this.controls.lock();
            });
        }

        this.controls.addEventListener('lock', () => {
            if (instructions) instructions.style.display = 'none';
            if (blocker) blocker.style.display = 'none';
            
            // Hide info panel when controls are locked
            const infoPanel = document.getElementById('info-panel');
            const popupContainer = document.getElementById('popup-painting-container');
            if (infoPanel) infoPanel.style.display = 'none';
            if (popupContainer) popupContainer.style.display = 'none';
        });

        this.controls.addEventListener('unlock', () => {
            // Only show blocker if popup is not open
            const popupContainer = document.getElementById('popup-painting-container');
            const isPopupOpen = popupContainer && popupContainer.style.display === 'flex';
            
            if (!isPopupOpen) {
                if (blocker) blocker.style.display = 'block';
                if (instructions) instructions.style.display = '';
            }
        });

        console.log('Desktop UI setup complete');
    }

    setupKeyboardControls() {
        const onKeyDown = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = true;
                    break;
            }
        };

        const onKeyUp = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = false;
                    break;
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        
        console.log('Desktop keyboard controls setup complete');
    }

    setupMouseWheel() {
        window.addEventListener('wheel', (event) => {
            if (this.controls && this.controls.isLocked) {
                const infoPanel = document.getElementById('info-panel');
                const popupImage = document.getElementById('popup-painting-image');
                
                if ((!infoPanel || infoPanel.style.display === 'none') && 
                    (!popupImage || popupImage.style.display === 'none')) {
                    
                    const minFov = 30;
                    const maxFov = 100;
                    this.gallery.targetFov += event.deltaY * 0.03;
                    this.gallery.targetFov = Math.max(minFov, Math.min(maxFov, this.gallery.targetFov));
                    event.preventDefault();
                }
            }
        }, { passive: false });
        
        console.log('Mouse wheel zoom setup complete');
    }

    startMovementLoop() {
        const moveCamera = () => {
            if (this.controls && this.controls.isLocked) {
                if (this.moveForward) this.controls.moveForward(this.moveSpeed);
                if (this.moveBackward) this.controls.moveForward(-this.moveSpeed);
                if (this.moveLeft) this.controls.moveRight(-this.moveSpeed);
                if (this.moveRight) this.controls.moveRight(this.moveSpeed);
            }
            requestAnimationFrame(moveCamera);
        };
        
        moveCamera();
        console.log('Desktop movement loop started');
    }

    checkPaintingInteraction() {
        if (!this.controls.isLocked) return;
        
        this.gallery.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
        const intersects = this.gallery.raycaster.intersectObjects(this.gallery.paintings);
        
        if (intersects.length > 0) {
            const intersectedPainting = intersects[0].object;
            const distance = intersects[0].distance;
            
            if (distance < 10) {
                this.showPaintingInfo(intersectedPainting);
                window._centeredPainting = intersectedPainting;
            } else {
                this.hideInfoPanelIfSafe();
                window._centeredPainting = null;
            }
        } else {
            this.hideInfoPanelIfSafe();
            window._centeredPainting = null;
        }
    }

    showPaintingInfo(painting) {
        const infoPanel = document.getElementById('info-panel');
        const titleEl = document.getElementById('painting-title');
        const descriptionEl = document.getElementById('painting-description');
        const popupContainer = document.getElementById('popup-painting-container');
        const popupImage = document.getElementById('popup-painting-image');
        
        if (titleEl) titleEl.textContent = painting.userData.title;
        if (descriptionEl) descriptionEl.textContent = painting.userData.description;
        if (popupImage) popupImage.src = painting.userData.imageSrc;
        if (infoPanel) infoPanel.style.display = 'block';
        
        // Remove any existing popup click listeners to avoid conflicts
        if (document.body._popupClickListener) {
            document.body.removeEventListener('click', document.body._popupClickListener);
            document.body._popupClickListener = null;
        }
    }

    hideInfoPanelIfSafe() {
        const infoPanel = document.getElementById('info-panel');
        const popupContainer = document.getElementById('popup-painting-container');
        
        if (!popupContainer || (popupContainer.style.display !== 'flex' && popupContainer.style.display !== 'block')) {
            if (infoPanel) infoPanel.style.display = 'none';
        }
    }

    setupPaintingClick() {
        window.addEventListener('click', (event) => {
            // Prevent conflicts with other UI elements
            if (event.target.closest('#info-panel')) {
                return;
            }
            
            const popupContainer = document.getElementById('popup-painting-container');
            const popupImage = document.getElementById('popup-painting-image');
            const infoPanel = document.getElementById('info-panel');
            
            // If popup is open, clicking outside should close it
            if (popupContainer && popupContainer.style.display === 'flex') {
                // Check if click is on the background overlay (not on the image)
                if (event.target === popupContainer || !event.target.closest('img')) {
                    this.closePopup();
                    return;
                }
            }
            
            // If near a painting and controls are locked, open popup
            if (this.controls && this.controls.isLocked && window._centeredPainting) {
                this.openPaintingPopup(window._centeredPainting);
            }
        });
    }

    openPaintingPopup(painting) {
        const popupContainer = document.getElementById('popup-painting-container');
        const popupImage = document.getElementById('popup-painting-image');
        const popupCloseBtn = document.getElementById('popup-close-btn');
        const infoPanel = document.getElementById('info-panel');
        
        if (popupImage) {
            popupImage.src = painting.userData.imageSrc;
        }
        if (popupContainer) {
            popupContainer.style.display = 'flex';
        }
        if (infoPanel) {
            infoPanel.style.display = 'none';
        }
        
        // Hide X button for desktop
        if (popupCloseBtn) {
            popupCloseBtn.style.display = 'none';
        }
        
        this.controls.unlock();
    }

    closePopup() {
        const popupContainer = document.getElementById('popup-painting-container');
        const popupCloseBtn = document.getElementById('popup-close-btn');
        const infoPanel = document.getElementById('info-panel');
        const blocker = document.getElementById('blocker');
        const instructions = document.getElementById('instructions');
        
        if (popupContainer) {
            popupContainer.style.display = 'none';
        }
        if (infoPanel) {
            infoPanel.style.display = 'none';
        }
        
        // Restore X button display for mobile (in case device switches)
        if (popupCloseBtn) {
            popupCloseBtn.style.display = '';
        }
        
        // Show the blocker/instructions again since popup is closed
        if (!this.controls.isLocked) {
            if (blocker) blocker.style.display = 'block';
            if (instructions) instructions.style.display = '';
        }
        
        if (this.controls && !this.controls.isLocked) {
            this.controls.lock();
        }
    }

    setupInfoPanelControls() {
        const closePanelBtn = document.getElementById('close-panel-btn');
        
        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                this.closePopup();
            });
        }
        
        // Note: No X button setup for desktop - it's hidden
    }
}

// Export for use in other modules
window.DesktopControls = DesktopControls; 