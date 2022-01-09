//Based of: https://www.d3-graph-gallery.com/graph/scatter_tooltip.html

// Set the dimensions and margins of the graph
const margin = {top: 10, right: 30, bottom: 40, left: 100},
    width = 500 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

//Building Tooltip 
const tooltip = d3.select("#divtooltip_scatterplot_movies_budget")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px")

//Append the svg object to the body of the page
let svg = d3.select("#scatterplot_movies_budget")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform",
            `translate(${margin.left}, ${margin.top})`);


var moviecompanysearched = document.getElementById("moviecompanysearched");


//Read the data
d3.csv("newdataset.csv").then( function(data) {

  // Add X axis
    var x = d3.scaleLinear()
        .domain([0, d3.max(data, function(d){ return (parseFloat(d.popularity))})])
        .range([ 0, width ]);
    var xAxis = svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

  // Add Y axis
    var y = d3.scaleLinear()
        .domain([0, d3.max(data, function(d){ return parseFloat(d.budget)})])
        .range([ height, 0]);
    var yAxis= svg.append("g")
        .call(d3.axisLeft(y));
  
    generateGraph(data,svg,x,y,xAxis,yAxis)

    moviecompanysearched.innerHTML="<b>All Movie Companys</b>"

    // X axis label:
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", width/2 + margin.left -25)
        .attr("y", height + margin.top + 25)
        .text("Popularity Score");

    // Y axis label:
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -margin.top - height/2 + 20)
        .text("Budget")

    d3.select("#btsearch").on("click", function() {
        studio = d3.select("#txtStudio").node().value;

        newData = data.filter(function(d){ 
            return  eval(d.production_companies).includes(studio)
        })

        if (newData.length==0){
            newData = data
            if(studio==""){
                moviecompanysearched.innerHTML="<i>Search Reset!</i> <br> <b>All Movie Companys!</b>"
            }
            else{
                moviecompanysearched.innerHTML="<i>Production Company not find!</i> <br> <b>All Movie Companys!</b>"
            }
            //console.log("empthy")
        }
        else{
            moviecompanysearched.innerHTML="Production Company:  <b>" +studio+"</b>"

        }

        // Update X axis
        x.domain([0, d3.max(newData, function(d){ 
            return (parseFloat(d.popularity))
        })])
        xAxis.transition().duration(1000).call(d3.axisBottom(x))
        
        // Update Y axis
        y.domain([0, d3.max(newData, function(d){ 
            return parseFloat(d.budget)
        })])
        yAxis.transition().duration(1000).call(d3.axisLeft(y));
        
        //Remove old circles
        svg.selectAll("circle").transition().duration(750).remove();
        
        generateGraph(newData,svg,x,y,xAxis,yAxis)

    })

})

//Function to Generate Graph
function generateGraph(data,svg,x,y,xAxis,yAxis){

    const mouseover = function(event, d) {
        tooltip
            .style("opacity", 1)
    }

    const mousemove = function(event, d) {
        tooltip
            .html(`${d.original_title} <br> Popularity Score: ${d.popularity} <br> Budget: ${d.budget} $`)
            .style("left", (event.x) -150 + "px")
            .style("top", (event.y) -180 + "px")
            .style("position","absolute")
    }

    // A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
    const mouseleave = function(event,d) {
        tooltip
            .transition()
            .duration(200)
            .style("opacity", 0)
    }

    // Add dots
    svg.append('g')
        .selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
            .attr("cx", function (d) { return x(parseFloat(d.popularity)); } )
            .attr("cy", function (d) { return y(parseFloat(d.budget) ); } )
            .attr("r", 3,5)
            .style("fill", "red")
            .style("opacity", 0.3)
            .style("stroke", "white")
            .on("mouseover", mouseover )
            .on("mousemove", mousemove )
            .on("mouseleave", mouseleave )
}
