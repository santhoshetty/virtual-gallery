// Main Gallery Application - Modular Version
// Compatible with both Mobile and Desktop

class VirtualGallery {
    constructor() {
        this.mobileDetection = null;
        this.gallery = null;
        this.controls = null;
        this.animationId = null;
        
        console.log('Virtual Gallery v2.0 - Modular Edition');
        console.log('Initializing...');
    }

    async init() {
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            console.log('DOM ready, starting gallery initialization...');

            // Initialize mobile detection
            this.mobileDetection = new MobileDetection();
            
            // Initialize core gallery
            this.gallery = new CoreGallery();
            
            // Set up device-specific controls
            if (this.mobileDetection.isMobile) {
                this.setupMobile();
            } else {
                this.setupDesktop();
            }

            // Handle window resize
            this.setupWindowResize();
            
            console.log('Gallery initialization complete!');

        } catch (error) {
            console.error('Error initializing gallery:', error);
            this.showErrorMessage('Failed to initialize gallery: ' + error.message);
        }
    }

    setupMobile() {
        console.log('Setting up mobile experience...');
        
        // Mobile controls will handle their own initialization
        this.controls = new MobileControls(null, this.gallery);
        
        // Note: Camera will be available after mobile controls initialize the gallery
    }

    setupDesktop() {
        console.log('Setting up desktop experience...');
        
        // Initialize the 3D scene immediately for desktop
        const success = this.gallery.initScene(false); // false = desktop mode
        
        if (success) {
            // Initialize desktop controls
            this.controls = new DesktopControls(this.gallery.camera, this.gallery);
            
            // Setup painting interaction checking
            this.setupDesktopPaintingInteraction();
            
            // Start animation loop
            this.startAnimationLoop();
            
            console.log('Desktop gallery ready!');
        } else {
            throw new Error('Failed to initialize 3D scene for desktop');
        }
    }

    setupDesktopPaintingInteraction() {
        // Setup info panel controls
        this.controls.setupInfoPanelControls();
        this.controls.setupPaintingClick();
        
        // Start painting interaction checking loop
        const checkInteraction = () => {
            this.controls.checkPaintingInteraction();
            requestAnimationFrame(checkInteraction);
        };
        checkInteraction();
    }

    startAnimationLoop() {
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);
            this.gallery.animate();
        };
        animate();
    }

    setupWindowResize() {
        window.addEventListener('resize', () => {
            // Check if device mode changed
            const modeChanged = this.mobileDetection.onResize();
            
            if (modeChanged) {
                // Device mode changed - reload the page for proper re-initialization
                console.log('Device mode changed, reloading...');
                window.location.reload();
            } else {
                // Normal resize - just update camera and renderer
                this.gallery.onWindowResize();
            }
        });
    }

    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #e74c3c;
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            z-index: 10000;
            max-width: 80%;
            font-family: Arial, sans-serif;
        `;
        errorDiv.innerHTML = `
            <h3>Gallery Error</h3>
            <p>${message}</p>
            <button onclick="window.location.reload()" style="
                background: white;
                color: #e74c3c;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 10px;
            ">Reload Page</button>
        `;
        document.body.appendChild(errorDiv);
    }

    // Public methods for external control
    toggleMobileMode() {
        // For testing - force mobile mode
        const url = new URL(window.location);
        url.searchParams.set('mode', 'mobile');
        window.location.href = url.toString();
    }

    toggleDesktopMode() {
        // For testing - force desktop mode
        const url = new URL(window.location);
        url.searchParams.set('mode', 'desktop');
        window.location.href = url.toString();
    }

    getDebugInfo() {
        return {
            isMobile: this.mobileDetection?.isMobile,
            hasGallery: !!this.gallery,
            hasControls: !!this.controls,
            cameraPosition: this.gallery?.camera?.position,
            paintingsLoaded: this.gallery?.paintings?.length || 0,
            userAgent: navigator.userAgent.substring(0, 50) + '...',
            screenSize: `${window.innerWidth}x${window.innerHeight}`
        };
    }
}

// Auto-initialize when script loads
let virtualGallery;

// Check if all required modules are loaded
function checkModulesAndInit() {
    const requiredModules = ['MobileDetection', 'CoreGallery', 'DesktopControls', 'MobileControls'];
    const missingModules = requiredModules.filter(module => !window[module]);
    
    if (missingModules.length > 0) {
        console.error('Missing required modules:', missingModules);
        console.log('Available modules:', requiredModules.filter(module => window[module]));
        
        // Retry after a short delay
        setTimeout(checkModulesAndInit, 100);
        return;
    }
    
    // All modules loaded, initialize gallery
    virtualGallery = new VirtualGallery();
    virtualGallery.init().catch(error => {
        console.error('Failed to initialize gallery:', error);
    });
    
    // Make gallery available globally for debugging
    window.virtualGallery = virtualGallery;
}

// Start the initialization process
checkModulesAndInit();

console.log('Modular Virtual Gallery script loaded successfully'); 