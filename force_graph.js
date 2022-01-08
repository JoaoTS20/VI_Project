import { isoLangs,reverse_isoLangs } from "./iso_langs.js";


const margin = {top: 10, right: 30, bottom: 40, left: 50},
      width = 700 - margin.left - margin.right,
      height = 600 - margin.top - margin.bottom;
    

const svg = d3.select(".div_d3")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",`translate(${margin.left},${margin.top})`);


d3.csv("/newdataset.csv").then(draw);


let all_data = null
let studiosFilter = null



// Let's list the force we wanna apply on the network
var simulation = d3.forceSimulation()                 // Force algorithm is applied to data.nodes
    .force("link", d3.forceLink()                               // This force provides links between nodes
        .id(function(d) { return d.id; })                     // This provide  the id of a node
    )
    .force("charge", d3.forceManyBody().strength(-800))         // This adds repulsion between nodes. Play with the -400 for the repulsion strength
    .force("center", d3.forceCenter(width / 2, height / 2))     // This force attracts nodes to the center of the svg area


function anyContains(studios,studiosFilter){
    for(let studio of studios){
        studio = studio.toLowerCase()
        for(let filter of studiosFilter){
            filter = filter.toLowerCase()
            if(studio.includes(filter)){
                return true
            }
        }
    }
    return false
}

function formatStudioString(studios){
    for(let i = 0; i < studios.length; i++){
        let char_arr = studios[i].match(/[ A-Z]+/gm)
        if(char_arr != null){
            for(let char of char_arr){
                studios[i] = studios[i].replace(char,(" "+char))
            }
        }
    }
    return studios
}
function processData(data,studiosFilter,maxMovies){
    let id = 0
    let res = {}
    let entities = {}
    let links_arr = []
    for(let movie of data){
        //Set nodes
        let movie_name = movie.original_title
        let studios_string = movie.production_companies
        studios_string = studios_string.replace(/[\[\]''\"\s]+/gm,"");
        let studios = studios_string.split(",")
        studios = formatStudioString(studios)

        if (!(anyContains(studios,studiosFilter))){
            continue
        }
        let dic_len = Object.values(entities).filter((el,index,arr) => {
            return el.type == 'movie'
        }).length
        if(dic_len >= maxMovies){
            break
        }

        if(!(movie_name in entities)){
            entities[movie_name] = {id: id, type:'movie'}
            id+=1
        }
        for(let studio of studios){
            if(!(studio in entities)){
                entities[studio] = {id: id, type:'studio'}
                id+=1
            }
        }

        //Set links
        for(let studio of studios){
            let link = {source: entities[movie_name].id, target: entities[studio].id}
            links_arr.push(link)
        }
    }
    res.links = links_arr
    let node_arr = []
    for(let name in entities){
        let node = {id:entities[name].id, name:name, type: entities[name].type}
        node_arr.push(node)
    }
    res.nodes = node_arr
    return res
}

function draw(data){
    //Clean up
    document.querySelector("g").textContent = ''
    //Save data or use previouslly loaded
    if(data == null){
        data = all_data
    }
    all_data = data

    studiosFilter = ["pixar"]
    let maxMovies = 10
    data = processData(data,studiosFilter,maxMovies)

    let mygroups = []
    for(let node of data.nodes){
        mygroups.push(node.name)
    }

    // Initialize Color
    var color = d3.scaleOrdinal()
    .domain(mygroups)
    .range(d3.schemeSet2)


     // Initialize the links
    var link = svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(data.links)
    .enter().append("line")
    .style("stroke", "#aaa")
    .attr("marker-end", d => 'url(#triangle)');



    // var link = svg
    // .selectAll("line")
    // .data(data.links)
    // .enter()
    // .append("line")
    //     .style("stroke", "#aaa")


    
    // Initialize the nodes
    // var node = svg
    // .selectAll("circle")
    // .data(data.nodes)
    // .enter()
    // .append("circle")
    //     .attr("r", 20)
    //     .style("fill", function(d){
    //         return color(d.name)
    //     })

    var node = svg.append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(data.nodes)
    .enter().append("g")

    //<image href="camera-video.svg" height="25" width="25" y="-11" x="-11"></image>
    var circles = node.append("circle")
    .attr("r", function(d){
        return d.type == 'movie' ?  20 : 30;
    })
    .attr("fill", function(d) { return color(d.name); })
    
    var icons = node.append("image")
    .attr("href", function(d) {
        return d.type == 'movie' ?  "movie.svg" : "camera-video.svg";
    })
    .attr("height",function(d){
        return d.type == 'movie' ?  25 : 35;
    })
    .attr("width",function(d){
        return d.type == 'movie' ?  25 : 35;
    })
    .attr("y",function(d){
        return d.type == 'movie' ?  -12 : -17;
    })
    .attr("x",function(d){
        return d.type == 'movie' ?  -12 : -17;
    });

    var lables = node.append("text")
    .text(function(d) {
        return d.name;
    })
    .attr('x', function(d){
        return d.type == 'movie' ?  -20 : -30;
    })
    .attr('y', function(d){
        return d.type == 'movie' ?  25 : 35;
    })
    .style('font-size',"0.7em");
  
    node.append("title")
        .text(function(d) { return d.name; })
        


    // Create a drag handler and append it to the node object instead
    var drag_handler = d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);

    drag_handler(node);


    simulation
    .nodes(data.nodes)
    .on("tick", ticked);

    simulation.force("link")
        .links(data.links);

    // This function is run at each iteration of the force algorithm, updating the nodes position.
    function ticked() {
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node
        .attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        })
    }



    function dragstarted(d) {
        if (!d.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      
      function dragged(d) {
        d.fx = d.x;
        d.fy = d.y;
      }
      
      function dragended(d) {
        if (!d.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

}