import { isoLangs } from "./iso_langs.js";


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


function draw(data){
    console.log(data)
    let dataset = []
    let mode_chosen = document.getElementById("mode").value
    switch (mode_chosen) {
        case "lang":
            dataset = getLanguages(data)
            break;
        case "studios":
            getStudios(data)
            break;
        default:
            break;
    }


    let data_lists = []
    for(var key in dataset){
        for(var entry of dataset[key]){
            data_lists.push([key,entry[0],entry[1]])
        }
    }
    data_lists.sort(function(a, b){
            if(a[1] == b[1]){
                if(a[2] > b[2]){
                    return 1
                }
                else{
                    return -1
                }
            }
            return a[1] - b[1]
            }
        )


    // group the data: one array for each value of the X axis.
    var sumstat = d3.group(data_lists, d => d[1]);

    var mygroups = Array.from(Object.keys(dataset)) // list of group names
    var mygroup = Array.from(mygroups.keys()) // list of group names
    var stackedData = d3.stack()
      .keys(mygroup)
      .value(function(d, key){
          console.log(d)
          if(!(key in d[1])){
            return 0
          }
        return d[1][key][2]
      })
      (sumstat)


    const x = d3.scaleLinear()
    .domain([d3.min(data_lists, d => d[1]), [d3.max(data_lists, d => d[1])]])
    .range([0,width ]);

    //scale stuff
    svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5));
        
    // Add Y axis
    const y = d3.scaleLinear()
    .range([height,0])
    .domain([0, d3.max(data_lists, d => d[2])]);

    svg.append("g")
    .call(d3.axisLeft(y));


    // color palette
    const color = d3.scaleOrdinal()
    .domain(mygroups)
    .range(d3.schemeSet2)

    

    // Add X axis label:
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height+35 )
        .text("Time (year)");

    // Add Y axis label:
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", 5)
        .attr("y", 10 )
        .text("# of movies made")
        .attr("text-anchor", "start")



    // Show the areas
    svg
        .selectAll("mylayers")
        .data(stackedData)
        .join("path")
        .style("fill", function(d) {
            //TODO: This might be very wrong
            var name = mygroups[mygroups.length - d.key - 1] ;
            console.log(name) 
            return color(name); })
            .attr("class", function(d) { 
                return "myArea " + mygroups[d.key] 
            })
            .attr("d", d3.area()
            .x(function(d, i) {
                return x(d.data[0]); })
            .y0(function(d) { 
                return y(d[0]); })
            .y1(function(d) { 
                return y(d[1]); })
        )


    //////////
    // HIGHLIGHT GROUP //
    //////////

    // What to do when one group is hovered
    var highlight = function(d){
        console.log(d)
        console.log(d.target.__data__)
        let lang = d.target.__data__
        let i  = mygroups.indexOf(lang)
        
        // reduce opacity of all groups
        d3.selectAll(".myArea").style("opacity", .1)
        // expect the one that is hovered
        d3.select("."+mygroups[mygroups.length - 1 - i]).style("opacity", 1)
      }
  
      // And when it is not hovered anymore
      var noHighlight = function(d){
        d3.selectAll(".myArea").style("opacity", 1)
      }


    //////////
    // LEGEND //
    //////////

    // Add one dot in the legend for each name.
    var size = 20
    svg.selectAll("myrect")
      .data(mygroups)
      .enter()
      .append("rect")
        .attr("x", margin.left - 10)
        .attr("y", function(d,i){ return margin.bottom + i*(size+5)}) // 100 is where the first dot appears. 25 is the distance between dots
        .attr("width", size)
        .attr("height", size)
        .style("fill", function(d){ 
            return color(d)})
        .on("mouseover", highlight)
        .on("mouseleave", noHighlight)


    // Add one dot in the legend for each name.
    svg.selectAll("mylabels")
      .data(mygroups)
      .enter()
      .append("text")
        .attr("x", margin.left - 10 + size*1.2)
        .attr("y", function(d,i){ return margin.bottom + i*(size+5) + (size/2)}) // 100 is where the first dot appears. 25 is the distance between dots
        .style("fill", function(d){ 
            return color(d)})
        .text(function(d){
            let actualName = getLanguageName(d)
            return actualName})
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")
        .on("mouseover", highlight)
        .on("mouseleave", noHighlight)

}

function getLanguageName(name){
    if(name in isoLangs){
        return isoLangs[name].name
    }
    return name

}



function getLanguages(data){
    //Dictionary ru -> [year,count]
    //list for ru-> [year,count],[year,count],[year,count]
    let lang_dict = {}
    for(let movie of data){
        let rel_date;

        //Assuming always YYYY-MM-DD format
        let split_res = movie.release_date.split("-")[0]
        if (split_res == []){
            continue
        }

        //TODO:Take this out, for testing
        if(!(movie.original_language == 'en' || movie.original_language == 'es' || movie.original_language == 'ru'
        || movie.original_language == 'it' || movie.original_language == 'fr')){
            continue
        }

        rel_date = parseInt(split_res)
        //ex:[2000,ru]
        if (!(movie.original_language in lang_dict)){
            lang_dict[movie.original_language] = []
        }
        let count_pairs = lang_dict[movie.original_language]
        let date_flag = false
        for(let i = 0; i < count_pairs.length; i++){
            let pair = count_pairs[i]
            if(pair[0] == rel_date){
                count_pairs[i][1]++
                date_flag = true
            }
        }
        if(!date_flag){
            count_pairs.push([rel_date,1]) 
        }
    }
    //TODO:Testing only
    return lang_dict

}

function getStudios(data){
    console.log(data)
}
