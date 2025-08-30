class WebSocketClient {
    constructor(dataHandler, map) {
        this.dataHandler = dataHandler;
        this.map = map;
        this.isConnected = false;
        this.reconnectInterval = 5000;
        this.useMockData = true; // Set to false when you have a real WebSocket server
        
        if (this.useMockData) {
            this.startMockDataStream();
        } else {
            this.connect();
        }
    }
    
    connect() {
        try {
            // Replace with your WebSocket server URL
            this.socket = io('wss://your-websocket-server.com');
            
            this.socket.on('connect', () => {
                console.log('Connected to threat intelligence feed');
                this.isConnected = true;
            });
            
            this.socket.on('attack_data', (data) => {
                this.handleAttackData(data);
            });
            
            this.socket.on('disconnect', () => {
                console.log('Disconnected from threat intelligence feed');
                this.isConnected = false;
                setTimeout(() => this.connect(), this.reconnectInterval);
            });
            
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.startMockDataStream();
        }
    }
    
    startMockDataStream() {
        console.log('Starting mock data stream...');
        
        // Generate attacks at varying intervals
        const generateAttack = () => {
            const attack = this.dataHandler.generateMockAttack();
            this.handleAttackData(attack);
            
            // Schedule next attack (random interval between 500ms and 3s)
            const nextInterval = Math.random() * 2500 + 500;
            setTimeout(generateAttack, nextInterval);
        };
        
        generateAttack();
    }
    
    handleAttackData(rawData) {
        try {
            const attackData = this.dataHandler.processAttackData(rawData);
            
            // Animate attack on map
            if (attackData.sourceCoords && attackData.targetCoords) {
                this.map.animateAttack(
                    attackData.sourceCoords,
                    attackData.targetCoords,
                    attackData
                );
            }
            
        } catch (error) {
            console.error('Error handling attack data:', error);
        }
    }
}