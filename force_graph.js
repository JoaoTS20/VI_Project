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


let data_cache = null
let studiosFilter = new Set(["Pixar Animation Studios"])
let autocomplete = new Set([])
var tool = d3.select(".container").append("div").attr("class", "hover-tooltip").attr("opacity",0.1);
let links_cache = null
let nodes_cache = null

d3.select("#button_add")
   .on("click", addStudio);





// What to do when one circle is hovered
var highlight = function(d){
    let lang = d.target.__data__
    console.log(lang)

    let root = document.querySelector("g")
    let dims = root.getBoundingClientRect()
    d3.selectAll(".node").style("opacity", .1)
    d3.select("#node"+lang.id).style("opacity", 1)
    let tooltipText = ""
    console.log(links_cache)
    console.log(nodes_cache)

    //Highlight movies made by them
    if(lang.type == 'studio'){
        let movies_made = 0
        for(let link of links_cache){
            if(link.source.id == lang.id || link.target.id == lang.id){
                movies_made+=1
                d3.select("#node"+link.source.id).style("opacity", 1)
                d3.select("#node"+link.target.id).style("opacity", 1)
            }
        }
        tooltipText = lang.name + " has made " + movies_made + " movies"
    }
    //Highlight movies studio
    else{
        let studio_ids = []
        for(let link of links_cache){
            if(link.source.id == lang.id){
                d3.select("#node"+link.target.id).style("opacity", 1)
                studio_ids.push(nodes_cache[link.target.id].name)
            }
            if(link.target.id == lang.id){
                d3.select("#node"+link.source.id).style("opacity", 1)
                studio_ids.push(nodes_cache[link.source.id].name)
            }
        }
        tooltipText = lang.name + " was made by "
        for(let studio of studio_ids){
            tooltipText += (studio+",")
        }
        tooltipText = tooltipText.substring(0,tooltipText.length-1)
    }

    //Put number of  to the side
    let tool = d3.select(".hover-tooltip")
    tool.style("left", d.screenX + "px")
    tool.style("top", d.screenY + "px")
    tool.style("display", "inline-block")
    tool.style("opacity", 1)
    tool.html(d.children ? null :tooltipText);
}

// And when it is not hovered anymore
var noHighlight = function(d){
    d3.selectAll(".node").style("opacity", 1)
    d3.select(".hover-tooltip").style("opacity", 0)
}



// Let's list the force we wanna apply on the network
var simulation = d3.forceSimulation()                 // Force algorithm is applied to data.nodes
    .force("link", d3.forceLink()                               // This force provides links between nodes
        .id(function(d) { return d.id; })                     // This provide  the id of a node
    )
    .force("charge", d3.forceManyBody().strength(-800))         // This adds repulsion between nodes. Play with the -400 for the repulsion strength
    .force("center", d3.forceCenter(width / 2, height / 2))     // This force attracts nodes to the center of the svg area


//Handle zoom
function handleZoom(e) {
    d3.select('svg g')
      .attr('transform', e.transform);
  }
  
let zoom = d3.zoom()
.on('zoom', handleZoom);

d3.select('svg')
.call(zoom);



function addStudio(){
    let query = document.getElementById("input_add").value.toLowerCase().trim() 
    studiosFilter.add(query)
    simulation = null
    draw(null)
}


function anyContains(studios,studiosFilter){
    for(let studio of studios){
        studio = studio.toLowerCase().trim().replace(/\s/g, '');
            for(let filter of studiosFilter){
                filter = filter.toLowerCase().trim().replace(/\s/g, '');
                if(studio == filter){
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

function capitalizeStudioString(studioName){
    let new_studio_name = ''
    let cap_next = false
    for(let i = 0; i < studioName.length; i++){
        let current_char = studioName[i]
        if(i == 0 || cap_next){
            current_char = current_char.toUpperCase()
            cap_next = false
        }
        if(current_char == ' '){
            cap_next = true
        }
        new_studio_name+=current_char
    }
    return new_studio_name
}

function updateUI(studio_names,original_films){
    let item_list = document.getElementById('item_list')
    item_list.textContent = '';
    // if(studio_names.length == 0 && original_films.length > 0){
    //     let div = document.createElement('div')
    //     div.innerText = "No common films between studios detected for studios "
    //     for(let film in original_films){
    //         div.innerText+= (film + " ")
    //     }
    //     item_list.appendChild(div)
    //     console.log(original_films)
    // }
   if(autocomplete.size > 0){
        let sugestion_str = ''
        for(let sugestion of autocomplete){
            sugestion_str += (sugestion) + ','
            if(sugestion_str.length > 150){
                break
            }
        }
        
        document.getElementById("autocomplete").innerText ="Sugestions:"+sugestion_str.substring(0,sugestion_str.length-1) 
   }
    studio_names = formatStudioString(studio_names)
    for(let element of studio_names){
        let li = document.createElement('li')
        li.classList = ["list-group-item"]
        let div_text = document.createElement('div')
        div_text.classList = ["inline-this"]
        div_text.innerText = capitalizeStudioString(element)

        li.appendChild(div_text)

        let icon = document.createElement('i')
        icon.classList = ["fas fa-times-circle"]
        
        icon.addEventListener("click", () => {
            studiosFilter.delete(element)
            updateUI(studiosFilter,original_films)
            draw(null)
        })
        li.appendChild(icon)
        item_list.appendChild(li)
    }
}

function processData(data,studiosFilter,maxMovies){
    let id = 0
    autocomplete = new Set([])
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


        for(let studio of studios){
            //If studio included in filter save that value
            for(let filter of studiosFilter){
                let st_name = studio.toLowerCase().trim().replace(/\s/g, '')
                filter = filter.toLowerCase().trim().replace(/\s/g, '')
                if(st_name.includes(filter) && st_name != filter){
                    autocomplete.add(studio)
                }
            }
        }

        if (!(anyContains(studios,studiosFilter))){
            continue
        }

        //If movie is for all studios in filter
        // let dic_len = Object.values(entities).filter((el,index,arr) => {
        //     return el.type == 'movie'
        // }).length
        // if(dic_len >= maxMovies){
        //     break
        // }

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
    if(simulation == null){
        simulation = d3.forceSimulation()                 // Force algorithm is applied to data.nodes
        .force("link", d3.forceLink()                               // This force provides links between nodes
            .id(function(d) { return d.id; })                     // This provide  the id of a node
        )
        .force("charge", d3.forceManyBody().strength(-800))         // This adds repulsion between nodes. Play with the -400 for the repulsion strength
        .force("center", d3.forceCenter(width / 2, height / 2))     // This force attracts nodes to the center of the svg area
    }
    document.querySelector("g").textContent = ''
    //Save data or use previouslly loaded
    if(data == null){
        data = data_cache
    }
    data_cache = data
    let maxMovies = 10
    data = processData(data,studiosFilter,maxMovies)

    links_cache = data.links
    nodes_cache = data.nodes
    let oldFilter = studiosFilter
    //studiosFilter = new Set(studio_names)
    updateUI(studiosFilter,oldFilter)

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
    .enter()
    .append("g")
    .attr("class","node")
    .attr("id", function(d) { 
        return "node"+d.id 
    })

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
  

    node.on("mouseover", highlight)
        .on("mouseleave", noHighlight)
        


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
