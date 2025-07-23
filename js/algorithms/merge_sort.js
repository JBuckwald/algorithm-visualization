
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

    function merge(arr, l, m, r) {
        const n1 = m - l + 1;
        const n2 = r - m;

        // Create temp arrays
        const L = new Array(n1);
        const R = new Array(n2);
        const leftIndices = [];
        const rightIndices = [];

        // Copy data to temp arrays L[] and R[]
        for (let i = 0; i < n1; i++) {
            L[i] = arr[l + i];
            leftIndices.push(l + i);
        }
        for (let j = 0; j < n2; j++) {
            R[j] = arr[m + 1 + j];
            rightIndices.push(m + 1 + j);
        }

        // --- Visualization Step: Show the two sub-arrays to be merged ---
        steps.push({
            data: [...arr],
            mergeLeft: [...leftIndices],
            mergeRight: [...rightIndices],
            highlightedCodeLine: 12,
        });

        let i = 0; // Initial index of first subarray
        let j = 0; // Initial index of second subarray
        let k = l; // Initial index of merged subarray

        while (i < n1 && j < n2) {
            // --- Visualization Step: Compare elements from L and R ---
            steps.push({
                data: [...arr],
                mergeLeft: [...leftIndices],
                mergeRight: [...rightIndices],
                comparing: [leftIndices[i], rightIndices[j]], // Highlight nodes being compared
                highlightedCodeLine: 13,
            });

            if (L[i].value <= R[j].value) {
                arr[k] = L[i];
                // --- Visualization Step: Show element from L being placed ---
                steps.push({
                    data: [...arr],
                    mergeLeft: [...leftIndices],
                    mergeRight: [...rightIndices],
                    swapped: [k], // Use 'swapped' color to show placement
                    highlightedCodeLine: 14,
                });
                i++;
            } else {
                arr[k] = R[j];
                // --- Visualization Step: Show element from R being placed ---
                steps.push({
                    data: [...arr],
                    mergeLeft: [...leftIndices],
                    mergeRight: [...rightIndices],
                    swapped: [k], // Use 'swapped' color to show placement
                    highlightedCodeLine: 17,
                });
                j++;
            }
            k++;
        }

        // Copy the remaining elements of L[], if there are any
        while (i < n1) {
            arr[k] = L[i];
            steps.push({ data: [...arr], swapped: [k], highlightedCodeLine: 23 });
            i++;
            k++;
        }

        // Copy the remaining elements of R[], if there are any
        while (j < n2) {
            arr[k] = R[j];
            steps.push({ data: [...arr], swapped: [k], highlightedCodeLine: 28 });
            j++;
            k++;
        }
    }

    function mergeSortHelper(arr, l, r) {
        if (l >= r) {
            return; // Base case
        }
        steps.push({ data: [...arr], highlightedCodeLine: 1 });
        const m = l + Math.floor((r - l) / 2);

        steps.push({ data: [...arr], highlightedCodeLine: 6 });
        mergeSortHelper(arr, l, m);

        steps.push({ data: [...arr], highlightedCodeLine: 7 });
        mergeSortHelper(arr, m + 1, r);

        merge(arr, l, m, r);
    }

    // Initial state
    steps.push({ data: [...localData], highlightedCodeLine: 0 });
    mergeSortHelper(localData, 0, localData.length - 1);
    
    // Final sorted state
    steps.push({ data: [...localData], finalized: [...Array(localData.length).keys()] });

    return steps;
}