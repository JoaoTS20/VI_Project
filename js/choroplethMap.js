// Data and color scale
let data = new Map();
let table=document.getElementById( 'table_producers' );
const countOccurrences = (arr, val) => arr.reduce((a, v) => (v === val ? a + 1 : a), 0);
d3.csv("newdataset.csv").then(function(d) {
    countries=[]
    d.forEach(element => {eval(element.production_countries).forEach(cou => {countries.push(cou)})});
    cout_set=new Set(countries)
    cout_set.forEach(country => {data.set(country,countOccurrences(countries,country))})
    console.log(data)
    generateTable(data,table)
    generateMap(data)
    d3.select("#decades").on("change", change)
                function change() {
        decade=this.options[this.selectedIndex].value
        console.log(decade)
        if (decade!="All Time"){
            results=[]
            dataset_decade = d.filter(function(d){ return parseInt(d.release_date.substring(0, 5)) > parseInt(decade.substring(0, 5)) && 
            parseInt(d.release_date.substring(0, 5)) < (parseInt(decade.substring(0, 5))+ 9) })
            data.clear()
            countries=[]
            dataset_decade.forEach(element => {eval(element.production_countries).forEach(cou => {countries.push(cou)})});
            cout_set.forEach(country => {data.set(country,countOccurrences(countries,country))})

            generateTable(data,table)
            generateMap(data)

        }
        else{
            results=[]
            dataset_decade = d
            data.clear()
            countries=[]
            dataset_decade.forEach(element => {eval(element.production_countries).forEach(cou => {countries.push(cou)})});
            cout_set.forEach(country => {data.set(country,countOccurrences(countries,country))})
            generateTable(data,table)
            generateMap(data)

        }

    };

})
function generateTable(data,table){
    while(table.rows.length > 0) {
                table.deleteRow(0);
            }
    //Make Table
    var header = table.createTHead();
    var top10_countrys= new Map( Array.from( new Map([...data.entries()].sort((a, b) => a[1] - b[1])) ).slice(-10))
    //Add Top 10 Countries
    top10_countrys.forEach((values,keys)=>{
        row = table.insertRow(0);
        cell1 = row.insertCell(0);
        cell2 = row.insertCell(1);
        cell1.innerHTML = keys;
        cell2.innerHTML = values;
    })
    var rowheader = header.insertRow(0);
    var cellheader_country = rowheader.insertCell(0);
    var cellheader_mproducers = rowheader.insertCell(1);
    // Add Header
    cellheader_country.innerHTML = "<b>Country</b>"; 
    cellheader_mproducers.innerHTML= "<b>Produced</b>"

}
function generateMap(data){
    // The svg
    const svg = d3.select("#my_datavizMap"),
    width = +svg.attr("width"),
    height = +svg.attr("height");
    
    // Map and projection
    const path = d3.geoPath();
    const projection = d3.geoMercator()
    .scale(70)
    .center([0,20])
    .translate([width / 2.3, height / 2]);
    
    // Data and color scale
    const colorScale = d3.scaleThreshold()
    .domain([10, 20, 50, 100, 200,500,1000,10000,15000])
    .range(d3.schemeBlues[7]);
    
    const tooltip = d3.select("#divtooltipMap")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "5px")
            .style("padding", "10px")

    // Load external data and boot
    Promise.all([
    d3.json("world.geojson"),data]).then(function(loadData){
        let topo = loadData[0]
        console.log(topo)
        let mouseOver = function(event,d) {
            console.log(event)
            console.log(d.total)
            console.log(d.properties.name)
            
            d3.selectAll(".Country")
            .transition()
            .duration(200)
            .style("opacity", .5)
            
            d3.select(this)
            .transition()
            .duration(200)
            .style("opacity", 1)
            .style("stroke", "black")
            tooltip
            .html(d.properties.name + ` - `+ d.total)
            .style("opacity", 1)
            .style("left", (event.x) + "px") // It is important to put the +90: other wise the tooltip is exactly where the point is an it creates a weird effect
            .style("top", (event.y) + "px")
            .style("position","absolute")


        }

        let mouseLeave = function(d) {
        d3.selectAll(".Country")
            .transition()
            .duration(200)
            .style("opacity", .8)
        d3.select(this)
            .transition()
            .duration(200)
            .style("stroke", "transparent")
        tooltip.style("opacity", 0)
        }
    
        // Draw the map
        svg.append("g")
        .selectAll("path")
        .data(topo.features)
        .enter()
        .append("path")
            // draw each country
            .attr("d", d3.geoPath()
            .projection(projection)
            )
            // set the color of each country
            .attr("fill", function (d) {
            d.total = data.get(d.properties.name) || 0;
            return colorScale(d.total);
            })
            .style("stroke", "transparent")
            .attr("class", function(d){ return "Country" } )
            .style("opacity", .8)
            .on("mouseover", mouseOver )
            .on("mouseleave", mouseLeave )
    })
}