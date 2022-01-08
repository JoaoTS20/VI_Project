//Set Up for Graph
var margin = {top: 100, right: 100, bottom: 100, left: 100},
    width = Math.min(550, window.innerWidth - 10) - margin.left - margin.right + 160,
    height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);
        
//Using D3 v3 version (Problem with colors using V6)
d3version3.csv("newdataset.csv", function(data) {

    //Set Data For Director 1 & 2
    var_data_director1=[]
    var_data_director2=[]
    
    //Default Genres
    var default_genres= new Set([
        'Action', 
        'TV Movie', 
        'Romance', 
        'Foreign', 
        'Comedy', 
        'Animation', 
        'Western', 
        'Drama', 
        'War', 
        'Family', 
        'Science Fiction', 
        'History', 
        'Adventure', 
        'Music', 
        'Thriller', 
        'Horror', 
        'Mystery', 
        'Fantasy', 
        'Documentary', 
        'Crime'
    ].sort());

    //Create array of options to be added
    var arrayDirectorOptions = [];
    data.forEach(element=> {
        eval(element["director"]).forEach(dire => {arrayDirectorOptions.push(dire)})
    });

    //console.log(arrayDirectorOptions)
    
    // Set Up Variables for HTML Elements
    var directorname1=document.getElementById("directorName1");
    var directorname2=document.getElementById("directorName2");

    var directornumber1=document.getElementById("directornumber1");
    var directornumber2=document.getElementById("directornumber2");

    var director1legend=document.getElementById("directorlegend1");
    var director2legend=document.getElementById("directorlegend2");
    
    //Create and append select list
    var selectList1 = document.getElementById("directores1");
    var selectList2 = document.getElementById("directores2");

    //Create and append the options to Select Dore
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

    var color = d3version3.scale.ordinal()
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
    
    //On Select Change Dir 1
    d3version3.select("#directores1").on("change", change1)
        function change1() {

            //console.log("directores1")
            director1=this.options[this.selectedIndex].value
            director2=selectList2.value

            //Adapt the graph for the different selections
            if(director1=="-----" && director2=="-----"){
                
                //Use Default Data
                var_data_director1=default_data
                var_data_director2=default_data
                
                RadarChart("#spiderchart", [var_data_director1,var_data_director2], radarChartOptions);
                
                //Update HTML elements
                directorname1.innerHTML=''
                directornumber1.innerHTML=''
                director1legend.innerHTML= ''
                director2legend.innerHTML= ''

            }
            else if(director1!="-----" && director2!="-----"){

                ////Clear Genres
                genres=[]

                newData1 = data.filter(function(d){ 
                    return eval(d.director).includes(director1)
                });

                newData2 = data.filter(function(d){ 
                    return eval(d.director).includes(director2)
                });

                //Add Genres from Director 1
                newData1.forEach(element =>{
                    eval(element["genres"]).forEach(gen =>{
                        genres.push(gen)
                    })
                });

                //Add Genres from Director 2
                newData2.forEach(element =>{
                    eval(element["genres"]).forEach(gen =>{
                        genres.push(gen)
                    })
                });

                genres=new Set(genres.sort())

                //Clear Data
                var_data_director1=[]
                var_data_director2=[]

                genres.forEach(element => {
                    var_data_director1.push({
                        axis:element,value: newData1.filter(function(d){
                            return eval(d.genres).includes(element)}).length/newData1.length
                    })
                });
                genres.forEach(element => {var_data_director2.push({
                    axis:element,value: newData2.filter(function(d){
                        return eval(d.genres).includes(element)}).length/newData2.length
                    })
                });

                RadarChart("#spiderchart", [var_data_director1,var_data_director2], radarChartOptions);

                //Update HTML elements
                directorname1.innerHTML='<i class="fas fa-video"></i> '+ director1
                directornumber1.innerHTML='<i class="fas fa-film"></i>'+" Directed "+newData1.length+" Movies"
                director1legend.innerHTML='Color: <div class="box yellow"></div>'
                director2legend.innerHTML='Color: <div class="box blue"></div>'

            }
            else if(director1=="-----" && director2!="-----"){
                
                //Clear Genres
                genres= []
                
                newData = data.filter(function(d){ 
                    return eval(d.director).includes(director2)
                });

                newData.forEach(element =>{
                    eval(element["genres"]).forEach(gen =>{
                        genres.push(gen)
                    })
                });

                genres= new Set(genres.sort())

                var_data_director2=[]

                genres.forEach(element => {
                    var_data_director2.push({
                        axis:element,value: newData.filter(function(d){
                            return eval(d.genres).includes(element)}).length/newData.length
                        })
                });

                RadarChart("#spiderchart", [var_data_director2], radarChartOptions);
                
                //Update HTML elements
                directorname1.innerHTML=''
                directornumber1.innerHTML=''
                director1legend.innerHTML=''
                director2legend.innerHTML='Color: <div class="box yellow"></div>'
            }
            else if(director1!="-----" && director2=="-----"){
                
                //Clear Genres
                genres= []
                
                newData = data.filter(function(d){ 
                    return eval(d.director).includes(director1)
                });
                
                newData.forEach(element =>{
                    eval(element["genres"]).forEach(gen =>{
                        genres.push(gen)
                    })
                });

                genres= new Set(genres.sort())

                //Clear Data
                var_data_director1=[]

                genres.forEach(element => {
                    var_data_director1.push({
                        axis:element,value: newData.filter(function(d){
                            return eval(d.genres).includes(element)}).length/newData.length
                    })
                });
                
                RadarChart("#spiderchart", [var_data_director1], radarChartOptions);
                
                //Update HTML elements
                directorname1.innerHTML='<i class="fas fa-video"></i> '+ director1
                directornumber1.innerHTML='<i class="fas fa-film"></i>'+" Directed "+newData.length+" Movies"
                director1legend.innerHTML='Color: <div class="box yellow"></div>'
            }
        }
    
    //On Select Change Dir 2
    d3version3.select("#directores2").on("change", change2)
        function change2() {

            //console.log("directores2")
            director2=this.options[this.selectedIndex].value
            director1=selectList1.value

            //Adapt the Graph for the different selections
            if(director1=="-----" && director2=="-----"){
                
                //Use Default Data
                var_data_director1=default_data
                var_data_director2=default_data

                RadarChart("#spiderchart", [var_data_director1,var_data_director2], radarChartOptions);

                //Update HTML elements
                directorname2.innerHTML=''
                directornumber2.innerHTML=''
                director2legend.innerHTML=''

            }
            else if(director1!="-----" && director2!="-----"){

                //Clear Genres
                genres=[]

                newData1 = data.filter(function(d){ 
                    return eval(d.director).includes(director1)
                });

                newData2 = data.filter(function(d){ 
                    return eval(d.director).includes(director2)
                });


                //Add Genres from Director 1
                newData1.forEach(element =>{
                    eval(element["genres"]).forEach(gen =>{
                        genres.push(gen)
                    })
                });

                //Add Genres from Director 2
                newData2.forEach(element =>{
                    eval(element["genres"]).forEach(gen =>{
                        genres.push(gen)
                    })
                });

                genres=new Set(genres.sort())

                var_data_director1=[]
                var_data_director2=[]

                genres.forEach(element => {var_data_director1.push({
                    axis:element,value: newData1.filter(function(d){
                        return eval(d.genres).includes(element)}).length/newData1.length
                    })
                });

                genres.forEach(element => {var_data_director2.push({
                    axis:element,value: newData2.filter(function(d){
                        return eval(d.genres).includes(element)}).length/newData2.length
                    })
                });

                RadarChart("#spiderchart", [var_data_director1,var_data_director2], radarChartOptions);

                //Update HTML elements
                directorname2.innerHTML='<i class="fas fa-video"></i> '+ director2
                directornumber2.innerHTML='<i class="fas fa-film"></i>'+" Directed "+newData2.length+" Movies"
                director2legend.innerHTML='Color: <div class="box blue"></div>'

            }
            else if(director1=="-----" && director2!="-----"){

                //Clear Genres
                genres= []

                newData = data.filter(function(d){ 
                    return eval(d.director).includes(director2)
                });

                newData.forEach(element =>{
                    eval(element["genres"]).forEach(gen =>{
                        genres.push(gen)
                    })
                });

                genres= new Set(genres.sort())

                var_data_director2=[]
                
                genres.forEach(element => {
                    var_data_director2.push({
                        axis:element,value: newData.filter(function(d){
                            return eval(d.genres).includes(element)}).length/newData.length
                    })
                });
                
                RadarChart("#spiderchart", [var_data_director2], radarChartOptions);

                //Update HTML elements
                directorname2.innerHTML='<i class="fas fa-video"></i> '+ director2
                directornumber2.innerHTML='<i class="fas fa-film"></i>'+" Directed "+newData.length+" Movies"
                director2legend.innerHTML='Color: <div class="box yellow"></div>'
                directorname1.innerHTML=''
                directornumber1.innerHTML=''
            }
            else if(director1!="-----" && director2=="-----"){

                //Clear Genres
                genres= []

                newData = data.filter(function(d){ 
                    return eval(d.director).includes(director1)
                });

                newData.forEach(element =>{
                    eval(element["genres"]).forEach(gen =>{
                        genres.push(gen)
                    })
                });

                genres= new Set(genres.sort())

                //Clear Data
                var_data_director1=[]
                
                genres.forEach(element => {
                    var_data_director1.push({
                        axis:element,value: newData.filter(function(d){
                            return eval(d.genres).includes(element)}).length/newData.length
                    })
                });
                
                RadarChart("#spiderchart", [var_data_director1], radarChartOptions);

                //Update HTML elements
                directorname2.innerHTML=''
                directornumber2.innerHTML=''
                director1legend.innerHTML='Color: <div class="box yellow"></div>'
                director2legend.innerHTML=''
            }
        }
});
