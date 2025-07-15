
// -- Pseudo Code for Code Box --
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
    "        if arr[j] < pivot:",                     // 14
    "            i += 1",                             // 15
    "            arr[i], arr[j] = arr[j], arr[i]",    // 16
    "",                                              // 17
    "    arr[i+1], arr[high] = arr[high], arr[i+1]",    // 18
    "    return i + 1",                              // 19
];

export function quickSortAndGenerateSteps(data) {
    const steps = [];
    const finalized = [];
    let localData = JSON.parse(JSON.stringify(data));

    function partition(arr, low, high) {
        const pivotValue = arr[high].value;
        let pivotIndex = high;
        steps.push({
            data: [...arr], comparing: [], swapped: [], airborne: [], pivotIndex: pivotIndex, finalized: [...finalized], highlightedCodeLine: 10, iMarker: -1, jMarker: -1
        });

        let i = low - 1;
        steps.push({
            data: [...arr], comparing: [], swapped: [], airborne: [], pivotIndex: pivotIndex, finalized: [...finalized], highlightedCodeLine: 11, iMarker: i, jMarker: -1
        });

        for (let j = low; j < high; j++) {
            steps.push({
                data: [...arr], comparing: [j, pivotIndex], swapped: [], airborne: [], pivotIndex: pivotIndex, finalized: [...finalized], highlightedCodeLine: 14, iMarker: i, jMarker: j
            });

            if (arr[j].value < pivotValue) {
                i++;
                steps.push({
                    data: [...arr], comparing: [j, pivotIndex], swapped: [i, j], airborne: [i, j], pivotIndex: pivotIndex, finalized: [...finalized], highlightedCodeLine: 16, iMarker: i, jMarker: j
                });

                [arr[i], arr[j]] = [arr[j], arr[i]];

                steps.push({
                    data: [...arr], comparing: [], swapped: [i, j], airborne: [], pivotIndex: pivotIndex, finalized: [...finalized], highlightedCodeLine: 16, iMarker: i, jMarker: j
                });
            }
        }

        const finalPivotIndex = i + 1;
        steps.push({
            data: [...arr], comparing: [], swapped: [finalPivotIndex, high], airborne: [finalPivotIndex, high], pivotIndex: pivotIndex, finalized: [...finalized], highlightedCodeLine: 18, iMarker: i, jMarker: high
        });

        [arr[finalPivotIndex], arr[high]] = [arr[high], arr[finalPivotIndex]];
        pivotIndex = finalPivotIndex;
        finalized.push(pivotIndex);

        steps.push({
            data: [...arr], comparing: [], swapped: [], airborne: [], pivotIndex: -1, finalized: [...finalized], highlightedCodeLine: 19, iMarker: i, jMarker: -1
        });
        
        return pivotIndex;
    }

    function quickSortHelper(arr, low, high) {
        if (low < high) {
            const pi = partition(arr, low, high);
            quickSortHelper(arr, low, pi - 1);
            quickSortHelper(arr, pi + 1, high);
        }
    }

    // Add initial state with markers off-screen
    steps.unshift({
        data: [...localData], comparing: [], swapped: [], airborne: [], pivotIndex: -1, finalized: [], highlightedCodeLine: 0, iMarker: -1, jMarker: -1,
    });
    
    quickSortHelper(localData, 0, localData.length - 1);

    // Add final sorted state
    steps.push({
        data: [...localData], comparing: [], swapped: [], airborne: [], pivotIndex: -1, finalized: [...Array(localData.length).keys()], highlightedCodeLine: -1, iMarker: -1, jMarker: -1
    });

    return steps;
}