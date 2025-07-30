// -- Psuedo Code for Code Box
export const bubbleSortPythonCode = [
    "def bubble_sort(arr):",                                // 0
    "    n = len(arr)",                                     // 1
    "",                                                     // 2
    "    for i in range(n - 1, 0, -1):",                    // 3
    "        swapped = False",                              // 4
    "",                                                     // 5
    "        for j in range(i):",                           // 6
    "            if arr[j] > arr[j+1]:",                    // 7
    "                # Swap elements",                      // 8
    "                arr[j], arr[j+1] = arr[j+1], arr[j]",  // 9
    "                swapped = True",                       // 10
    "",                                                     // 11
    "        if not swapped:",                              // 12
    "            break"                                     // 13
];

export function bubbleSortAndGenerateSteps(data) {
    const steps = [];
    let localData = JSON.parse(JSON.stringify(data));

    // Initial state
    steps.push({
        data: [...localData], comparing: [], swapped: [],
        sortedIndex: localData.length, highlightedCodeLine: 0
    });

    let n = localData.length;
    let swapped;
    let sortedBoundary = n - 1;

    do {
        swapped = false;
        steps.push({
            data: [...localData], comparing: [], swapped: [],
            sortedIndex: sortedBoundary + 1, highlightedCodeLine: 4
        });

        for (let i = 0; i < sortedBoundary; i++) {
            // Step 1: Highlight nodes for comparison
            steps.push({
                data: [...localData], comparing: [i, i + 1], swapped: [],
                sortedIndex: sortedBoundary + 1, highlightedCodeLine: 7
            });

            if (localData[i].value > localData[i + 1].value) {
                // Step 2: Mark nodes as 'swapped' (e.g., turn red)
                // The data itself has NOT been swapped yet in this step.
                steps.push({
                    data: [...localData], comparing: [], swapped: [i, i + 1],
                    sortedIndex: sortedBoundary + 1, highlightedCodeLine: 9
                });

                // Actually swap the data in our local array
                [localData[i], localData[i + 1]] = [localData[i + 1], localData[i]];
                swapped = true;

                // Step 3: Show the result of the swap.
                // The visualizer will see the data is in a new order and animate the nodes to their new positions.
                steps.push({
                    data: [...localData], comparing: [], swapped: [],
                    sortedIndex: sortedBoundary + 1, highlightedCodeLine: 6
                });
            }
        }
        steps.push({
            data: [...localData], comparing: [], swapped: [],
            sortedIndex: sortedBoundary, highlightedCodeLine: 13
        });
        sortedBoundary--;

    } while (swapped);

    // Final sorted state
    steps.push({
        data: [...localData], comparing: [], swapped: [],
        sortedIndex: -1, highlightedCodeLine: 13
    });

    return steps;
}