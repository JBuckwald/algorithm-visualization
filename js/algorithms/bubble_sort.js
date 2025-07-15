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

    // Initial state corresponds to the procedure definition
    steps.push({
        data: [...localData],
        comparing: [],
        swapped: [],
        airborne: [],
        sortedIndex: localData.length,
        highlightedCodeLine: 0 
    });

    let n = localData.length;
    let swapped;
    let sortedBoundary = n - 1;

    do {
        swapped = false;
        // Corresponds to the 'swapped = false' line
        steps.push({
            data: [...localData],
            comparing: [],
            swapped: [],
            airborne: [],
            sortedIndex: sortedBoundary + 1,
            highlightedCodeLine: 4 
        });

        for (let i = 0; i < sortedBoundary; i++) {
            // Corresponds to the 'if' comparison
            steps.push({
                data: [...localData],
                comparing: [i, i + 1],
                swapped: [],
                airborne: [],
                sortedIndex: sortedBoundary + 1,
                highlightedCodeLine: 7 
            });

            if (localData[i].value > localData[i + 1].value) {
                // Corresponds to the 'swap' line
                steps.push({
                    data: [...localData],
                    comparing: [],
                    swapped: [i, i + 1],
                    airborne: [i, i + 1],
                    sortedIndex: sortedBoundary + 1,
                    highlightedCodeLine: 9 
                });

                [localData[i], localData[i + 1]] = [localData[i + 1], localData[i]];
                swapped = true;

                // Corresponds to 'swapped = true'
                steps.push({
                    data: [...localData],
                    comparing: [],
                    swapped: [i, i + 1],
                    airborne: [i, i + 1],
                    sortedIndex: sortedBoundary + 1,
                    highlightedCodeLine: 10 
                });

                // Shows the result of the swap before the next comparison
                steps.push({
                    data: [...localData],
                    comparing: [],
                    swapped: [],
                    airborne: [],
                    sortedIndex: sortedBoundary + 1,
                    highlightedCodeLine: 6 // Back to the 'for' loop line
                });
            }
        }

        steps.push({
            data: [...localData],
            comparing: [],
            swapped: [],
            airborne: [],
            sortedIndex: sortedBoundary,
            highlightedCodeLine: 13
        });
        sortedBoundary--;

    } while (swapped);

    // Corresponds to the end of the procedure
    steps.push({
        data: [...localData],
        comparing: [],
        swapped: [],
        airborne: [],
        sortedIndex: -1,
        highlightedCodeLine: 13
    });

    return steps;
}