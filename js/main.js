class DDoSAttackMap {
    constructor() {
        this.init();
    }
    
    async init() {
        console.log('Initializing DDoS Attack Map...');
        
        try {
            // Initialize components
            this.map = new WorldMap('#world-map');
            this.dataHandler = new DataHandler();
            
            // Wait for map to load before starting data stream
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.websocketClient = new WebSocketClient(this.dataHandler, this.map);
            
            console.log('DDoS Attack Map initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new DDoSAttackMap();
});