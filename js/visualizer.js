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


// -- State Management --
let data = [];
let steps = [];
let currentStep = 0;
let isPlaying = false;
let isCodePanelOpen = false;
let playInterval = null;
const playIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
const pauseIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;

// -- Psuedo Code for Code Box
const bubbleSortPseudocode = [
    "procedure bubbleSort( A : list of sortable items )",
    "  n = length(A)",
    "  repeat",
    "    swapped = false",
    "    for i = 1 to n-1 inclusive do",
    "      if A[i-1] > A[i] then",
    "        swap(A[i-1], A[i])",
    "        swapped = true",
    "      end if",
    "    end for",
    "    n = n - 1",
    "  until not swapped",
    "end procedure"
];

// -- Core Functions --
function initialize() {
    generateData();
    bubbleSortAndGenerateSteps();
    drawStep(currentStep);
    updateButtonState();
    renderCode(bubbleSortPseudocode);
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

function bubbleSortAndGenerateSteps() {
    steps = [];
    currentStep = 0;

    let localData = JSON.parse(JSON.stringify(data));

    steps.push({
        data: [...localData],
        comparing: [],
        swapped: [],
        airborne: [],
        sortedIndex: localData.length
    });

    let n = localData.length;
    let swapped;
    let sortedBoundary = n - 1;

    do {
        swapped = false;

        for (let i = 0; i < sortedBoundary; i++) {
            steps.push({
                data: [...localData],
                comparing: [i, i + 1],
                swapped: [],
                airborne: [],
                sortedIndex: sortedBoundary
            });

            if (localData[i].value > localData[i + 1].value) {
                steps.push({
                    data: [...localData],
                    comparing: [],
                    swapped: [i, i + 1],
                    airborne: [i, i + 1],
                    sortedIndex: sortedBoundary
                });

                [localData[i], localData[i + 1]] = [localData[i + 1], localData[i]];
                swapped = true;

                steps.push({
                    data: [...localData],
                    comparing: [],
                    swapped: [i, i + 1],
                    airborne: [i, i + 1],
                    sortedIndex: sortedBoundary
                });

                steps.push({
                    data: [...localData],
                    comparing: [],
                    swapped: [],
                    airborne: [],
                    sortedIndex: sortedBoundary
                });
            }
        } 

        sortedBoundary--; 

    } while (swapped);

    steps.push({
        data: [...localData],
        comparing: [],
        swapped: [],
        airborne: [],
        sortedIndex: -1
    });
}

function drawNodes(dataset, comparing = [], swapped = [], airborne = [], sortedIndex = -1) {
    const { width, height } = svg.node().getBoundingClientRect();

    const nodeRadius = Math.max(Math.min(width / dataset.length / 3, 40), 0);
    const xStartPosition = nodeRadius + 10;
    const xEndPosition = width - (nodeRadius + 10);
    const effectiveWidth = xEndPosition - xStartPosition
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
            if (sortedIndex === -1 || i >= sortedIndex) {
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
}

function drawStep(stepIndex) {
    const step = steps[stepIndex];

    if (!step) {
        return;
    }

    drawNodes(step.data, step.comparing, step.swapped, step.airborne, step.sortedIndex);
    statusText.textContent = `Step ${stepIndex + 1} of ${steps.length}`;
}

function renderCode(code) {
    codeDisplay.innerHTML = "";

    code.forEach((line, index) => {
        const lineElement = document.createElement("div");
        lineElement.id = `code-line-${index}`;
        lineElement.textContent = line;
        codeDisplay.appendChild(lineElement);
    });
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