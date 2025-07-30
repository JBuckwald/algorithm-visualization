// --- Pseudo Code for Code Box ---
export const quickSortPythonCode = [
    "def quick_sort(arr, low, high):",                // 0
    "    if low < high:",                             // 1
    "        # Partition the array",                 // 2
    "        pivot_index = partition(arr, low, high)", // 3
    "",                                              // 4
    "        # Recursively sort the two halves",      // 5
    "        quick_sort(arr, low, pivot_index - 1)",   // 6
    "        quick_sort(arr, pivot_index + 1, high)",  // 7
    "",
    "def partition(arr, low, high):",                 // 9
    "    pivot = arr[high]",                          // 10
    "    i = low - 1",                                // 11
    "",                                              // 12
    "    for j in range(low, high):",                 // 13
    "    if arr[j] < pivot:",                     // 14
    "        i += 1",                             // 15
    "        arr[i], arr[j] = arr[j], arr[i]",    // 16
    "",                                              // 17
    "    arr[i+1], arr[high] = arr[high], arr[i+1]",    // 18
    "    return i + 1",                              // 19
];


export function quickSortAndGenerateSteps(data) {
    const steps = [];
    let localData = JSON.parse(JSON.stringify(data));
    let finalized = []; // A single, growing list of finalized indices

    function createStep(arr, line, depth, low, high, highlights = {}) {
        steps.push({
            data: [...arr],
            highlightedCodeLine: line,
            recursionDepth: depth,
            activeRange: [low, high],
            finalized: [...finalized], // Add the current list of finalized pivots
            ...highlights
        });
    }

    function partition(arr, low, high, depth) {
        const pivotValue = arr[high]; // The actual pivot object
        let pivotIndex = high;
        createStep(arr, 10, depth, low, high, { pivotIndex });

        let i = low - 1;
        createStep(arr, 11, depth, low, high, { pivotIndex, iMarker: i });

        for (let j = low; j < high; j++) {
            createStep(arr, 14, depth, low, high, { pivotIndex, iMarker: i, jMarker: j, comparing: [j, pivotIndex] });
            if (arr[j].value < pivotValue.value) {
                i++;
                createStep(arr, 16, depth, low, high, { pivotIndex, iMarker: i, jMarker: j, swapped: [i, j] });
                [arr[i], arr[j]] = [arr[j], arr[i]];
                createStep(arr, 16, depth, low, high, { pivotIndex, iMarker: i, jMarker: j, swapped: [i, j] });
            }
        }

        const finalPivotIndex = i + 1;
        createStep(arr, 18, depth, low, high, { iMarker: i, swapped: [finalPivotIndex, high] });
        [arr[finalPivotIndex], arr[high]] = [arr[high], arr[finalPivotIndex]];
        finalized.push(finalPivotIndex); // Add the newly placed pivot to our master list
        createStep(arr, 18, depth, low, high, { swapped: [finalPivotIndex, high] });

        createStep(arr, 19, depth, low, high);
        return finalPivotIndex;
    }

    function quickSortHelper(arr, low, high, depth) {
        if (low > high) return; // Base case for empty ranges

        createStep(arr, 1, depth, low, high);

        if (low === high) { // Base case for a single-element array
            if (!finalized.includes(low)) finalized.push(low);
            createStep(arr, 1, depth, low, high); // Show it finalized
            return;
        }

        const pi = partition(arr, low, high, depth);

        createStep(arr, 6, depth, low, high, { pivotIndex: pi });
        quickSortHelper(arr, low, pi - 1, depth + 1);

        createStep(arr, 7, depth, low, high, { pivotIndex: pi });
        quickSortHelper(arr, pi + 1, high, depth + 1);
    }

    // Initial call
    quickSortHelper(localData, 0, localData.length - 1, 0);

    // Final, fully sorted step
    steps.push({
        data: [...localData],
        highlightedCodeLine: -1,
        recursionDepth: 0,
        activeRange: [0, localData.length - 1],
        finalized: [...Array(localData.length).keys()]
    });

    return steps;
}