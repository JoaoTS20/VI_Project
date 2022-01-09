import { isoLangs,reverse_isoLangs } from "./iso_langs.js";


const margin = {top: 10, right: 30, bottom: 40, left: 50},
      width = 500 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;
    

const svg = d3.select(".div_stacked_area")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",`translate(${margin.left},${margin.top})`)
    .attr("id","g-stacked-area");




//Global var, might have languages or studio names
let all_data = null
let filterClasses = new Set(["en"])
updateUIClassesSelected(filterClasses)



var mode_select = document.getElementById("mode")

mode_select.addEventListener('change', () => {
    filterClasses.clear()
    updateUIClassesSelected(filterClasses)
    draw(null)
})

var button_add = document.getElementById("button_add")

button_add.addEventListener('click',() => {
    let input_add = document.getElementById("input_add")
    let mode = document.getElementById("mode").value
    let value = input_add.value.toLowerCase()
    //TODO: Let me use country names, not isoCodes
    if(mode == 'lang'){
        if(value in reverse_isoLangs){
            value = reverse_isoLangs[value]
        }
    }

    filterClasses.add(value)
    updateUIClassesSelected(filterClasses)
    draw(null)
})


function updateUIClassesSelected(filterClasses){
    let mode = document.getElementById("mode").value


    let item_list = document.getElementById('item_list')
    item_list.textContent = '';
    for(let element of filterClasses){
        let li = document.createElement('li')
        li.classList = ["list-group-item"]
        let div_text = document.createElement('div')
        div_text.classList = ["inline-this"]
        if(mode == 'lang' && element in isoLangs){
            let text = isoLangs[element]['name']
            div_text.innerText = text[0].toUpperCase() + text.substring(1,text.length)
        }
        else{
            let text = element
            div_text.innerText = text[0].toUpperCase() + text.substring(1,text.length)
        }
        li.appendChild(div_text)

        let icon = document.createElement('i')
        icon.classList = ["fas fa-times-circle"]
        icon.style.setProperty("padding-left","2%")
        
        icon.addEventListener("click", () => {
            filterClasses.delete(element)
            updateUIClassesSelected(filterClasses)
            draw(null)
        })
        li.appendChild(icon)
        item_list.appendChild(li)
    }
}


d3.csv("/newdataset.csv").then(draw);


function draw(data){
    //Clean up
    document.querySelector("#g-stacked-area").textContent = ''
    //Save data or use previouslly loaded
    if(data == null){
        data = all_data
    }
    all_data = data
    console.log(data)
    let dataset = []
    let mode_chosen = document.getElementById("mode").value
    switch (mode_chosen) {
        case "lang":
            dataset = getLanguages(data,filterClasses)
            break;
        case "studios":
            dataset = getStudios(data,filterClasses)
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
    let min = d3.min(data_lists, d => d[1])
    let max  = d3.max(data_lists, d => d[1])
    svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom().scale(x)
    .tickValues([min,1920,1940,1960,1980,2000,max])
    .tickFormat((d, i) => ['1900','1920','1940','1960','1980','2000','2020'][i])
    );
        
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
                return "myAreaStackedArea " + mygroups[d.key] 
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
        d3.selectAll(".myAreaStackedArea").style("opacity", .1)
        // expect the one that is hovered
        d3.select("."+mygroups[mygroups.length - 1 - i]).style("opacity", 1)
      }
  
      // And when it is not hovered anymore
      var noHighlight = function(d){
        d3.selectAll(".myAreaStackedArea").style("opacity", 1)
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
        .attr("y", function(d,i){ return margin.bottom + i*(size+5) + (size/2)})
        .style("fill", function(d){ 
            return color(d)})
        .text(function(d){
            if(mode_chosen == 'studios') return d.charAt(0).toUpperCase() + d.slice(1);
            let actualName = getLanguageName(d)
            return actualName.charAt(0).toUpperCase() + actualName.slice(1);
        })
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



function getLanguages(data,filterClasses){
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

        if(!(filterClasses.has(movie.original_language))){
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

    return lang_dict

}


function containsAny(filterClasses, st){
    for(var query of filterClasses.values()){
        if(st.toLowerCase().includes(query)){
            return query
        }
    }
    return null
}

function getStudios(data,filterClasses){
    //Dictionary pixar -> [year,count]
    //list for pixar -> [year,count],[year,count],[year,count]
    let studio_dict = {}
    for(let movie of data){
        let rel_date;

        //Assuming always YYYY-MM-DD format
        let split_res = movie.release_date.split("-")[0]
        if (split_res == []){
            continue
        }

        rel_date = parseInt(split_res)
        let studios_string = movie.production_companies
        studios_string = studios_string.replace(/[\[\]''\"\s]+/gm,"");
        let studios = studios_string.split(",")

        for(let st of studios){
            let res = containsAny(filterClasses,st)
            if(res == null){
                continue
            }

            if (!(res in studio_dict)){
                studio_dict[res] = []
            }
            
            //We are going to use the query instead of the studio name
            let count_pairs = studio_dict[res]
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
    }

    return studio_dict
}
