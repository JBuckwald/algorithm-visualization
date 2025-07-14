import * as d3 from "https://cdn.skypack.dev/d3";
import { config } from "./config.js";

const svg = d3.select("#chart");

// -- UI Element Selectors --
const randomizeBtn = document.getElementById("randomize-btn");
const statusText = document.getElementById("status-text");
const startBtn = document.getElementById("start-btn");
const prevBtn = document.getElementById("prev-btn");
const playPauseBtn = document.getElementById('play-pause-btn');
const nextBtn = document.getElementById("next-btn");
const endBtn = document.getElementById("end-btn");


// -- State Management --
let data = [];
let steps = [];
let currentStep = 0;
let isPlaying = false;
let playInterval = null;


// -- Core Functions --
function initialize(){
    generateData();
    bubbleSortAndGenerateSteps();
    drawNodes(data);
}

function generateData(){
    data = [];
    for (let i = 0; i < config.NODE_COUNT; i++){
        data.push({
            id: i,
            value: Math.floor(Math.random() * (config.MAX_VAL - config.MIN_VAL + 1)) + config.MIN_VAL
        });
    }
}

function bubbleSortAndGenerateSteps(){
    steps = [];
    currentStep = 0;

    let localData = JSON.parse(JSON.stringify(data));

    steps.push({
        data: [...localData],
        comparing: [],
        swapped: [],
        sortedIndex: localData.length
    });

    // -- Setup for sorting loops --
    let n = localData.length;
    let swapped;
    let sortedBoundary = n - 1;
    
    // -- Main outer loop --
    do {
        swapped = false;

        sortedBoundary--; // Shrink the unsorted part of the array.
        
    } while (swapped);
}

function drawNodes(dataset){
    const { width, height } = svg.node().getBoundingClientRect();

    // Caluculate a responsive radius so we can use it for padding.
    const nodeRadius = Math.max(Math.min(width / dataset.length / 3, 40), 0);

    // Horizontal padding so end nodes aren't cut off.
    const xStartPosition = nodeRadius + 10;
    const xEndPosition = width - (nodeRadius + 10);
    const effectiveWidth = xEndPosition - xStartPosition

    // Spacing needed between centers of nodes.
    const nodeSpacing = dataset.length > 1 ? effectiveWidth / (dataset.length - 1) : 0;

    const nodes = svg.selectAll(".node-group").data(dataset, d => d.id);

    // Create a new <g> element for each new data point.
    const nodeGroups = nodes.enter()
        .append("g")
        .attr("class", "node-group");

    nodeGroups.append("circle");
    nodeGroups.append("text");

    // Merge the new "enter" nodes with the existing "update" nodes.
    const allGroups = nodeGroups.merge(nodes);

    // Position each element.
    allGroups.attr("transform", (d, i) => `translate(${xStartPosition + i * nodeSpacing}, ${height / 2})`);

    // Style circles and add array text.
    allGroups.select("circle")
        .attr("r", nodeRadius)
        .attr("fill", config.COLORS.default);

    allGroups.select("text")
        .text(d => d.value)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "white")
        .style("font-size", "1rem")
        .style("font-weight", "600")

}



// -- Event Listeners --
randomizeBtn.addEventListener("click", initialize);

// -- Initial Load --
initialize();