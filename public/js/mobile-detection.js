// Mobile Detection Module
class MobileDetection {
    constructor() {
        this.isMobile = this.detectMobile();
        this.addDebugInfo();
    }

    detectMobile() {
        // Check user agent
        const userAgentMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Check screen size
        const screenSizeMobile = window.innerWidth <= 768;
        
        // Check touch support
        const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Check URL parameter override
        const urlParams = new URLSearchParams(window.location.search);
        const forceMode = urlParams.get('mode');
        
        if (forceMode === 'mobile') return true;
        if (forceMode === 'desktop') return false;
        
        // Return true if mobile indicators are present
        return userAgentMobile || screenSizeMobile;
    }

    addDebugInfo() {
        console.log('Mobile Detection:', {
            userAgent: navigator.userAgent.substring(0, 50) + '...',
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            touchSupport: 'ontouchstart' in window,
            maxTouchPoints: navigator.maxTouchPoints,
            isMobile: this.isMobile
        });

        // Add visual indicator
        const indicator = document.createElement('div');
        indicator.id = 'mobile-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: ${this.isMobile ? '#e74c3c' : '#27ae60'};
            color: white;
            padding: 8px 12px;
            font-size: 12px;
            border-radius: 4px;
            z-index: 10000;
            font-family: monospace;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        `;
        indicator.textContent = this.isMobile ? 'MOBILE' : 'DESKTOP';
        document.body.appendChild(indicator);
    }

    onResize() {
        // Re-detect on window resize
        const wasMobile = this.isMobile;
        this.isMobile = this.detectMobile();
        
        if (wasMobile !== this.isMobile) {
            console.log('Device mode changed:', this.isMobile ? 'Mobile' : 'Desktop');
            // Update indicator
            const indicator = document.getElementById('mobile-indicator');
            if (indicator) {
                indicator.style.background = this.isMobile ? '#e74c3c' : '#27ae60';
                indicator.textContent = this.isMobile ? 'MOBILE' : 'DESKTOP';
            }
            return true; // Indicates mode changed
        }
        return false;
    }
}

// Export for use in other modules
window.MobileDetection = MobileDetection; 