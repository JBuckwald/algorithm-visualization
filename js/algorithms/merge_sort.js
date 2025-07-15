
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