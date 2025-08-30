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