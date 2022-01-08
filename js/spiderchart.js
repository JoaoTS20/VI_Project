
/* Radar chart design created by Nadieh Bremer - VisualCinnamon.com */

////////////////////////////////////////////////////////////// 
//////////////////////// Set-Up ////////////////////////////// 
////////////////////////////////////////////////////////////// 

var margin = {top: 100, right: 100, bottom: 100, left: 100},
    width = Math.min(550, window.innerWidth - 10) - margin.left - margin.right + 160,
    height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);
        
////////////////////////////////////////////////////////////// 
////////////////////////// Data ////////////////////////////// 
////////////////////////////////////////////////////////////// 


d3.csv("newdataset.csv", function(data) {

    var_data_director1=[]
    var_data_director2=[]
    
    var default_genres= new Set(['Action', 'TV Movie', 'Romance', 'Foreign', 'Comedy', 'Animation', 'Western', 'Drama', 'War', 'Family', 'Science Fiction', 'History', 'Adventure', 'Music', 'Thriller', 'Horror', 'Mystery', 'Fantasy', 'Documentary', 'Crime']);

    //Create array of options to be added
    var arrayDirectorOptions = [];
    data.forEach(element=> {
        eval(element["director"]).forEach(dire => {arrayDirectorOptions.push(dire)})
    });
    console.log(arrayDirectorOptions)
    
    var directorname1=document.getElementById("directorName1");
    var directorname2=document.getElementById("directorName2");

    var directornumber1=document.getElementById("directornumber1");
    var directornumber2=document.getElementById("directornumber2");
    
    //Create and append select list
    var selectList1 = document.getElementById("directores1");
    var selectList2 = document.getElementById("directores2");

    //Create and append the options
    new Set(arrayDirectorOptions.sort()).forEach( element => {
        var option = document.createElement("option");
        option.value = element;
        option.text = element;
        selectList1.appendChild(option);
        
    });

    //Create and append the options
    new Set(arrayDirectorOptions.sort()).forEach( element => {
        var option = document.createElement("option");
        option.value = element;
        option.text = element;
        selectList2.appendChild(option);
        
    });

    //Default Values
    default_data=[]
    default_genres.forEach(element => {default_data.push({axis:element,value:0})});
    default_genres.forEach(element => {var_data_director1.push({axis:element,value:0})});
    default_genres.forEach(element => {var_data_director2.push({axis:element,value:0})});
    ////////////////////////////////////////////////////////////// 
    //////////////////// Draw the Chart ////////////////////////// 
    ////////////////////////////////////////////////////////////// 

    var color = d3.scale.ordinal()
        .range(["#EDC951","#00A0B0"]);
        
    var radarChartOptions = {
    w: width,
    h: height,
    margin: margin,
    maxValue: 1,
    levels: 5,
    roundStrokes: true,
    color: color
    };
    //Call function to draw the Radar chart
    RadarChart("#spiderchart", [var_data_director1,var_data_director2], radarChartOptions);
    
    d3.select("#directores1").on("change", change1)
        function change1() {
            console.log("directores1")
            director1=this.options[this.selectedIndex].value
            director2=selectList2.value
            console.log(director2)
            if(director1=="-----"){
                var_data_director1=default_data
                if(director2=="-----"){
                    RadarChart("#spiderchart", [var_data_director1,var_data_director2], radarChartOptions);
                }
                else{
                    var_data_director2=var_data_director2.filter(function (element) { return element.value != 0});
                    RadarChart("#spiderchart", [var_data_director2], radarChartOptions);
                }
                directorname1.innerHTML=''
                directornumber1.innerHTML=''
            }
            else{
                console.log(director1)
                newData = data.filter(function(d){ return eval(d.director).includes(director1)})
                console.log(newData)
                if (director2=="-----"){
                    genres= new Set()
                    newData.forEach(element =>{eval(element["genres"]).forEach(gen =>{genres.add(gen)})})
                }
                else{
                    genres=default_genres
                }
                console.log(genres)
                new_data_to_graph=[]
                genres.forEach(element => {new_data_to_graph.push({axis:element,value: newData.filter(function(d){return eval(d.genres).includes(element)}).length/newData.length})});
                console.log(new_data_to_graph)
                var_data_director1=new_data_to_graph
                if (director2=="-----"){
                    RadarChart("#spiderchart", [var_data_director1], radarChartOptions);
                }
                else{
                    RadarChart("#spiderchart", [var_data_director1,var_data_director2], radarChartOptions);

                }
                directorname1.innerHTML='<i class="fas fa-video"></i> '+ director1
                directornumber1.innerHTML='<i class="fas fa-film"></i>'+" Directed "+newData.length+" Movies"
            }
        }

    d3.select("#directores2").on("change", change2)
        function change2() {
            console.log("directores2")
            director2=this.options[this.selectedIndex].value
            director1=selectList1.value
            console.log(director1)
            if(director2=="-----"){
                var_data_director2=default_data
                if(director1=="-----"){
                    RadarChart("#spiderchart", [var_data_director1,var_data_director2], radarChartOptions);
                }
                else{
                    var_data_director1=var_data_director1.filter(function (element) { return element.value != 0});
                    RadarChart("#spiderchart", [var_data_director1], radarChartOptions);
                }
                directorname2.innerHTML=''
                directornumber2.innerHTML=''
            }
            else{
                console.log(director2)
                newData = data.filter(function(d){ return eval(d.director).includes(director2)})
                console.log(newData)
                if (director1=="-----"){
                    genres= new Set()
                    newData.forEach(element =>{eval(element["genres"]).forEach(gen =>{genres.add(gen)})})
                }
                else{
                    genres=default_genres
                }
                console.log(genres)
                new_data_to_graph=[]
                genres.forEach(element => {new_data_to_graph.push({axis:element,value: newData.filter(function(d){return eval(d.genres).includes(element)}).length/newData.length})});
                console.log(new_data_to_graph)
                var_data_director2=new_data_to_graph
                if (director1=="-----"){
                    RadarChart("#spiderchart", [var_data_director2], radarChartOptions);
                }
                else{
                    RadarChart("#spiderchart", [var_data_director2,var_data_director1], radarChartOptions);

                }
                directorname2.innerHTML='<i class="fas fa-video"></i> '+ director2
                directornumber2.innerHTML='<i class="fas fa-film"></i>'+" Directed "+newData.length+" Movies"
            }
        }
});
