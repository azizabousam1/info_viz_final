// populate selectors
d3.select('select.scoreType')
.on('change', update_map_wrapper)
.selectAll('option')
.data(['Math', 'Verbal'])
.enter()
.append('option')
.attr('value', d => d)
.text(d => d);

d3.select('select.familyIncome')
.on('change', update_map_wrapper)
.selectAll('option')
.data(['All income levels', 'Less than 20k', 'Between 20-40k', 'Between 40-60k', 'Between 60-80k', 'Between 80-100k', 'More than 100k'])
.enter()
.append('option')
.attr('value', d => d)
.text(d => d);

// let scoreType = "Total/" + d3.select('select.scoreType').property('value');
let scoreType = d3.select('select.scoreType').property('value');
var column = "";
if (d3.select('select.familyIncome').property('value') == 'All income levels') {
  column = "Total/" + scoreType;
}
else {
  column = "Family Income/" + d3.select('select.familyIncome').property('value') + "/" + scoreType
}

// The svg
const svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height");

// Map and projection
const path = d3.geoPath();
const projection = d3.geoAlbersUsa()
  .scale(1000)
  .translate([width / 2, height / 2]);

var colorScale;
// Data and color scale
const data = new Map();
if (scoreType === "Math") {
    colorScale = d3.scaleThreshold()
    .domain([420, 450, 480, 510, 540, 570, 600, 630])
    .range(d3.schemeBlues[9]);
} else {
    colorScale = d3.scaleThreshold()
    .domain([420, 450, 480, 510, 540, 570, 600, 630])
    .range(d3.schemeReds[9]);
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

  // Assuming svg is your main svg element and colorScale is your color scale
  const legend = svg.append("g")
  .attr("transform", "translate(20,20)"); // Adjust as needed

  const legendItemSize = 20; // Size of the legend item
  const legendSpacing = 5; // Spacing between legend items

  const colorDomain = colorScale.domain(); // Get the domain of the color scale
  const colorRange = colorScale.range(); // Get the range of the color scale

  colorRange.forEach(function(color, i) {
  const legendItem = legend.append("g")
    .attr("transform", `translate(0,${i * (legendItemSize + legendSpacing)})`);

  // Add the color rectangle
  legendItem.append("rect")
    .attr("width", legendItemSize)
    .attr("height", legendItemSize)
    .style("fill", color);

  // Calculate the range for this color
  const rangeMin = i === 0 ? 0 : colorDomain[i - 1];
  const rangeMax = i === 0 ? colorDomain[i] - 1 : (i < colorDomain.length - 1 ? colorDomain[i] - 1 : `${colorDomain[i - 1]}+`);

  // Add the text label
  legendItem.append("text")
    .attr("x", legendItemSize + legendSpacing)
    .attr("y", legendItemSize - legendSpacing)
    .style("font-size", "10px") // Smaller font size
    .text(`${rangeMin} - ${rangeMax}`);
});
};

// Load external data and boot
Promise.all([
d3.json("./us-states.json"),
d3.csv("./school_scores_modified.csv", function(d) { data.set(d['State/Code'], +d['Total/Math']);
})]).then(update_map);

function update_map_wrapper() {
    let scoreType = d3.select('select.scoreType').property('value');
    var column = "";
    if (d3.select('select.familyIncome').property('value') == 'All income levels') {
      column = "Total/" + scoreType;
    }
    else {
      column = "Family Income/" + d3.select('select.familyIncome').property('value') + "/" + scoreType
    }
    // scoreType = "Total/" + d3.select('select.scoreType').property('value');
    if (scoreType === "Math") {
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
        d3.csv("./school_scores_modified.csv", function(d) { data.set(d['State/Code'], +d[column]);
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
                "Math" : element["Family Income"][key]["Math"],
                "Verbal" : element["Family Income"][key]["Verbal"]
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
                .y(function(d) { return y(+d[d3.select('select.scoreType').property('value')]); })
                (d[1])
            })

    })

}