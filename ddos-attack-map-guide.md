# Building a Live DDoS Attack Map for GitHub Pages

## Project Overview

This guide will help you build a live DDoS attack map visualization that displays real-time cyber threat data, similar to popular platforms like Kaspersky Threat Map and NETSCOUT Cyber Threat Horizon. The project will be built using modern web technologies and hosted on GitHub Pages.

## Technology Stack

### Frontend
- **HTML5/CSS3** - Basic structure and styling
- **JavaScript (ES6+)** - Core application logic
- **D3.js** - Data visualization and world map rendering
- **Socket.IO Client** - Real-time data streaming
- **Bootstrap** - Responsive design framework

### Backend/Data Sources
- **Free Threat Intelligence APIs**
- **WebSocket/Server-Sent Events** for real-time updates
- **GitHub Actions** for automated data collection (optional)

### Hosting
- **GitHub Pages** - Static site hosting
- **External WebSocket service** for real-time functionality

## Project Structure

```
ddos-attack-map/
├── index.html
├── css/
│   ├── style.css
│   └── bootstrap.min.css
├── js/
│   ├── main.js
│   ├── map.js
│   ├── data-handler.js
│   └── websocket-client.js
├── data/
│   ├── world-110m.json (TopoJSON world map data)
│   └── mock-attacks.json
├── assets/
│   └── icons/
└── README.md
```

## Step 1: Setting Up the Base HTML Structure

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live DDoS Attack Map</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="css/style.css" rel="stylesheet">
</head>
<body class="bg-dark text-white">
    <div class="container-fluid">
        <header class="text-center py-3">
            <h1 class="display-4">Live DDoS Attack Map</h1>
            <p class="lead">Real-time visualization of global cyber threats</p>
        </header>
        
        <div class="row">
            <div class="col-lg-9">
                <div id="map-container" class="position-relative">
                    <svg id="world-map"></svg>
                    <div id="attack-animations"></div>
                </div>
            </div>
            
            <div class="col-lg-3">
                <div class="card bg-secondary">
                    <div class="card-header">
                        <h5>Live Attack Feed</h5>
                    </div>
                    <div class="card-body" id="attack-feed" style="height: 400px; overflow-y: auto;">
                        <!-- Attack feed items will be populated here -->
                    </div>
                </div>
                
                <div class="card bg-secondary mt-3">
                    <div class="card-header">
                        <h5>Statistics</h5>
                    </div>
                    <div class="card-body">
                        <div class="row text-center">
                            <div class="col-6">
                                <h4 id="total-attacks">0</h4>
                                <small>Total Attacks</small>
                            </div>
                            <div class="col-6">
                                <h4 id="attacks-per-second">0</h4>
                                <small>Attacks/sec</small>
                            </div>
                        </div>
                        <div class="mt-3">
                            <h6>Top Target Countries</h6>
                            <ul id="top-targets" class="list-unstyled"></ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script src="https://d3js.org/topojson.v3.min.js"></script>
    <script src="https://cdn.socket.io/4.5.0/socket.io.min.js"></script>
    <script src="js/map.js"></script>
    <script src="js/data-handler.js"></script>
    <script src="js/websocket-client.js"></script>
    <script src="js/main.js"></script>
</body>
</html>
```

## Step 2: CSS Styling

Create `css/style.css`:

```css
body {
    background: linear-gradient(135deg, #0c1622 0%, #20232a 100%);
    font-family: 'Arial', sans-serif;
}

#map-container {
    background: #1a1a2e;
    border-radius: 10px;
    overflow: hidden;
    min-height: 500px;
}

#world-map {
    width: 100%;
    height: 500px;
}

.country {
    fill: #16213e;
    stroke: #0f1419;
    stroke-width: 0.5px;
    transition: fill 0.3s ease;
}

.country:hover {
    fill: #2d4a77;
}

.attack-line {
    stroke: #ff4757;
    stroke-width: 2;
    fill: none;
    opacity: 0.8;
    animation: attackPulse 2s ease-in-out;
}

.attack-point {
    fill: #ff6b7a;
    stroke: #ff4757;
    stroke-width: 1;
    animation: pointPulse 1s infinite;
}

@keyframes attackPulse {
    0% { opacity: 0; stroke-dasharray: 0, 1000; }
    50% { opacity: 1; }
    100% { opacity: 0; stroke-dasharray: 1000, 0; }
}

@keyframes pointPulse {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.2); }
}

.card {
    border: none;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.attack-item {
    padding: 8px;
    margin: 4px 0;
    background: #343a40;
    border-radius: 5px;
    border-left: 3px solid #ff4757;
    font-size: 0.85em;
    animation: slideInRight 0.5s ease;
}

@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

.severity-high { border-left-color: #ff4757; }
.severity-medium { border-left-color: #ffa502; }
.severity-low { border-left-color: #2ed573; }
```

## Step 3: World Map Implementation

Create `js/map.js`:

```javascript
class WorldMap {
    constructor(containerId) {
        this.container = d3.select(containerId);
        this.width = 800;
        this.height = 500;
        this.projection = d3.geoMercator()
            .center([0, 20])
            .scale(120)
            .translate([this.width / 2, this.height / 2]);
        
        this.path = d3.geoPath().projection(this.projection);
        this.svg = this.container
            .attr("width", this.width)
            .attr("height", this.height);
        
        this.countries = this.svg.append("g").attr("class", "countries");
        this.attacks = this.svg.append("g").attr("class", "attacks");
        
        this.loadWorldData();
    }
    
    async loadWorldData() {
        try {
            const world = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
            
            this.countries.selectAll("path")
                .data(topojson.feature(world, world.objects.countries).features)
                .enter().append("path")
                .attr("class", "country")
                .attr("d", this.path)
                .attr("title", d => d.properties.NAME);
                
        } catch (error) {
            console.error("Error loading world data:", error);
        }
    }
    
    animateAttack(sourceCoords, targetCoords, attackData) {
        const source = this.projection(sourceCoords);
        const target = this.projection(targetCoords);
        
        if (!source || !target) return;
        
        // Create attack line
        const line = this.attacks.append("path")
            .datum({
                type: "LineString",
                coordinates: [sourceCoords, targetCoords]
            })
            .attr("class", "attack-line")
            .attr("d", this.path)
            .style("stroke", this.getAttackColor(attackData.severity));
            
        // Create target point
        const targetPoint = this.attacks.append("circle")
            .attr("class", "attack-point")
            .attr("cx", target[0])
            .attr("cy", target[1])
            .attr("r", this.getAttackRadius(attackData.intensity))
            .style("fill", this.getAttackColor(attackData.severity));
            
        // Remove elements after animation
        setTimeout(() => {
            line.remove();
            targetPoint.remove();
        }, 2000);
    }
    
    getAttackColor(severity) {
        const colors = {
            'high': '#ff4757',
            'medium': '#ffa502',
            'low': '#2ed573'
        };
        return colors[severity] || colors.medium;
    }
    
    getAttackRadius(intensity) {
        return Math.max(3, Math.min(10, intensity / 10));
    }
}
```

## Step 4: Data Handler

Create `js/data-handler.js`:

```javascript
class DataHandler {
    constructor() {
        this.attackCount = 0;
        this.attacksPerSecond = 0;
        this.countryStats = new Map();
        this.recentAttacks = [];
        this.maxFeedItems = 50;
        
        // Update attacks per second every second
        setInterval(() => this.updateAttacksPerSecond(), 1000);
    }
    
    processAttackData(attackData) {
        this.attackCount++;
        this.recentAttacks.push({
            ...attackData,
            timestamp: Date.now()
        });
        
        // Update country statistics
        if (attackData.targetCountry) {
            const count = this.countryStats.get(attackData.targetCountry) || 0;
            this.countryStats.set(attackData.targetCountry, count + 1);
        }
        
        // Update UI
        this.updateStatistics();
        this.updateAttackFeed(attackData);
        
        return attackData;
    }
    
    updateStatistics() {
        document.getElementById('total-attacks').textContent = this.attackCount.toLocaleString();
        
        // Update top targets
        const topTargets = Array.from(this.countryStats.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
            
        const targetsList = document.getElementById('top-targets');
        targetsList.innerHTML = topTargets
            .map(([country, count]) => `<li>${country}: ${count}</li>`)
            .join('');
    }
    
    updateAttackFeed(attack) {
        const feed = document.getElementById('attack-feed');
        const item = document.createElement('div');
        item.className = `attack-item severity-${attack.severity}`;
        
        const time = new Date().toLocaleTimeString();
        item.innerHTML = `
            <div class="d-flex justify-content-between">
                <span><strong>${attack.sourceCountry}</strong> → <strong>${attack.targetCountry}</strong></span>
                <small>${time}</small>
            </div>
            <small class="text-muted">${attack.attackType} - ${attack.targetIP}</small>
        `;
        
        feed.insertBefore(item, feed.firstChild);
        
        // Remove old items
        while (feed.children.length > this.maxFeedItems) {
            feed.removeChild(feed.lastChild);
        }
    }
    
    updateAttacksPerSecond() {
        const now = Date.now();
        const oneSecondAgo = now - 1000;
        const recentCount = this.recentAttacks.filter(attack => attack.timestamp > oneSecondAgo).length;
        
        this.attacksPerSecond = recentCount;
        document.getElementById('attacks-per-second').textContent = this.attacksPerSecond;
        
        // Clean old attacks
        this.recentAttacks = this.recentAttacks.filter(attack => attack.timestamp > now - 60000);
    }
    
    generateMockAttack() {
        const countries = ['United States', 'China', 'Russia', 'Germany', 'United Kingdom', 'France', 'Japan', 'South Korea', 'India', 'Brazil'];
        const attackTypes = ['DDoS', 'Botnet', 'Malware', 'Phishing', 'Brute Force'];
        const severities = ['low', 'medium', 'high'];
        
        return {
            sourceCountry: countries[Math.floor(Math.random() * countries.length)],
            targetCountry: countries[Math.floor(Math.random() * countries.length)],
            sourceIP: this.generateRandomIP(),
            targetIP: this.generateRandomIP(),
            attackType: attackTypes[Math.floor(Math.random() * attackTypes.length)],
            severity: severities[Math.floor(Math.random() * severities.length)],
            intensity: Math.floor(Math.random() * 100) + 1,
            sourceCoords: [Math.random() * 360 - 180, Math.random() * 180 - 90],
            targetCoords: [Math.random() * 360 - 180, Math.random() * 180 - 90]
        };
    }
    
    generateRandomIP() {
        return Array.from({length: 4}, () => Math.floor(Math.random() * 256)).join('.');
    }
}
```

## Step 5: WebSocket Client (Alternative: Use Mock Data)

Create `js/websocket-client.js`:

```javascript
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
```

## Step 6: Main Application

Create `js/main.js`:

```javascript
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
```

## Step 7: GitHub Pages Deployment

1. **Create GitHub Repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: DDoS Attack Map"
   git branch -M main
   git remote add origin https://github.com/yourusername/ddos-attack-map.git
   git push -u origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository settings
   - Navigate to "Pages" section
   - Select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Save the settings

3. **Your site will be available at:**
   `https://yourusername.github.io/ddos-attack-map/`

## Step 8: Integration with Real Data Sources

### Free Threat Intelligence APIs

1. **AbuseIPDB API:**
```javascript
async function checkIPReputation(ip) {
    const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}`, {
        headers: {
            'Key': 'YOUR_API_KEY',
            'Accept': 'application/json'
        }
    });
    return response.json();
}
```

2. **VirusTotal API:**
```javascript
async function getIPReport(ip) {
    const response = await fetch(`https://www.virustotal.com/vtapi/v2/ip-address/report?apikey=YOUR_API_KEY&ip=${ip}`);
    return response.json();
}
```

### Using GitHub Actions for Data Collection

Create `.github/workflows/collect-threat-data.yml`:

```yaml
name: Collect Threat Data
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:

jobs:
  collect-data:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          
      - name: Collect threat intelligence
        env:
          ABUSEIPDB_API_KEY: ${{ secrets.ABUSEIPDB_API_KEY }}
        run: |
          node scripts/collect-threat-data.js
          
      - name: Commit and push changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add data/
          git commit -m "Update threat data" || exit 0
          git push
```

## Advanced Features

### 1. Attack Intensity Heatmap
```javascript
// Add to map.js
updateCountryIntensity(countryCode, intensity) {
    const country = this.countries.select(`[data-country="${countryCode}"]`);
    const color = d3.scaleLinear()
        .domain([0, 100])
        .range(['#16213e', '#ff4757']);
    
    country.transition()
        .duration(1000)
        .style('fill', color(intensity));
}
```

### 2. Attack Type Classification
```javascript
// Add to data-handler.js
classifyAttackType(packet) {
    // Implement ML-based attack classification
    // or use signature-based detection
}
```

### 3. Geolocation Services
```javascript
async function getLocationFromIP(ip) {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    return [data.lon, data.lat];
}
```

## Performance Optimization

1. **Limit concurrent animations:** Maximum 20 attack lines at once
2. **Use requestAnimationFrame** for smooth animations
3. **Implement data throttling** to prevent overwhelming the browser
4. **Use Web Workers** for heavy data processing

## Security Considerations

1. **Never expose API keys** in client-side code
2. **Use CORS-enabled APIs** or proxy through your backend
3. **Validate all incoming data** to prevent XSS attacks
4. **Implement rate limiting** for API calls

## Troubleshooting

### Common Issues:
1. **CORS errors:** Use a CORS proxy or server-side API
2. **GitHub Pages not updating:** Clear cache, check build status
3. **Map not loading:** Verify TopoJSON data is accessible
4. **WebSocket connection fails:** Implement fallback to mock data

## Conclusion

You now have a fully functional live DDoS attack map that can be hosted on GitHub Pages. The system includes:

- Interactive world map visualization
- Real-time attack animations
- Live statistics and feeds
- Responsive design
- Extensible architecture for real threat intelligence integration

Start with mock data and gradually integrate real threat intelligence APIs as needed. The modular design makes it easy to add new features and data sources.

## Additional Resources

- [D3.js Documentation](https://d3js.org/)
- [TopoJSON Specification](https://github.com/topojson/topojson-specification)
- [Free Cybersecurity APIs](https://github.com/Spacial/awesome-threat-intelligence)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [WebSocket API Reference](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)