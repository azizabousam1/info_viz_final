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
      .on("end", function() {
        d3.select(this)
          .style("stroke", "transparent");
      });
    d3.select(this)
      .transition()
      .duration(200)
      .style("stroke", "transparent")
  }

  let clickEvent = function(d) {
    update_line(d['srcElement']['__data__']['properties']);
    update_rankings(d['srcElement']['__data__']['properties']);
    update_comparison(d['srcElement']['__data__']['properties']);
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
        d.total = data.get(d.properties.NAME) || 0;
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
d3.csv("./school_scores_modified.csv", function(d) { data.set(d['State/Name'], +d['Total/Math']);
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
    // line_chart_div = document.getElementById("line_dataviz");
    // line_chart_div.innerHTML = "";
    Promise.all([
        d3.json("./us-states.json"),
        d3.csv("./school_scores_modified.csv", function(d) { data.set(d['State/Name'], +d[column]);
        })]).then(update_map);
}



function update_line(selected_state) {

    // set the dimensions and margins of the graph
    const margin = {top: 10, right: 30, bottom: 100, left: 60},
    line_width = 460 - margin.left - margin.right,
    line_height = 400 - margin.top - margin.bottom;

    line_chart_div = document.getElementById("line_dataviz");
    line_chart_div.innerHTML = "";

    // append the svg object to the body of the page
    const line_svg = d3.select("#line_dataviz")
    .append("h3")
    .text("Math" +" Scores by Family Income Range in " + selected_state.NAME)
    .append("svg")
    .attr("width", line_width + margin.left + margin.right)
    .attr("height", line_height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

    const line_svg2 = d3.select("#line_dataviz")
    .append("h3")
    .text("Verbal" +" Scores by Family Income Range in " + selected_state.NAME)
    .append("svg")
    .attr("width", line_width + margin.left + margin.right)
    .attr("height", line_height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

    //Read the data
    d3.json("./school_scores.json").then( function(data) {

        var family_income_data = [];
        const state_filtered_data = data.filter(d => d.State.Name === selected_state.NAME);
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
        // console.log(sumstat);
        // Add X axis --> it is a date format
        const x = d3.scaleLinear()
            .domain([2005, 2015])
            .range([ 0, line_width ]);
        line_svg.append("g")
            .attr("transform", `translate(0, ${line_height})`)
            .call(d3.axisBottom(x).ticks(5));

        // console.log(Math.min(...+family_income_data["Verbal"], ...+family_income_data["Math"]))
        const minValueMath = Math.min(...family_income_data.map(obj => obj.Math));
        const maxValueMath = Math.min(...family_income_data.map(obj => obj.Math));
        const minValueVerbal = Math.max(...family_income_data.map(obj => obj.Verbal));
        const maxValueVerbal = Math.max(...family_income_data.map(obj => obj.Verbal));
        // Add Y axis
        const y = d3.scaleLinear()
            .domain([Math.min(minValueMath, minValueVerbal), Math.max(maxValueMath, maxValueVerbal)])
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

                line_svg2.append("g")
                .attr("transform", `translate(0, ${line_height})`)
                .call(d3.axisBottom(x).ticks(5));
        
        line_svg2.append("g")
            .call(d3.axisLeft(y));
    
        line_svg2.selectAll(".line")
            .data(sumstat)
            .join("path")
            .attr("fill", "none")
            .attr("stroke", function(d){ return color(d[0]) })
            .attr("stroke-width", 1.5)
            .attr("d", function(d){
            return d3.line()
                .x(function(d) { return x(d["Year"]); })
                .y(function(d) { return y(+d["Verbal"]); })
                (d[1])
            })

    })

    // Add X axis label
    line_svg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", `translate(${line_width / 2}, ${line_height + margin.top + 30})`) // Adjust position as needed
    .text("Year");

    // Add Y axis label
    line_svg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", -line_height / 2)
    .text("Score"); // Change text as needed

    // Add X axis label
    line_svg2.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", `translate(${line_width / 2}, ${line_height + margin.top + 30})`) // Adjust position as needed
    .text("Year");

    // Add Y axis label
    line_svg2.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", -line_height / 2)
    .text("Score"); // Change text as needed


}

function update_rankings(selected_state) {
  // set the dimensions and margins of the graph
  const margin = {top: 10, right: 30, bottom: 100, left: 60},
  line_width = 460 - margin.left - margin.right,
  line_height = 400 - margin.top - margin.bottom;

  line_chart_div = document.getElementById("state_rankings");
  line_chart_div.innerHTML = "";

  // Assume 'data' contains your JSON data
  Promise.all([
    d3.json("./school_scores_modified.json"),
    d3.csv("./us_states_naep_standards.csv")
  ]).then(function([data, naepDataCSV]) {

    // Sort the data by test-takers
    const testTakersSorted = data.slice().sort((a, b) => b.Total["Test-takers"] - a.Total["Test-takers"]);

    // Find the rank of the specific state in test-takers
    const stateTestTakersRank = testTakersSorted.findIndex(d => d.State.Name === selected_state.NAME) + 1;

    // Sort the data by math score
    const mathScoreSorted = data.slice().sort((a, b) => b.Total.Math - a.Total.Math);

    // Find the rank of the specific state in math score
    const stateMathScoreRank = mathScoreSorted.findIndex(d => d.State.Name === selected_state.NAME) + 1;

    // Sort the data by verbal score
    const verbalScoreSorted = data.slice().sort((a, b) => b.Total.Verbal - a.Total.Verbal);

    // Find the rank of the specific state in verbal score
    const stateVerbalScoreRank = verbalScoreSorted.findIndex(d => d.State.Name === selected_state.NAME) + 1;

    // Calculate total score (math + verbal) and sort the data by total score
    const totalScoreSorted = data.slice().sort((a, b) => (b.Total.Math + b.Total.Verbal) - (a.Total.Math + a.Total.Verbal));

    // Find the rank of the specific state in total score
    const stateTotalScoreRank = totalScoreSorted.findIndex(d => d.State.Name === selected_state.NAME) + 1;


    // Output the ranks
    // console.log("Test-takers rank:", stateTestTakersRank);
    // console.log("Math score rank:", stateMathScoreRank);
    // console.log("Verbal score rank:", stateVerbalScoreRank);
    // console.log("Total score rank:", stateTotalScoreRank);

    const container = d3.select("#state_rankings");

    var boxData = [
      { label: "Total test-takers rank", value: stateTestTakersRank },
      { label: "Math score rank", value: stateMathScoreRank },
      { label: "Verbal score rank", value: stateVerbalScoreRank },
      { label: "Total score rank", value: stateTotalScoreRank }
    ];

    // Find the NAEP standard of the specific state
    let stateStandardsData = naepDataCSV.filter(d => d.State === selected_state.NAME)[0];
    if (stateStandardsData["Grade 4 Reading"] != "") {
        boxData.push({ label: "Grade 4 Reading", value: stateStandardsData["Grade 4 Reading"] });
    }
    if (stateStandardsData["Grade 4 Math"] != "") {
        boxData.push({ label: "Grade 4 Math", value: stateStandardsData["Grade 4 Math"] });
    }
    if (stateStandardsData["Grade 8 Reading"] != "") {
        boxData.push({ label: "Grade 8 Reading", value: stateStandardsData["Grade 8 Reading"] });
    }
    if (stateStandardsData["Grade 8 Math"] != "") {
        boxData.push({ label: "Grade 8 Math", value: stateStandardsData["Grade 8 Math"] });
    }
    console.log(boxData);
    
    // Append a <div> for each box
    const boxes = container.selectAll(".box")
      .data(boxData)
      .enter()
      .append("div")
      .attr("class", "box")
      .html(d => `<span class="label">${d.label}</span><span class="value">${d.value}</span>`);

    
  });

  
}

function update_comparison(selected_state) {
  // set the dimensions and margins of the graph

  line_chart_div = document.getElementById("national_comparison");
  line_chart_div.innerHTML = "";

  d3.json("./school_scores_modified.json").then(function(data) {
    // Initialize a map to store the average Math + Verbal for each type of income
    // Function to calculate the total score (Math + Verbal) for a given income type and state object
    const calculateTotalScore = (stateObject, incomeType) => {
      const income = stateObject["Family Income"][incomeType];
      return income.Math + income.Verbal;
    };

    // Function to calculate the nation average for each income type
    const calculateNationAverage = () => {
      const incomeAverageMap = new Map();
    
      data.forEach(obj => {
        Object.keys(obj["Family Income"]).forEach(incomeType => {
          const income = obj["Family Income"][incomeType];
          const totalScore = income.Math + income.Verbal;
          const testTakers = income["Test-takers"];
    
          if (incomeAverageMap.has(incomeType)) {
            const currentTotalScore = incomeAverageMap.get(incomeType).totalScore;
            const currentTotalTestTakers = incomeAverageMap.get(incomeType).totalTestTakers;
            incomeAverageMap.set(incomeType, {
              totalScore: currentTotalScore + (totalScore * testTakers),
              totalTestTakers: currentTotalTestTakers + testTakers
            });
          } else {
            incomeAverageMap.set(incomeType, {
              totalScore: totalScore * testTakers,
              totalTestTakers: testTakers
            });
          }
        });
      });
    
      const result = {};
      incomeAverageMap.forEach((value, key) => {
        result[key] = value.totalScore / value.totalTestTakers;
      });
    
      return result;
    };

    // Function to create the new map with income type, nation average, and state total score
    const createNewMap = (stateName) => {
      const stateObject = data.find(obj => obj.State.Name === stateName);
      if (!stateObject) {
        console.log("State not found in the JSON object.");
        return;
      }

      const nationAverage = calculateNationAverage();
      const stateTotalScoreMap = new Map();

      Object.keys(stateObject["Family Income"]).forEach(incomeType => {
        const totalScore = calculateTotalScore(stateObject, incomeType);
        stateTotalScoreMap.set(incomeType, [nationAverage[incomeType], totalScore]);
      });

      return stateTotalScoreMap;
    };
    const resultMap = createNewMap(selected_state.NAME);
    const dataMap = Object.fromEntries([...resultMap]);

    // console.log("Result Map:", data);

    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Append SVG to the chart element
    const svg = d3.select("#national_comparison")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

    // X scale
    const x = d3.scaleBand()
    .domain(Object.keys(dataMap))
    .range([0, width])
    .padding(0.2);

    // Y scale
    const y = d3.scaleLinear()
    .domain([0, d3.max(Object.values(dataMap).flat()) + 200])
    .range([height, 0]);


    // Draw bars
    svg.selectAll(".bar1")
    .data(Object.entries(dataMap))
    .enter().append("rect")
    .attr("class", "bar1")
    .attr("x", d => x(d[0]))
    .attr("y", d => y(d[1][0]))
    .attr("width", x.bandwidth() / 2)
    .attr("height", d => height - y(d[1][0]))
    .attr("fill", "steelblue");

    svg.selectAll(".bar2")
    .data(Object.entries(dataMap))
    .enter().append("rect")
    .attr("class", "bar2")
    .attr("x", d => x(d[0]) + x.bandwidth() / 2)
    .attr("y", d => y(d[1][1]))
    .attr("width", x.bandwidth() / 2)
    .attr("height", d => height - y(d[1][1]))
    .attr("fill", "orange");

    // X axis
    svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

    // Y axis
    svg.append("g")
    .call(d3.axisLeft(y));

    // Legend
    const legend = svg.append("g")
    .attr("transform", `translate(${width - 150}, ${margin.top - 20})`); // Adjust position of legend

    legend.append("rect")
      .attr("width", 20)
      .attr("height", 20)
      .attr("fill", "steelblue");

    legend.append("text")
      .attr("x", 30)
      .attr("y", 10)
      .text("National Avg");

    legend.append("rect")
      .attr("y", 30) // Adjust y position to stack below the first rect
      .attr("width", 20)
      .attr("height", 20)
      .attr("fill", "orange");

    legend.append("text")
      .attr("x", 30)
      .attr("y", 40) // Adjust y position to stack below the first text
      .text("State Avg");
  });
}