import * as d3 from "https://cdn.skypack.dev/d3";
import { config } from "./config.js";

const svg = d3.select("#chart");

// -- UI Element Selectors --
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
let isCodePanelOpen = true;
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

    for (let i = 0; i < config.DATA.length; i++) {
        data.push({ id: i, value: config.DATA[i] });
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


// -- Merge Sort Drawing Functions --

function drawMergeSortNodes(dataset, comparing = [], swapped = [], airborne = [], sortedIndex = -1, pivotIndex = -1, finalized = [], iMarker = -1, jMarker = -1, mergeLeft = [], mergeRight = [], recursionDepth = 0, activeRange = [0, dataset.length - 1], splitLeft = [], splitRight = [], placingValue = null) {
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

    allGroups.selectAll("circle, text")
        .attr("opacity", (d, i) => (placingValue && placingValue.to === dataset.findIndex(item => item.id === d.id)) ? 0 : 1);

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
        .attr("stroke", (d, i) => (comparing && comparing.includes(dataset.findIndex(item => item.id === d.id))) ? config.COLORS.swapped : "#ffffff")
        .attr("stroke-width", (d, i) => (comparing && comparing.includes(dataset.findIndex(item => item.id === d.id))) ? 4 : 2); 

    allGroups.select("text")
        .text(d => d.value)
        .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
        .attr("fill", "white").style("font-size", "1rem").style("font-weight", "600");
}

function drawMergeSortPlacingNode(placingData, dataset, recursionDepth) {
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

function drawMergeSortSnapshotNodes(snapshot) {
    if (!snapshot) return;

    const { data, range, depth } = snapshot;
    const { width, height } = svg.node().getBoundingClientRect();
    const RECURSION_Y_OFFSET = 75;
    const TOP_MARGIN = 50;
    const yPos = TOP_MARGIN + (depth * RECURSION_Y_OFFSET);
    
    const nodeRadius = Math.max(Math.min(width / config.NODE_COUNT / 3, 30), 5);
    const xStartPosition = nodeRadius + 10;
    const xEndPosition = width - (nodeRadius + 10);
    const effectiveWidth = xEndPosition - xStartPosition;
    const nodeSpacing = config.NODE_COUNT > 1 ? effectiveWidth / (config.NODE_COUNT - 1) : 0;

    // Use a unique class to prevent interference with other nodes
    const snapshotGroups = svg.selectAll(".snapshot-node-group")
        .data(data, d => d.id)
        .enter()
        .append("g")
        .attr("class", "snapshot-node-group")
        .attr("transform", (d, i) => `translate(${xStartPosition + (range[0] + i) * nodeSpacing}, ${yPos})`);

    snapshotGroups.append("circle")
        .attr("r", nodeRadius)
        .attr("fill", config.COLORS.sorted) // Always color these as "sorted"
        .attr("stroke", "#ffffff")      
        .attr("stroke-width", 2);

    snapshotGroups.append("text")
        .text(d => d.value)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "white")
        .style("font-size", "1rem")
        .style("font-weight", "600");
}

function drawMergeSortStep(step, stepIndex, allSteps) {
    svg.selectAll(".node-group, .placing-node-group, .snapshot-node-group").remove();

    let activeSnapshots = {};
    if (stepIndex < allSteps.length - 1) {
        for (let i = 0; i <= stepIndex; i++) {
            const historicalStep = allSteps[i];
            if (historicalStep.snapshot) {
                const newSnapshot = historicalStep.snapshot;
                for (const key in activeSnapshots) {
                    const existingSnap = activeSnapshots[key];
                    if (existingSnap.range[0] >= newSnapshot.range[0] && existingSnap.range[1] <= newSnapshot.range[1]) {
                        delete activeSnapshots[key];
                    }
                }
                activeSnapshots[newSnapshot.range.join('-')] = newSnapshot;
            }
        }
        Object.values(activeSnapshots).forEach(s => drawMergeSortSnapshotNodes(s));
    }

    let maxDepthToDraw = step.recursionDepth;
    if (step.placingValue || step.mergeLeft) {
        maxDepthToDraw = step.recursionDepth + 1;
    }

    for (let depth = 0; depth <= maxDepthToDraw; depth++) {
        let stepForDepth = null;
        for (let i = stepIndex; i >= 0; i--) {
            if (allSteps[i].recursionDepth === depth) {
                stepForDepth = allSteps[i];
                break;
            }
        }

        if (stepForDepth) {
            const [start, end] = stepForDepth.activeRange;
            const isCoveredBySnapshot = Object.values(activeSnapshots).some(snap =>
                start >= snap.range[0] && end <= snap.range[1]
            );
            const isPlacingOnThisLevel = step.placingValue && step.recursionDepth === depth;

            if (isCoveredBySnapshot && !isPlacingOnThisLevel) {
                svg.selectAll(`.node-group-depth-${depth}`).remove();
                continue;
            }

            const isCurrentStepActiveDepth = (step.recursionDepth === depth);
            const highlights = isCurrentStepActiveDepth ? step : {};
            let displayRange = [...stepForDepth.activeRange];
            const finalizedNodes = stepForDepth.finalized || [];
            if (finalizedNodes.length > 0) {
                displayRange[0] = Math.min(displayRange[0], Math.min(...finalizedNodes));
                displayRange[1] = Math.max(displayRange[1], Math.max(...finalizedNodes));
            }

            drawMergeSortNodes(
                stepForDepth.data, highlights.comparing, [], [], -1, -1,
                finalizedNodes, -1, -1, highlights.mergeLeft, highlights.mergeRight,
                stepForDepth.recursionDepth, displayRange,
                stepForDepth.splitLeft, stepForDepth.splitRight,
                isCurrentStepActiveDepth ? step.placingValue : null
            );
        }
    }
    drawMergeSortPlacingNode(step.placingValue, step.data, step.recursionDepth);
}


//  -- Bubble Sort Drawing Functions --

function drawBubbleSortStep(step) {
    const { data, comparing, swapped, sortedIndex } = step;
    const { width } = svg.node().getBoundingClientRect();
    const nodeRadius = Math.max(Math.min(width / data.length / 3, 30), 5);
    const xStartPosition = nodeRadius + 10;
    const xEndPosition = width - (nodeRadius + 10);
    const effectiveWidth = xEndPosition - xStartPosition;
    const nodeSpacing = data.length > 1 ? effectiveWidth / (data.length - 1) : 0;
    const yPos = 100;

    // 1. DATA BINDING: Use the key function d => d.id to track nodes across steps.
    const nodes = svg.selectAll(".node-group").data(data, d => d.id);

    // 2. EXIT: Remove nodes that are no longer present in the data.
    nodes.exit().remove();

    // 3. ENTER: Create new <g> elements for new data points.
    const nodeGroups = nodes.enter().append("g")
        .attr("class", "node-group")
        // CRITICAL: Set the initial position of new nodes so they don't fly in.
        .attr("transform", (d, i) => `translate(${xStartPosition + i * nodeSpacing}, ${yPos})`);

    // Add visuals to the new groups.
    nodeGroups.append("circle");
    nodeGroups.append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle");

    // 4. MERGE: Combine entering nodes and existing nodes into one selection.
    const allGroups = nodeGroups.merge(nodes);

    // 5. TRANSITION: Animate all nodes to their new positions.
    allGroups.transition()
        .duration(config.ANIMATION_SPEED_MS / 2)
        .attr("transform", (d, i) => `translate(${xStartPosition + i * nodeSpacing}, ${yPos})`);

    // 6. STYLING: Update styles for all nodes in the selection.
    allGroups.select("circle")
        .attr("r", nodeRadius)
        .attr("fill", (d, i) => {
            if (i >= sortedIndex) return config.COLORS.sorted;
            if (swapped.includes(i)) return config.COLORS.swapped;
            if (comparing.includes(i)) return config.COLORS.comparing;
            return config.COLORS.default;
        })
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2);

    allGroups.select("text")
        .text(d => d.value)
        .attr("fill", "white")
        .style("font-size", "1rem")
        .style("font-weight", "600");
}


// -- Quick Sort Drawing Functions --

function drawQuickSortStep(step) {
    svg.selectAll("*").remove();

    let activeSnapshots = {};
    for (let i = 0; i <= steps.indexOf(step); i++) {
        const historicalStep = steps[i];
        if (historicalStep.snapshot) {
            const newSnapshot = historicalStep.snapshot;
            for (const key in activeSnapshots) {
                const existingSnap = activeSnapshots[key];
                if (existingSnap.range[0] >= newSnapshot.range[0] && existingSnap.range[1] <= newSnapshot.range[1]) {
                    delete activeSnapshots[key];
                }
            }
            activeSnapshots[newSnapshot.range.join('-')] = newSnapshot;
        }
    }
    Object.values(activeSnapshots).forEach(s => drawQuickSortSnapshotNodes(s));

    const recursionDepth = step.recursionDepth;
    for (let depth = 0; depth <= recursionDepth; depth++) {
        let stepForDepth = null;
        for (let i = steps.indexOf(step); i >= 0; i--) {
            if (steps[i].recursionDepth === depth) {
                stepForDepth = steps[i];
                break;
            }
        }

        if (stepForDepth) {
            const { data, activeRange, pivotIndex, iMarker, jMarker, comparing, swapped, finalized } = stepForDepth;

            const isCovered = Object.values(activeSnapshots).some(snap =>
                activeRange[0] >= snap.range[0] && activeRange[1] <= snap.range[1]
            );
            if (isCovered) continue;

            const { width } = svg.node().getBoundingClientRect();
            const nodeRadius = Math.max(Math.min(width / data.length / 3, 30), 5);
            const xStartPosition = nodeRadius + 10;
            const effectiveWidth = width - 2 * xStartPosition;
            const nodeSpacing = data.length > 1 ? effectiveWidth / (data.length - 1) : 0;
            const yPos = 100 + (depth * 100);

            const activeData = data.filter((d, i) => i >= activeRange[0] && i <= activeRange[1]);

            const nodes = svg.selectAll(`.node-group-depth-${depth}`).data(activeData, d => d.id);
            const nodeGroups = nodes.enter().append("g").attr("class", `node-group-depth-${depth}`);
            nodeGroups.append("circle");
            nodeGroups.append("text");

            const allGroups = nodeGroups.merge(nodes);
            allGroups.attr("transform", (d, i) => `translate(${xStartPosition + data.indexOf(d) * nodeSpacing}, ${yPos})`);

            allGroups.select("circle")
                .attr("r", nodeRadius)
                .attr("fill", (d) => {
                    const originalIndex = data.indexOf(d);
                    if (step.finalized && step.finalized.includes(originalIndex)) return config.COLORS.sorted;
                    if (originalIndex === pivotIndex) return config.COLORS.pivot;
                    if (swapped && swapped.includes(originalIndex)) return config.COLORS.swapped;
                    if (comparing && comparing.includes(originalIndex)) return config.COLORS.comparing;
                    return config.COLORS.default;
                })
                .attr("stroke", "#ffffff").attr("stroke-width", 2);

            allGroups.select("text").text(d => d.value)
                .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
                .attr("fill", "white").style("font-size", "1rem").style("font-weight", "600");

            if (depth === recursionDepth) {
                 if (iMarker >= 0) {
                    svg.append("text").attr("class", "marker").attr("x", xStartPosition + iMarker * nodeSpacing)
                        .attr("y", yPos + nodeRadius + 25).attr("text-anchor", "middle")
                        .attr("fill", "#eab308").style("font-size", "1.25rem").style("font-weight", "bold").text("i");
                }
                if (jMarker >= 0) {
                    svg.append("text").attr("class", "marker").attr("x", xStartPosition + jMarker * nodeSpacing)
                        .attr("y", yPos + nodeRadius + 50).attr("text-anchor", "middle")
                        .attr("fill", "#f87171").style("font-size", "1.25rem").style("font-weight", "bold").text("j");
                }
            }
        }
    }
}


// -- General Drawing Functions --

function drawStep(stepIndex) {
    const step = steps[stepIndex];
    if (!step) return;

    // Highlight the corresponding line of code
    if (lastHighlightedLine) {
        lastHighlightedLine.classList.remove("code-highlight");
    }
    const lineToHighlight = document.getElementById(`code-line-${step.highlightedCodeLine}`);
    if (lineToHighlight) {
        lineToHighlight.classList.add("code-highlight");
        lastHighlightedLine = lineToHighlight;
    }

    // Route to the correct drawing function based on the algorithm
    switch (algorithmId) {
        case 'bubble-sort':
            drawBubbleSortStep(step);
            break;
        case 'merge-sort':
            drawMergeSortStep(step, stepIndex, steps);
            break;
        case 'quick-sort':
            drawQuickSortStep(step);
            break;
        default:
            console.error("Unknown or unhandled algorithm ID:", algorithmId);
    }

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
    startBtn.disabled = isPlaying || currentStep === 0;
    prevBtn.disabled = isPlaying || currentStep === 0;
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

nextBtn.addEventListener("click", stepForward);
prevBtn.addEventListener("click", stepBackward);
startBtn.addEventListener("click", goToStart);
endBtn.addEventListener("click", goToEnd);
playPauseBtn.addEventListener("click", togglePlayPause);
toggleCodeBtn.addEventListener("click", toggleCodePanel);
window.addEventListener("resize", () => drawStep(currentStep));

initialize();