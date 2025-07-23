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
const toggleCodeBtn = document.getElementById("toggle-code-btn");
const codePanel = document.getElementById("code-panel");
const codeDisplay = document.getElementById("code-display");

// --- Algorithm Registry ---
const ALGORITHMS = {
    "bubble-sort": {
        name: "Bubble Sort",
        path: "./algorithms/bubble_sort.js", // The path to the algorithm's code
        generateSteps: null, // Will be loaded dynamically
        code: null           // Will be loaded dynamically
    },

    "quick-sort": {
        name: "Quick Sort",
        path: "./algorithms/quick_sort.js",
        generateSteps: null,
        code: null
    },

    "merge-sort": {
        name: "Merge Sort",
        path: "./algorithms/merge_sort.js",
        generateSteps: null,
        code: null
    }
};

// -- Get Algorithm from URL --
const urlParams = new URLSearchParams(window.location.search);
const algorithmId = urlParams.get('algorithm') || 'bubble-sort'; // Default to bubble-sort



// -- State Management --
let data = [];
let steps = [];
let currentStep = 0;
let isPlaying = false;
let isCodePanelOpen = false;
let playInterval = null;
let lastHighlightedLine = null;
const playIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
const pauseIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;


// -- Core Functions --
async function initialize() {
    // Get algorithm details from registry
    const algorithm = ALGORITHMS[algorithmId];
    if (!algorithm) {
        console.error("Invalid algorithm ID:", algorithmId);
        statusText.textContent = "Error: Algorithm not found!";
        return;
    }

    // Dynamically import the algorithm's module
    try {
        const algorithmModule = await import(algorithm.path);

        // Find the exported function and code array from the loaded module
        algorithm.generateSteps = Object.values(algorithmModule).find(fn => typeof fn === 'function');
        algorithm.code = Object.values(algorithmModule).find(arr => Array.isArray(arr));

        // --- Use the loaded data to set up the page ---
        document.getElementById('algorithm-name').textContent = algorithm.name;
        lastHighlightedLine = null;
        currentStep = 0;
        isPlaying = false; // Reset play state

        generateData();
        steps = algorithm.generateSteps(data); // USE the loaded function
        renderCode(algorithm.code);            // USE the loaded code
        drawStep(currentStep);
        updateButtonState();

    } catch (error) {
        console.error("Failed to load algorithm module:", error);
        statusText.textContent = "Error loading algorithm.";
    }
}

function generateData() {
    data = [];
    for (let i = 0; i < config.NODE_COUNT; i++) {
        data.push({
            id: i,
            value: Math.floor(Math.random() * (config.MAX_VAL - config.MIN_VAL + 1)) + config.MIN_VAL
        });
    }
}

function renderCode(code) {
    codeDisplay.innerHTML = "";
    code.forEach((line, index) => {
        const lineElement = document.createElement("div");
        lineElement.id = `code-line-${index}`;
        lineElement.textContent = line || ' '; // Use a space for empty lines to maintain height
        lineElement.classList.add("whitespace-pre");
        codeDisplay.appendChild(lineElement);
    });
}

function drawNodes(dataset, comparing = [], swapped = [], airborne = [], sortedIndex = -1, pivotIndex = -1, finalized = [], iMarker = -1, jMarker = -1, mergeLeft = [], mergeRight = []) {
    const { width, height } = svg.node().getBoundingClientRect();

    const nodeRadius = Math.max(Math.min(width / dataset.length / 3, 40), 0);
    const xStartPosition = nodeRadius + 10;
    const xEndPosition = width - (nodeRadius + 10);
    const effectiveWidth = xEndPosition - xStartPosition;
    const nodeSpacing = dataset.length > 1 ? effectiveWidth / (dataset.length - 1) : 0;

    const nodes = svg.selectAll(".node-group").data(dataset, d => d.id);

    const nodeGroups = nodes.enter()
        .append("g")
        .attr("class", "node-group");

    nodeGroups.append("circle");
    nodeGroups.append("text");

    const allGroups = nodeGroups.merge(nodes);

    allGroups.transition()
        .duration(config.ANIMATION_SPEED_MS / 2)
        .attr("transform", (d, i) => {
            const isAirborne = airborne.includes(i);
            const yPos = isAirborne ? height / 2 - 20 : height / 2;
            return `translate(${xStartPosition + i * nodeSpacing}, ${yPos})`;
        });

    allGroups.select("circle")
        .attr("r", nodeRadius)
        .attr("stroke", "#cbd5e1")
        .attr("stroke-width", 2)
        .attr("fill", (d, i) => {
            if (mergeLeft.includes(i)) {      
                return config.COLORS.comparing; // Use yellow for left sub-array
            }
            if (mergeRight.includes(i)) {     
                return config.COLORS.pivot;     // Use purple for right sub-array
            }
            if (finalized.includes(i)) {
                return config.COLORS.sorted;
            }
            if (i === pivotIndex) {
                return config.COLORS.pivot;
            }
            if (sortedIndex > -1 && i >= sortedIndex) {
                return config.COLORS.sorted;
            }
            if (swapped.includes(i)) {
                return config.COLORS.swapped;
            }
            if (comparing.includes(i)) {
                return config.COLORS.comparing;
            }
            return config.COLORS.default;
        });

    allGroups.select("text")
        .text(d => d.value)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "white")
        .style("font-size", "1rem")
        .style("font-weight", "600");

    // --- Marker Drawing Logic ---
    const markersData = [
        { label: 'i', index: iMarker },
        { label: 'j', index: jMarker }
    ];

    const markers = svg.selectAll(".marker-text").data(markersData, d => d.label);

    const enterSelection = markers.enter()
        .append("text")
        .attr("class", "marker-text")
        .attr("text-anchor", "middle")
        .attr("font-size", "1.25rem")
        .attr("font-weight", "bold")
        .attr("fill", "#e2e8f0")
        .text(d => d.label);

    // Merge entering elements with updating elements
    const allMarkers = markers.merge(enterSelection);

    // Apply transitions to ALL markers (new and existing)
    allMarkers.transition()
        .duration(config.ANIMATION_SPEED_MS / 2)
        .attr("opacity", d => (d.index >= 0 && d.index < dataset.length) ? 1 : 0)
        .attr("transform", d => {
            const xPos = xStartPosition + d.index * nodeSpacing;
            const yPos = height / 2 - nodeRadius + 120;
            return `translate(${xPos}, ${yPos})`;
        });
}

function drawStep(stepIndex) {
    const step = steps[stepIndex];
    if (!step) {
        return;
    }

    // --- Highlighting Logic ---
    // 1. Remove highlight from the previous line
    if (lastHighlightedLine) {
        lastHighlightedLine.classList.remove("code-highlight");
    }

    // 2. Find and highlight the new line
    const lineToHighlight = document.getElementById(`code-line-${step.highlightedCodeLine}`);
    if (lineToHighlight) {
        lineToHighlight.classList.add("code-highlight");
        lastHighlightedLine = lineToHighlight; // 3. Remember this line for the next step
    }

    // --- Existing Logic ---
    drawNodes(
        step.data, 
        step.comparing, 
        step.swapped, step.airborne, 
        step.sortedIndex, step.pivotIndex, 
        step.finalized, 
        step.iMarker, 
        step.jMarker, 
        step.mergeLeft, 
        step.mergeRight);

    statusText.textContent = `Step ${stepIndex + 1} of ${steps.length}`;
}

// -- UI Control Logic --
function stepForward() {
    if (currentStep < steps.length - 1) {
        currentStep++;
        drawStep(currentStep);
        updateButtonState();
    } else if (isPlaying) {
        togglePlayPause();
    }
}

function stepBackward() {
    if (currentStep > 0) {
        currentStep--;
        drawStep(currentStep);
        updateButtonState();
    }
}

function goToStart() {
    currentStep = 0;
    drawStep(currentStep);
    updateButtonState();
}

function goToEnd() {
    currentStep = steps.length - 1;
    drawStep(currentStep);
    updateButtonState();
}

function togglePlayPause() {
    isPlaying = !isPlaying;

    if (isPlaying) {
        if (currentStep === steps.length - 1) {
            currentStep = 0;
        }
        playInterval = setInterval(stepForward, config.ANIMATION_SPEED_MS);
    } else {
        clearInterval(playInterval);
    }
    updateButtonState();
}

function updateButtonState() {
    playPauseBtn.innerHTML = isPlaying ? pauseIcon : playIcon;
    randomizeBtn.disabled = isPlaying;
    startBtn.disabled = isPlaying || currentStep === 0;
    prevBtn.disabled = isPlaying || currentStep === 0;
    nextBtn.disabled = isPlaying || currentStep === steps.length - 1;
    endBtn.disabled = isPlaying || currentStep === steps.length - 1;
}

function toggleCodePanel() {
    isCodePanelOpen = !isCodePanelOpen;

    if (isCodePanelOpen) {
        codePanel.classList.remove("w-0");
        codePanel.classList.add("w-1/3"); // Make it take up 1/3 of the width
        codePanel.classList.add("p-4"); // Add padding back
    } else {
        // Hide the panel
        codePanel.classList.add("w-0");
        codePanel.classList.remove("w-1/3");
        codePanel.classList.remove("p-4"); // Remove padding to help it collapse
    }
    setTimeout(() => {
        drawStep(currentStep);
    }, 300);
}
// -- Event Listeners --
randomizeBtn.addEventListener("click", () => {
    if (isPlaying) {
        togglePlayPause();
    }
    initialize();
});
nextBtn.addEventListener("click", stepForward);
prevBtn.addEventListener("click", stepBackward);
startBtn.addEventListener("click", goToStart);
endBtn.addEventListener("click", goToEnd);
playPauseBtn.addEventListener("click", togglePlayPause);
playPauseBtn.addEventListener("click", togglePlayPause);
toggleCodeBtn.addEventListener("click", toggleCodePanel);

window.addEventListener("resize", () => {
    drawStep(currentStep);
});

// -- Initial Load --
initialize();