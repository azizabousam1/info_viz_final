// populate selectors
d3.select('select.scoreType')
.on('change', update_map_wrapper)
.selectAll('option')
.data(['Math', 'Verbal'])
.enter()
.append('option')
.attr('value', d => d)
.text(d => d);

let scoreType = "Total/" + d3.select('select.scoreType').property('value');
// The svg
const svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height");

// Map and projection
const path = d3.geoPath();
const projection = d3.geoMercator()
  .scale(180)
  .center([-40,25])
  .translate([width, height / 1.2]);

var colorScale;
// Data and color scale
const data = new Map();
if (scoreType === "Total/Math") {
    colorScale = d3.scaleThreshold()
    .domain([420, 460, 500, 540, 580, 620])
    .range(d3.schemeBlues[7]);
} else {
    colorScale = d3.scaleThreshold()
    .domain([420, 460, 500, 540, 580, 620])
    .range(d3.schemeReds[7]);
}

var update_map = function(loadData) {
    let topo = loadData[0]

    let mouseOver = function(d) {
    d3.selectAll(".State")
      .transition()
      .duration(200)
      .style("opacity", .5)
    d3.select(this)
      .transition()
      .duration(200)
      .style("opacity", 1)
      .style("stroke", "black")
  }

  let mouseLeave = function(d) {
    d3.selectAll(".State")
      .transition()
      .duration(200)
      .style("opacity", .8)
    d3.select(this)
      .transition()
      .duration(200)
      .style("stroke", "transparent")
  }

  let clickEvent = function(d) {
    update_line(d['srcElement']['__data__']['id']);
  }

  // Draw the map
  svg.append("g")
    .selectAll("path")
    .data(topo.features)
    .enter()
    .append("path")
      // draw each country
      .attr("d", d3.geoPath()
        .projection(projection)
      )
      // set the color of each country
      .attr("fill", function (d) {
        d.total = data.get(d.id) || 0;
        return colorScale(d.total);
      })
      .style("stroke", "transparent")
      .attr("class", function(d){ return "State" } )
      .style("opacity", .8)
      .on("mouseover", mouseOver )
      .on("mouseleave", mouseLeave )
      .on("click", clickEvent)

};

// Load external data and boot
Promise.all([
d3.json("./us-states.json"),
d3.csv("./school_scores_modified.csv", function(d) { data.set(d['State/Code'], +d['Total/Math']);
})]).then(update_map);

function update_map_wrapper() {
    scoreType = "Total/" + d3.select('select.scoreType').property('value');
    if (scoreType === "Total/Math") {
        colorScale = d3.scaleThreshold()
        .domain([420, 450, 480, 510, 540, 570, 600, 630])
        .range(d3.schemeBlues[9]);
    } else {
        colorScale = d3.scaleThreshold()
        .domain([420, 450, 480, 510, 540, 570, 600, 630])
        .range(d3.schemeReds[9]);
    }
    line_chart_div = document.getElementById("line_dataviz");
    line_chart_div.innerHTML = "";
    Promise.all([
        d3.json("./us-states.json"),
        d3.csv("./school_scores_modified.csv", function(d) { data.set(d['State/Code'], +d[scoreType]);
        })]).then(update_map);
}



function update_line(selected_state) {

    // set the dimensions and margins of the graph
    const margin = {top: 10, right: 30, bottom: 30, left: 60},
    line_width = 460 - margin.left - margin.right,
    line_height = 400 - margin.top - margin.bottom;

    line_chart_div = document.getElementById("line_dataviz");
    line_chart_div.innerHTML = "";

    // append the svg object to the body of the page
    const line_svg = d3.select("#line_dataviz")
    .append("h3")
    .text(d3.select('select.scoreType').property('value') +" Scores by Family Income Range in " + selected_state)
    .append("svg")
    .attr("width", line_width + margin.left + margin.right)
    .attr("height", line_height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

    //Read the data
    d3.json("./school_scores.json").then( function(data) {

    var family_income_data = [];
    const state_filtered_data = data.filter(d => d.State.Code === selected_state);
    state_filtered_data.forEach(element => {
        Object.keys(element["Family Income"]).forEach(key => {
            family_income_data.push({
                "Year": element["Year"],
                "Income Range": key,
                "Math" : element["Family Income"][key]["Math"]
            });
        })
    });
    // group the data: I want to draw one line per group
    const sumstat = d3.group(family_income_data, d => d["Income Range"]); // nest function allows to group the calculation per level of a factor
    console.log(sumstat);
    // Add X axis --> it is a date format
    const x = d3.scaleLinear()
        .domain([2004, 2015])
        .range([ 0, line_width ]);
    line_svg.append("g")
        .attr("transform", `translate(0, ${line_height})`)
        .call(d3.axisBottom(x).ticks(5));

    // Add Y axis
    const y = d3.scaleLinear()
        .domain([300, 700])
        .range([ line_height, 0 ]);
    line_svg.append("g")
        .call(d3.axisLeft(y));

    // color palette
    const color = d3.scaleOrdinal()
        .range(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#a65628','#f781bf','#999999'])

    // Draw the line
    line_svg.selectAll(".line")
        .data(sumstat)
        .join("path")
            .attr("fill", "none")
            .attr("stroke", function(d){ return color(d[0]) })
            .attr("stroke-width", 1.5)
            .attr("d", function(d){
            return d3.line()
                .x(function(d) { return x(d["Year"]); })
                .y(function(d) { return y(+d["Math"]); })
                (d[1])
            })

    })

}