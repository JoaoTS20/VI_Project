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




//Global variables
let all_data = null
let filterClasses = new Set(["en"])
let autocomplete = new Set([])
//Update UI with formated language name
updateUIClassesSelected(filterClasses)



var mode_select = document.getElementById("mode")

//Clean when changing mode
mode_select.addEventListener('change', () => {
    filterClasses.clear()
    updateUIClassesSelected(filterClasses)
    draw(null)
})

var button_add = document.getElementById("button_add")


//Add new filter from query, if language transform from iso code if needed
button_add.addEventListener('click',() => {
    let input_add = document.getElementById("input_add")
    let mode = document.getElementById("mode").value
    let value = input_add.value.toLowerCase()
    if(mode == 'lang'){
        if(value in reverse_isoLangs){
            value = reverse_isoLangs[value]
        }
    }

    filterClasses.add(value)
    updateUIClassesSelected(filterClasses)
    draw(null)
})


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

//Reformat from camelcase "ProductionCompanyName" to "Production Company Name"
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

//Update list with queries used
function updateUIClassesSelected(filterClasses){
    let mode = document.getElementById("mode").value

    let classes = formatStudioString(filterClasses)

    if(mode == 'studios'){
        //Add sugestions from query
        if(autocomplete.size > 0){
            let sugestion_str = ''
            
            let formated_autocomplete = formatStudioString(Array.from(autocomplete))
            for(let sugestion of formated_autocomplete){
                sugestion_str += (sugestion) + ','
                if(sugestion_str.length > 150){
                    break
                }
            }
            
            document.getElementById("autocomplete").innerText ="Sugestions:"+sugestion_str.substring(0,sugestion_str.length-1) 
        }
    }


    let item_list = document.getElementById('item_list')
    item_list.textContent = '';
    for(let element of classes){
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
            div_text.innerText = capitalizeStudioString(text)
        }
        li.appendChild(div_text)

        let icon = document.createElement('i')
        icon.classList = ["fas fa-times-circle"]
        icon.style.setProperty("padding-left","2%")
        
        //When an query is deleted redraw
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

    let dataset = []
    let mode_chosen = document.getElementById("mode").value
    //Get different collumns depending on mode
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
    updateUIClassesSelected(filterClasses)


    let data_lists = []
    for(var key in dataset){
        for(var entry of dataset[key]){
            data_lists.push([key,entry[0],entry[1]])
        }
    }
    //Sort based on date than on language
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


    // Group data: one array for each year
    var sumstat = d3.group(data_lists, d => d[1]);

    var mygroups = Array.from(Object.keys(dataset)) // List of group names,either languages or production companies
    var mygroup = Array.from(mygroups.keys()) // Corresponding numerical indexes
    var stackedData = d3.stack()
      .keys(mygroup)
      .value(function(d, key){

          if(!(key in d[1])){
            return 0
          }
        return d[1][key][2]
      })
      (sumstat)


    //Set up X axis scale
    const x = d3.scaleLinear()
    .domain([d3.min(data_lists, d => d[1]), [d3.max(data_lists, d => d[1])]])
    .range([0,width ]);


    //Transform scale that appears in UI with custom tick values
    let min = d3.min(data_lists, d => d[1])
    let max  = d3.max(data_lists, d => d[1])
    svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom().scale(x)
    .tickValues([min,1920,1940,1960,1980,2000,max])
    .tickFormat((d, i) => ['1900','1920','1940','1960','1980','2000','2020'][i])
    );
        
    // Set up Y axis
    const y = d3.scaleLinear()
    .range([height,0])
    .domain([0, d3.max(data_lists, d => d[2])]);

    svg.append("g")
    .call(d3.axisLeft(y));


    // Set up color scheme
    const color = d3.scaleOrdinal()
    .domain(mygroups)
    .range(d3.schemeSet2)

    

    //Set up X axis label
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height+35 )
        .text("Time (year)");

    // Set up Y axis label
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", 5)
        .attr("y", 10 )
        .text("# of movies made")
        .attr("text-anchor", "start")



    // Draw the stacked areas
    svg
        .selectAll("mylayers")
        .data(stackedData)
        .join("path")
        .style("fill", function(d) {
            var name = mygroups[mygroups.length - d.key - 1] ;
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


    // When hovering hide other stacks
    var highlight = function(d){

        let lang = d.target.__data__
        let i  = mygroups.indexOf(lang)
        
        // Reduce opacity of all groups
        d3.selectAll(".myAreaStackedArea").style("opacity", .1)
        // Up opcity of hovered one
        d3.select("."+mygroups[mygroups.length - 1 - i]).style("opacity", 1)
      }
  
      // Go back to normal
      var noHighlight = function(d){
        d3.selectAll(".myAreaStackedArea").style("opacity", 1)
      }


    // Add one squere legend for each name
    var size = 20
    svg.selectAll("myrect")
      .data(mygroups)
      .enter()
      .append("rect")
        .attr("x", margin.left - 10)
        .attr("y", function(d,i){ return margin.bottom + i*(size+5)})
        .attr("width", size)
        .attr("height", size)
        .style("fill", function(d){ 
            return color(d)})
        .on("mouseover", highlight)
        .on("mouseleave", noHighlight)


    // Add legend
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


//List of year,count for each language
function getLanguages(data,filterClasses){
    //Dictionary ru -> [year,count]
    //list for ru-> [year,count],[year,count],[year,count]
    let lang_dict = {}
    for(let movie of data){
        let rel_date;

        //Always uses YYYY-MM-DD format
        let split_res = movie.release_date.split("-")[0]
        if (split_res == []){
            continue
        }

        if(!(filterClasses.has(movie.original_language))){
            continue
        }

        rel_date = parseInt(split_res)
        
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
        if(st.toLowerCase().trim().replace(/\s/g, '') == query.toLowerCase().trim().replace(/\s/g, '')){
            return query
        }
    }
    return null
}


//List of year count for each production company
function getStudios(data,filterClasses){
    let studio_dict = {}
    autocomplete = new Set([])
    for(let movie of data){
        let rel_date;

        let split_res = movie.release_date.split("-")[0]
        if (split_res == []){
            continue
        }

        rel_date = parseInt(split_res)
        let studios_string = movie.production_companies
        studios_string = studios_string.replace(/[\[\]''\"\s]+/gm,"");
        let studios = studios_string.split(",")

        for(let st of studios){
            for(let filter of filterClasses){
                let st_name = st.toLowerCase().trim().replace(/\s/g, '')
                filter = filter.toLowerCase().trim().replace(/\s/g, '')
                if(st_name.includes(filter) && st_name != filter){
                    autocomplete.add(st)
                }
            }

            let res = containsAny(filterClasses,st)
            if(res == null){
                continue
            }
            //Max of 8 Production Companies at a time
            if(Object.keys(studio_dict).length > 8){
                break
            }

            if (!(st in studio_dict)){
                studio_dict[st] = []
            }
            
            let count_pairs = studio_dict[st]
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
