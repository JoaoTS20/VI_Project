import { isoLangs,reverse_isoLangs } from "./iso_langs.js";


const margin = {top: 10, right: 30, bottom: 40, left: 50},
      width = 500 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;
    

const svg = d3.select(".div_tree_map")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",`translate(${margin.left},${margin.top})`)
    .attr("id","g-treemap");


d3.csv("/newdataset.csv").then(draw);



//Returns a dictionary with language -> revenue or genre -> revenue
function processData(data,mode){
    let groups = []
    let lang_dict = {}
    for(let movie of data){
        if(!(movie.original_language in isoLangs)){
            continue
        }
        let key = ''
        if(mode == 'languages'){
            key = isoLangs[movie.original_language].name
            if(!(key in lang_dict)){
                lang_dict[key] = {name: key, parent: 'root', value: parseFloat(movie.revenue), oldValue: parseFloat(movie.revenue) }
                groups.push(key)
            }
            else{
                lang_dict[key].value += parseFloat(movie.revenue)
                lang_dict[key].oldValue += parseFloat(movie.revenue)
            }
        }
        else{
            if(language_selected != null && movie.original_language != language_selected){
                continue
            }
            key = movie.genres
            key = key.replace(/[\[\]''\"\s]+/gm,"");
            let genres = key.split(",")
            for(let genre of genres){
                if(!(genre in lang_dict)){
                    lang_dict[genre] = {name: genre, parent: 'root', value: parseFloat(movie.revenue), oldValue: parseFloat(movie.revenue) }
                    groups.push(genre)
                }
                else{
                    lang_dict[genre].value += parseFloat(movie.revenue)
                    lang_dict[genre].oldValue += parseFloat(movie.revenue)
                }
            }
        }

    }
    let lang_arr = []
    for(let lang in lang_dict){
        lang_arr.push(lang_dict[lang])
    }
    lang_arr.sort((a,b) => a.value - b.value)

    //This is done to filter out squares with very low revenue
    //Which are put in the 'Others' square
    let other_value = 0
    let sum_of_all = d3.sum(lang_arr, d => d.value)
    if(mode == 'genders'){
        lang_arr = lang_arr.filter((el,index,arr) => {
            if(el.value/sum_of_all < 0.03){
                other_value+=el.value
                return false
            }
            return true
        })
        if(other_value/sum_of_all > 0.05){
            lang_arr.push({name: 'Others', parent: 'root', value: other_value, oldValue: other_value})
            lang_dict['Others'] = {name: 'Others', parent: 'root', value: other_value, oldValue: other_value}
        }
    }
    else{
        lang_arr = lang_arr.filter((el,index,arr) => {
            if(el.value/sum_of_all < 0.001){
                other_value+=el.value
                return false
            }
            return true
        })
        lang_arr.push({name: 'Others', parent: 'root', value: other_value, oldValue: other_value})
        lang_dict['Others'] = {name: 'Others', parent: 'root', value: other_value, oldValue: other_value}
    }


    //Exponential scale in order so squares don't go over a certain limit in contrast to others
    let valueScale = d3.scalePow()
        .exponent(1/4)
        .domain([0, d3.max(lang_arr, d => d.value)])
        .range([0, 1000]);
    for(var i = 0; i < lang_arr.length; i++){
        if(lang_arr[i].value != 0){
            if(mode == 'languages'){
                lang_arr[i].value =  valueScale(lang_arr[i].value);
            }
            else{
                lang_arr[i].value =  lang_arr[i].value
            }
            
        }
    }
    lang_arr.push({name: 'root', parent: '', value: '',oldValue: ''})
    return [lang_arr,groups,lang_dict]
}

let data_processed = null
let all_data = null
let language_selected = null
let mode = 'languages'
var tool = d3.select("#tree_map_container").append("div").attr("class", "tooltip-treemap").attr("opacity",0.1);


d3.select("#go-back").style("opacity",0)


//Change mode
const go_back = d3.select("#go-back")
                .on('click',() => {
                    mode = 'languages'
                    d3.select("#go-back").style("opacity",0)
                    language_selected = null
                    draw(null)
                })


//Hover fucntion for one square
var highlight = function(d){
    let lang = d.target.__data__

    let root = document.querySelector("#g-treemap")
    let dims = root.getBoundingClientRect()
    d3.selectAll(".squareArea").style("opacity", .1)
    d3.select("#"+lang.id).style("opacity", 1)

    //Put revenue to the side
    let tool = d3.select(".tooltip-treemap")
    tool.style("left", dims.left + lang.x0 - 100 + "px")
    tool.style("top", dims.top + lang.y0 - 100 + "px")
    tool.style("display", "inline-block")
    tool.style("opacity", 1)
    let tooltipText = ""
    if(data_processed != null){
        tooltipText = "Revenue:"+formatNumber(data_processed[lang.id].oldValue.toString())+"$"
    }
    else{
        tooltipText =  "Revenue:"+lang.value+"$"

    }
    tool.html(d.children ? null :tooltipText);
    if(mode != null && mode == 'languages'){
        tool.append("p").html("Click to filter by language")
    }
}

function formatNumber(number){

    for(let i = number.length; i > 0; i-=3){
        number = number.substr(0, i) + ' ' + number.substr(i,number.length);
    }

    return number
}

//Go Back to normal when not hovering
var noHighlight = function(d){
    d3.selectAll(".squareArea").style("opacity", 1)
    d3.select(".tooltip-treemap").style("opacity", 0)
}

var transition = function(d){
    //if mode == langs change to genders and redraw
    if(mode == 'languages'){
        if((d.target.__data__.id.toLowerCase()) == "others"){
            return
        }
        //Small animation, obscure svg and then animate opacity
        d3.select(".div_tree_map")
        .style("opacity", "0")

        d3.select(".div_tree_map")
        .transition()
        .duration(500)
        .style("opacity", "1")

        mode = 'genders'
        d3.select("#go-back")
                .style("opacity",1)
        language_selected = reverse_isoLangs[d.target.__data__.id.toLowerCase()]
        draw(null)
    }
}


function draw(data){
    //Clean up
    document.querySelector("#g-treemap").textContent = ''
    //Save data or use previouslly loaded
    if(data == null){
        data = all_data
    }
    all_data = data

    let res = processData(data,mode)
    data = res[0]
    let mygroups = res[1]
    data_processed = res[2]


    // Define color palete
    const color = d3.scaleOrdinal()
    .domain(mygroups)
    .range(d3.schemeSet2)

    // Stratify the data
    var root = d3.stratify()
      .id(function(d) { return d.name; })  
      .parentId(function(d) { return d.parent; }) 
      (data);
    root.sum(function(d) { return +d.value }) 
  
    // Computes each elements position in the tree and it's dimensions
    d3.treemap()
      .size([width, height])
      .padding(4)
      (root)
  
    svg
      .selectAll("rect")
      .data(root.leaves())
      .enter()
      .append("rect")
        .attr('x', function (d) { return d.x0; })
        .attr('y', function (d) { return d.y0; })
        .attr('width', function (d) { return d.x1 - d.x0; })
        .attr('height', function (d) { return d.y1 - d.y0; })
        .attr("id", function(d) { 
            return d.id 
        })
        .attr("class", function(d) { 
            return "squareArea"
        })
        .style("stroke", "black")
        .style("fill",function(d){
            return color(d.id);
        })
        .on("mouseover", highlight)
        .on("mouseleave", noHighlight)
        .on("click",transition);
  
    // Text labels
    svg
      .selectAll("text")
      .data(root.leaves())
      .enter()
      .append("text")
        .attr("x", function(d){ return d.x0+10})
        .attr("y", function(d){ return d.y0+20})
        .text(function(d){ return d.data.name})
        .attr("font-size", "10px")
        .attr("fill", "white")

}