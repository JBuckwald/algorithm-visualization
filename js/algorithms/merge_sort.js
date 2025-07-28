// -- Pseudo-Code for Code Box --
export const mergeSortPythonCode = [
    "def merge_sort(arr):",                              // 0
    "    if len(arr) > 1:",                              // 1
    "        mid = len(arr) // 2",                       // 2
    "        L = arr[:mid]",                             // 3
    "        R = arr[mid:]",                             // 4
    "",                                                  // 5
    "        merge_sort(L)",                             // 6
    "        merge_sort(R)",                             // 7
    "",                                                  // 8
    "        i = j = k = 0",                             // 9
    "",                                                  // 10
    "        # Merge the temp arrays back into arr",     // 11
    "        while i < len(L) and j < len(R):",          // 12
    "            if L[i] < R[j]:",                       // 13
    "                arr[k] = L[i]",                     // 14
    "                i += 1",                            // 15
    "            else:",                                 // 16
    "                arr[k] = R[j]",                     // 17
    "                j += 1",                            // 18
    "            k += 1",                                // 19
    "",                                                  // 20
    "        # Checking for leftover elements",          // 21
    "        while i < len(L):",                         // 22
    "            arr[k] = L[i]",                         // 23
    "            i += 1",                                // 24
    "            k += 1",                                // 25
    "",                                                  // 26
    "        while j < len(R):",                         // 27
    "            arr[k] = R[j]",                         // 28
    "            j += 1",                                // 29
    "            k += 1",                                // 30
];


export function mergeSortAndGenerateSteps(data) {
    const steps = [];
    let localData = JSON.parse(JSON.stringify(data));

    function merge(arr, l, m, r, depth, unsortedData) {
    const n1 = m - l + 1;
    const n2 = r - m;
    const L = new Array(n1);
    const R = new Array(n2);
    const leftIndices = Array.from({ length: n1 }, (_, i) => l + i);
    const rightIndices = Array.from({ length: n2 }, (_, i) => m + 1 + i);

    for (let i = 0; i < n1; i++) L[i] = arr[l + i];
    for (let j = 0; j < n2; j++) R[j] = arr[m + 1 + j];

    // This step sets up the merge view, showing the state BEFORE this merge begins.
    steps.push({
        data: [...unsortedData],
        mergeLeft: leftIndices,
        mergeRight: rightIndices,
        highlightedCodeLine: 12,
        recursionDepth: depth,
        activeRange: [l, r]
    });

    let i = 0, j = 0, k = l;
    // Create a copy of the array that we will modify to show the merge progress.
    let currentVisualState = [...unsortedData];

    while (i < n1 && j < n2) {
        steps.push({
            data: [...currentVisualState],
            comparing: [leftIndices[i], rightIndices[j]],
            highlightedCodeLine: 13, recursionDepth: depth, activeRange: [l, r],
            mergeLeft: leftIndices, mergeRight: rightIndices,
        });

        if (L[i].value <= R[j].value) {
            steps.push({
                data: [...currentVisualState],
                placingValue: { value: L[i].value, from: leftIndices[i], to: k },
                highlightedCodeLine: 14, recursionDepth: depth, activeRange: [l, r],
                mergeLeft: leftIndices, mergeRight: rightIndices,
            });
            arr[k] = L[i];
            currentVisualState[k] = L[i]; // Update our visual copy
            i++;
        } else {
            steps.push({
                data: [...currentVisualState],
                placingValue: { value: R[j].value, from: rightIndices[j], to: k },
                highlightedCodeLine: 17, recursionDepth: depth, activeRange: [l, r],
                mergeLeft: leftIndices, mergeRight: rightIndices,
            });
            arr[k] = R[j];
            currentVisualState[k] = R[j]; // Update our visual copy
            j++;
        }
        k++;
    }

    while (i < n1) {
        steps.push({
            data: [...currentVisualState],
            placingValue: { value: L[i].value, from: leftIndices[i], to: k },
            highlightedCodeLine: 23, recursionDepth: depth, activeRange: [l, r],
            mergeLeft: leftIndices,
        });
        arr[k] = L[i];
        currentVisualState[k] = L[i]; // Update our visual copy
        i++; k++;
    }

    while (j < n2) {
        steps.push({
            data: [...currentVisualState],
            placingValue: { value: R[j].value, from: rightIndices[j], to: k },
            highlightedCodeLine: 28, recursionDepth: depth, activeRange: [l, r],
            mergeRight: rightIndices,
        });
        arr[k] = R[j];
        currentVisualState[k] = R[j]; // Update our visual copy
        j++; k++;
    }
    }

    function mergeSortHelper(arr, l, r, depth, siblingFinalized = []) {
    const baseStep = {
        data: [...arr],
        recursionDepth: depth,
        activeRange: [l, r],
        finalized: siblingFinalized
    };

    steps.push({ ...baseStep, highlightedCodeLine: 1 });

    if (l >= r) {
        steps.push({ ...baseStep, finalized: [...siblingFinalized, l] });
        return;
    }

    const m = l + Math.floor((r - l) / 2);
    const leftIndices = Array.from({ length: m - l + 1 }, (_, i) => l + i);
    const rightIndices = Array.from({ length: r - (m + 1) + 1 }, (_, i) => m + 1 + i);
    
    steps.push({ ...baseStep, highlightedCodeLine: 3, splitLeft: leftIndices, splitRight: rightIndices });
    
    const unsortedStateStep = steps[steps.length - 1]; // --- Capture unsorted state here ---
    
    steps.push({ ...baseStep, highlightedCodeLine: 6, splitLeft: leftIndices, splitRight: rightIndices });

    mergeSortHelper(arr, l, m, depth + 1, []);
    
    const finalizedLeftData = arr.slice(l, m + 1);
    steps.push({
        ...baseStep,
        highlightedCodeLine: 7,
        snapshot: { data: finalizedLeftData, range: [l, m], depth: depth + 1 }
    });

    mergeSortHelper(arr, m + 1, r, depth + 1, leftIndices);
    
    const finalizedRightData = arr.slice(m + 1, r + 1);
     steps.push({
        ...baseStep,
        highlightedCodeLine: 9,
        snapshot: { data: finalizedRightData, range: [m + 1, r], depth: depth + 1 }
    });
    
    merge(arr, l, m, r, depth, unsortedStateStep.data); // --- Pass unsorted state here ---
    }

    steps.push({ data: [...localData], highlightedCodeLine: 0, recursionDepth: 0, activeRange: [0, localData.length - 1] });
    mergeSortHelper(localData, 0, localData.length - 1, 0);
    steps.push({ data: [...localData], finalized: [...Array(localData.length).keys()], recursionDepth: 0, activeRange: [0, localData.length - 1] });

    return steps;
}