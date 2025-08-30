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