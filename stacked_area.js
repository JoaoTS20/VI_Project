const margin = {top: 10, right: 30, bottom: 30, left: 50},
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


    const x = d3.scaleLinear()
    .domain([d3.min(dataset, d => d[0]), [d3.max(dataset, d => d[0])]])
    .range([0,width ]);

    //scale stuff
    svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));
        
    // Add Y axis
    const y = d3.scaleLinear()
    .range([height,0])
    .domain([0, d3.max(dataset, d => d[1])]);

    svg.append("g")
    .call(d3.axisLeft(y));
    
    dataset.sort(function(a, b){return a[0] - b[0]});
    console.log(dataset)
    // Add the area
    svg.append("path")
      .datum(dataset)
      .attr("fill", "#cce5df")
      .attr("stroke", "#69b3a2")
      .attr("stroke-width", 1.5)
      .attr("d", d3.area()
        .x(d => {
            console.log(d)
            return x(d[0])})
        .y0(y(0))
        .y1(d => {
            //console.log(d[1] + " " + y(d[1]))    
            return y(d[1])
        })) 
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

        rel_date = parseInt(split_res)
        //ex:[2000,ru]
        if (!(movie.original_language in lang_dict)){
            lang_dict[movie.original_language] = []
        }
        count_pairs = lang_dict[movie.original_language]
        date_flag = false
        for(let i = 0; i < count_pairs.length; i++){
            pair = count_pairs[i]
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
    return lang_dict['en']

}

function getStudios(data){
    console.log(data)
}
