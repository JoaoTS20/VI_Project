import { isoLangs,reverse_isoLangs } from "./iso_langs.js";


const margin = {top: 10, right: 30, bottom: 40, left: 50},
      width = 500 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;
    

const svg = d3.select(".div_d3")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",`translate(${margin.left},${margin.top})`);


d3.csv("/newdataset.csv").then(draw);



//returns in form os list of dicts 
function processData(data){

}

function draw(data){
    //Clean up
    document.querySelector("g").textContent = ''
    //Save data or use previouslly loaded
    if(data == null){
        data = all_data
    }
    all_data = data

    let res = processData(data,mode)

}