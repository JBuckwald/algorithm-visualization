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
    "bubble-sort": { name: "Bubble Sort", path: "./algorithms/bubble_sort.js" },
    "quick-sort": { name: "Quick Sort", path: "./algorithms/quick_sort.js" },
    "merge-sort": { name: "Merge Sort", path: "./algorithms/merge_sort.js" }
};

const urlParams = new URLSearchParams(window.location.search);
const algorithmId = urlParams.get('algorithm') || 'bubble-sort';

let data = [];
let steps = [];
let currentStep = 0;
let isPlaying = false;
let isCodePanelOpen = false;
let playInterval = null;
let lastHighlightedLine = null;
const playIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
const pauseIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;

async function initialize() {
    const algorithm = ALGORITHMS[algorithmId];
    if (!algorithm) return;

    try {
        const algorithmModule = await import(algorithm.path);
        algorithm.generateSteps = Object.values(algorithmModule).find(fn => typeof fn === 'function');
        algorithm.code = Object.values(algorithmModule).find(arr => Array.isArray(arr));

        document.getElementById('algorithm-name').textContent = algorithm.name;
        lastHighlightedLine = null;
        currentStep = 0;
        isPlaying = false;
        generateData();
        steps = algorithm.generateSteps(data);
        renderCode(algorithm.code);
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
        data.push({ id: i, value: Math.floor(Math.random() * (config.MAX_VAL - config.MIN_VAL + 1)) + config.MIN_VAL });
    }
}

function renderCode(code) {
    codeDisplay.innerHTML = "";
    code.forEach((line, index) => {
        const lineElement = document.createElement("div");
        lineElement.id = `code-line-${index}`;
        lineElement.textContent = line || ' ';
        lineElement.classList.add("whitespace-pre");
        codeDisplay.appendChild(lineElement);
    });
}

function drawPlacingNode(placingData, dataset, recursionDepth) {
    if (!placingData) {
        svg.select(".placing-node-group").remove();
        return;
    }

    const { width, height } = svg.node().getBoundingClientRect();
    const RECURSION_Y_OFFSET = 75;
    const TOP_MARGIN = 50;

    const nodeRadius = Math.max(Math.min(width / dataset.length / 3, 30), 5);
    const xStartPosition = nodeRadius + 10;
    const xEndPosition = width - (nodeRadius + 10);
    const effectiveWidth = xEndPosition - xStartPosition;
    const nodeSpacing = dataset.length > 1 ? effectiveWidth / (dataset.length - 1) : 0;

    const startY = TOP_MARGIN + ((recursionDepth + 1) * RECURSION_Y_OFFSET);
    const startX = xStartPosition + placingData.from * nodeSpacing;
    const endY = TOP_MARGIN + (recursionDepth * RECURSION_Y_OFFSET);
    const endX = xStartPosition + placingData.to * nodeSpacing;

    svg.select(".placing-node-group").remove();
    const placingNode = svg.append("g")
        .attr("class", "placing-node-group")
        .attr("transform", `translate(${startX}, ${startY})`);

    placingNode.append("circle")
        .attr("r", nodeRadius)
        .attr("fill", "none")
        .attr("stroke", config.COLORS.swapped)
        .attr("stroke-width", 3)
        .attr("stroke-dasharray", "4 4");

    placingNode.append("text")
        .text(placingData.value)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "white")
        .style("font-size", "1rem").style("font-weight", "600");

    placingNode.transition()
        .duration(config.ANIMATION_SPEED_MS * 0.9)
        .attr("transform", `translate(${endX}, ${endY})`);
}

function drawNodes(dataset, comparing = [], swapped = [], airborne = [], sortedIndex = -1, pivotIndex = -1, finalized = [], iMarker = -1, jMarker = -1, mergeLeft = [], mergeRight = [], recursionDepth = 0, activeRange = [0, dataset.length - 1], splitLeft = [], splitRight = [], placingValue = null) {
    const { width, height } = svg.node().getBoundingClientRect();
    const RECURSION_Y_OFFSET = 75;
    const TOP_MARGIN = 50;
    const yPos = TOP_MARGIN + (recursionDepth * RECURSION_Y_OFFSET);

    const [start, end] = activeRange;
    const activeData = dataset.slice(start, end + 1);

    if (activeData.length === 0) {
        svg.selectAll(`.node-group-depth-${recursionDepth}`).remove();
        return;
    }
    
    const nodeRadius = Math.max(Math.min(width / dataset.length / 3, 30), 5);
    const xStartPosition = nodeRadius + 10;
    const xEndPosition = width - (nodeRadius + 10);
    const effectiveWidth = xEndPosition - xStartPosition;
    const nodeSpacing = dataset.length > 1 ? effectiveWidth / (dataset.length - 1) : 0;

    const nodes = svg.selectAll(`.node-group-depth-${recursionDepth}`).data(activeData, d => d.id);
    nodes.exit().remove();

    const nodeGroups = nodes.enter().append("g")
        .attr("class", `node-group node-group-depth-${recursionDepth}`)
        .attr("transform", (d, i) => `translate(${xStartPosition + dataset.findIndex(item => item.id === d.id) * nodeSpacing}, ${yPos})`);

    nodeGroups.append("circle");
    nodeGroups.append("text");

    const allGroups = nodeGroups.merge(nodes);

    allGroups.transition()
        .duration(config.ANIMATION_SPEED_MS / 2)
        .attr("transform", (d, i) => `translate(${xStartPosition + dataset.findIndex(item => item.id === d.id) * nodeSpacing}, ${yPos})`);

    allGroups.select("circle, text")
        .attr("opacity", (d, i) => (placingValue && placingValue.to === dataset.findIndex(item => item.id === d.id)) ? 0.3 : 1);

    allGroups.select("circle")
        .attr("r", nodeRadius)
        .attr("fill", (d, i) => {
            const originalIndex = dataset.findIndex(item => item.id === d.id);
            if (splitLeft && splitLeft.includes(originalIndex)) return config.COLORS.comparing;
            if (splitRight && splitRight.includes(originalIndex)) return config.COLORS.pivot;
            if (finalized && finalized.includes(originalIndex)) return config.COLORS.sorted;
            if (swapped && swapped.includes(originalIndex)) return config.COLORS.swapped;
            return config.COLORS.default;
        })
        .attr("stroke", (d, i) => (comparing && comparing.includes(dataset.findIndex(item => item.id === d.id))) ? config.COLORS.swapped : "#cbd5e1")
        .attr("stroke-width", (d, i) => (comparing && comparing.includes(dataset.findIndex(item => item.id === d.id))) ? 4 : 2);

    allGroups.select("text")
        .text(d => d.value)
        .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
        .attr("fill", "white").style("font-size", "1rem").style("font-weight", "600");
}

function drawStep(stepIndex) {
    const step = steps[stepIndex];
    if (!step) { return; }

    svg.selectAll(".node-group, .placing-node-group").remove();

    if (lastHighlightedLine) { lastHighlightedLine.classList.remove("code-highlight"); }
    const lineToHighlight = document.getElementById(`code-line-${step.highlightedCodeLine}`);
    if (lineToHighlight) {
        lineToHighlight.classList.add("code-highlight");
        lastHighlightedLine = lineToHighlight;
    }

    let maxDepthToDraw = step.recursionDepth;
    if (step.placingValue || step.mergeLeft) {
        maxDepthToDraw = step.recursionDepth + 1;
    }

    for (let depth = 0; depth <= maxDepthToDraw; depth++) {
        let stepForDepth = null;
        for (let i = stepIndex; i >= 0; i--) {
            if (steps[i].recursionDepth === depth) {
                stepForDepth = steps[i];
                break;
            }
        }

        if (stepForDepth) {
            const isCurrentStepActiveDepth = (step.recursionDepth === depth);
            const highlights = isCurrentStepActiveDepth ? step : {};
            let displayRange = [...stepForDepth.activeRange];
            const finalizedNodes = stepForDepth.finalized || [];
            if (finalizedNodes.length > 0) {
                displayRange[0] = Math.min(displayRange[0], Math.min(...finalizedNodes));
                displayRange[1] = Math.max(displayRange[1], Math.max(...finalizedNodes));
            }

            drawNodes(
                stepForDepth.data, highlights.comparing, [], [], -1, -1,
                finalizedNodes, -1, -1, highlights.mergeLeft, highlights.mergeRight,
                stepForDepth.recursionDepth, displayRange,
                stepForDepth.splitLeft, stepForDepth.splitRight,
                isCurrentStepActiveDepth ? step.placingValue : null
            );
        }
    }

    drawPlacingNode(step.placingValue, step.data, step.recursionDepth);
    statusText.textContent = `Step ${stepIndex + 1} of ${steps.length}`;
}

function stepForward() {
    if (currentStep < steps.length - 1) { currentStep++; drawStep(currentStep); updateButtonState(); } 
    else if (isPlaying) { togglePlayPause(); }
}

function stepBackward() {
    if (currentStep > 0) { currentStep--; drawStep(currentStep); updateButtonState(); }
}

function goToStart() { currentStep = 0; drawStep(currentStep); updateButtonState(); }
function goToEnd() { currentStep = steps.length - 1; drawStep(currentStep); updateButtonState(); }

function togglePlayPause() {
    isPlaying = !isPlaying;
    if (isPlaying) {
        if (currentStep === steps.length - 1) { currentStep = 0; }
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
    prevBtn.disabled = isplaying || currentStep === 0;
    nextBtn.disabled = isPlaying || currentStep === steps.length - 1;
    endBtn.disabled = isPlaying || currentStep === steps.length - 1;
}

function toggleCodePanel() {
    isCodePanelOpen = !isCodePanelOpen;
    if (isCodePanelOpen) {
        codePanel.classList.remove("w-0", "p-0");
        codePanel.classList.add("w-1/3", "p-4");
    } else {
        codePanel.classList.add("w-0", "p-0");
        codePanel.classList.remove("w-1/3", "p-4");
    }
    setTimeout(() => drawStep(currentStep), 300);
}

randomizeBtn.addEventListener("click", () => { if (isPlaying) togglePlayPause(); initialize(); });
nextBtn.addEventListener("click", stepForward);
prevBtn.addEventListener("click", stepBackward);
startBtn.addEventListener("click", goToStart);
endBtn.addEventListener("click", goToEnd);
playPauseBtn.addEventListener("click", togglePlayPause);
toggleCodeBtn.addEventListener("click", toggleCodePanel);
window.addEventListener("resize", () => drawStep(currentStep));

initialize();