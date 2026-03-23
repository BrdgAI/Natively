# Section 04 — Competitive Programming Vocabulary

> Goal: Sound like a seasoned programmer. This section gives you every technical word, phrase, and name that regular LeetCoders and competitive programmers use naturally. When you use these words correctly in context, you project fluency and confidence — even if you haven't solved hundreds of problems.

---

## How to Use This Section

Read through each section. For each word:
1. Read the definition
2. Read the example sentence you can use
3. Say the sentence out loud (once)

Revisit this once a week during preparation. Before the interview, do a quick re-read.

---

## PART 1 — Algorithm Names & What to Say

These are the algorithms you will reference by name. Know how to introduce each one.

| Algorithm | What it does | How to introduce it in the interview |
|-----------|-------------|-------------------------------------|
| **BFS** (Breadth-First Search) | Explores a graph level-by-level from a source | *"I'll use BFS here — it explores level by level, which guarantees the shortest path in an unweighted graph."* |
| **DFS** (Depth-First Search) | Explores a graph by going deep before backtracking | *"DFS works here because I need to explore all paths, not just the shortest one."* |
| **Dijkstra's** | Shortest path in a graph with positive edge weights | *"Since all weights are positive, Dijkstra's is the right call — it gives us shortest paths in O((V + E) log V)."* |
| **Bellman-Ford** | Shortest path with negative weights (slower) | *"If negative weights were allowed, I'd use Bellman-Ford instead — it handles that at O(V × E)."* |
| **Topological Sort** | Ordering of a DAG so dependencies come first | *"This is a dependency problem — I'll use topological sort via Kahn's algorithm."* |
| **Kahn's Algorithm** | BFS-based topological sort using in-degrees | *"Kahn's algorithm tracks in-degrees and processes nodes with zero dependencies first."* |
| **Binary Search** | Finding a target in O(log n) on sorted data | *"The sorted input makes me think binary search — that gets us from O(n) to O(log n)."* |
| **Two Pointers** | Two indices moving through an array | *"I'll use two pointers — one from each end — to avoid the O(n²) brute force."* |
| **Sliding Window** | A window of fixed or variable size moving through data | *"This looks like a sliding window problem — I expand right and shrink left when the condition is violated."* |
| **Prefix Sums** | Precomputed cumulative sums for fast range queries | *"I'll precompute a prefix sum array so range sum queries run in O(1) instead of O(n)."* |
| **Merge Sort** | Divide-and-conquer O(n log n) sort | *"Merge sort is O(n log n) guaranteed — better than quicksort's worst case."* |
| **Quick Sort / Quickselect** | Average O(n) selection algorithm | *"Quickselect finds the k-th element in O(n) average time — more efficient than fully sorting."* |
| **Memoization** | Top-down DP — cache results of recursive calls | *"I'll add memoization here to cache results — that avoids recomputing the same subproblems."* |
| **Tabulation** | Bottom-up DP — fill table iteratively | *"I'll use tabulation — build the DP table from the base cases up."* |
| **Union-Find** | Data structure for dynamic connectivity | *"Union-Find is ideal here for checking if two nodes are in the same connected component in near O(1)."* |
| **Tries** | Tree of characters for prefix operations | *"A Trie is the right structure here — it supports prefix lookups in O(L) where L is the prefix length."* |
| **Monotonic Stack** | Stack that maintains a sorted order of elements | *"I'll use a monotonic stack — it resolves the 'next greater element' pattern in O(n)."* |
| **Backtracking** | Recursive exploration with undo/rollback on dead ends | *"This is a backtracking problem — I'll explore each candidate and backtrack when a constraint is violated."* |
| **Greedy** | Make locally optimal choices hoping for global optimum | *"A greedy approach works here — I can prove that always picking [X] leads to the global optimum."* |
| **Floyd-Warshall** | All-pairs shortest paths in O(n³) | *"For all-pairs shortest paths on a small graph, Floyd-Warshall works in O(n³)."* |

---

## PART 2 — Data Structure Vocabulary

### General Data Structures

| Word | Meaning | Example sentence |
|------|---------|-----------------|
| **Array / List** | Ordered sequence, O(1) index access | *"I'll store results in a list and return it at the end."* |
| **Hash Map** | Key-value store, O(1) average insert/lookup | *"I'll use a hash map to store each value's index for O(1) lookup."* |
| **Hash Set** | Set of unique values, O(1) average lookup | *"I'll use a hash set for visited nodes — O(1) membership check."* |
| **Stack** | LIFO structure — last in, first out | *"A stack is perfect here — I need to process things in reverse order."* |
| **Queue** | FIFO structure — first in, first out | *"I'll use a deque as my BFS queue for O(1) popleft."* |
| **Deque** | Double-ended queue — efficient at both ends | *"Python's deque gives me O(1) append and popleft — much better than a list for queues."* |
| **Heap / Priority Queue** | Tree-based structure for efficient min/max retrieval | *"A min-heap here gives me O(log n) insertion and O(log n) extraction of the minimum."* |
| **Min-heap** | Heap where the smallest element is always at the top | *"Python's heapq is a min-heap by default."* |
| **Max-heap** | Heap where the largest element is always at the top | *"To simulate a max-heap in Python, I negate values before pushing."* |
| **Trie** | Prefix tree — each edge is a character | *"I'll build a Trie to support O(L) prefix lookups."* |
| **Adjacency List** | Graph representation: dictionary of node → list of neighbors | *"I'll represent the graph as an adjacency list — O(V + E) space."* |
| **Adjacency Matrix** | Graph representation: 2D grid of edge weights | *"An adjacency matrix works for dense graphs but uses O(V²) space."* |

---

### Graph-Specific Vocabulary

| Word | Meaning | Example sentence |
|------|---------|-----------------|
| **Node / Vertex** | A point in a graph | *"Each router is a node in the graph."* |
| **Edge** | A connection between two nodes | *"Each connection is a weighted, bidirectional edge."* |
| **Weight** | The cost/distance of an edge | *"The edge weight represents the distance between routers."* |
| **Directed graph** | Edges have a direction (one-way) | *"In a directed graph, A → B doesn't imply B → A."* |
| **Undirected graph** | Edges go both ways | *"Since the roads go both ways, this is an undirected graph."* |
| **Cycle** | A path that starts and ends at the same node | *"I need to handle cycles — the visited set prevents infinite loops."* |
| **DAG** | Directed Acyclic Graph — directed, no cycles | *"This is a DAG — topological sort applies."* |
| **Connected component** | A group of nodes all reachable from each other | *"I need to count connected components — each island is one."* |
| **Shortest path** | The minimum-cost path between two nodes | *"Dijkstra's finds the shortest path from source to all other nodes."* |
| **Relaxation** | Updating a shorter known distance to a node | *"The relaxation step: if new_dist < dist[neighbor], update it."* |
| **BFS frontier** | The current layer being explored in BFS | *"The frontier expands level by level in BFS."* |
| **DFS backtracking** | Returning to a parent node in DFS after a dead end | *"DFS backtracks when it reaches a dead end."* |
| **In-degree** | Number of edges pointing INTO a node | *"Nodes with in-degree zero have no prerequisites."* |
| **Out-degree** | Number of edges pointing OUT of a node | *"High out-degree means a node has many connections."* |
| **Topological order** | An ordering of a DAG where all dependencies come before dependents | *"Topological order ensures a course's prerequisites come before the course itself."* |

---

### Tree-Specific Vocabulary

| Word | Meaning | Example sentence |
|------|---------|-----------------|
| **Root** | The top node of a tree | *"I'll start DFS from the root."* |
| **Leaf** | A node with no children | *"Leaf nodes are the base case — they have no children."* |
| **Height** | Longest path from root to any leaf | *"The height of the tree determines the recursion depth."* |
| **Depth** | Distance from root to a given node | *"All nodes at depth k from the target..."* |
| **Subtree** | A node and all its descendants | *"I'll compute the max path sum within each subtree."* |
| **Parent / Child** | A node and the node directly above/below it | *"Each node's parent is the node that called it in the recursion."* |
| **Inorder** | Left → Root → Right traversal (BST property: gives sorted order) | *"Inorder traversal of a BST gives values in ascending order."* |
| **Preorder** | Root → Left → Right traversal (useful for serialization) | *"Preorder visits the root before its children."* |
| **Postorder** | Left → Right → Root traversal (useful for deletion, subtree computation) | *"Postorder is ideal when a parent needs results from both children first."* |
| **Level-order** | BFS layer-by-layer traversal | *"Level-order traversal uses a queue and processes one level at a time."* |
| **Balanced tree** | A tree where the height difference between subtrees is at most 1 | *"A balanced BST guarantees O(log n) search."* |
| **BST property** | In a BST, left children are smaller, right children are larger | *"The BST property means I can search in O(log n) instead of O(n)."* |
| **LCA** | Lowest Common Ancestor — deepest shared ancestor of two nodes | *"LCA of nodes p and q is the deepest node that is an ancestor of both."* |

---

### DP-Specific Vocabulary

| Word | Meaning | Example sentence |
|------|---------|-----------------|
| **Subproblem** | A smaller version of the same problem | *"The subproblem is: what's the min cost to reach cell (i, j)?"* |
| **Recurrence relation** | The formula relating a state to smaller states | *"The recurrence is: dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])."* |
| **Overlapping subproblems** | The same subproblem appears multiple times — DP avoids recomputing | *"Without memoization, we'd recompute the same subproblems exponentially."* |
| **Optimal substructure** | The optimal solution is built from optimal subsolutions | *"This problem has optimal substructure — the shortest path to a node uses shortest paths to its predecessors."* |
| **Memoization** | Caching results of recursive calls (top-down) | *"I'll memoize with a dictionary to cache results."* |
| **Tabulation** | Building results iteratively from base cases (bottom-up) | *"Bottom-up tabulation avoids the recursion overhead."* |
| **State** | The parameters that define a subproblem | *"The state is (row, col, remaining_budget)."* |
| **Transition** | The rule for moving from one state to the next | *"The transition is: dp[i] = dp[i-1] + dp[i-2]."* |
| **Base case** | The smallest version of the problem with a known answer | *"Base case: dp[0] = 0, dp[1] = 1."* |
| **Rolling array** | DP optimization — only keep the last row/two rows | *"I can reduce space from O(n²) to O(n) with a rolling array — I only need the previous row."* |
| **State compression** | Encoding multiple state dimensions into one (often bitmask) | *"State compression with bitmask allows O(2^n × n) instead of exponential."* |

---

### Code-Quality Vocabulary

These are words that signal production-code thinking:

| Word | Meaning | When to use it |
|------|---------|---------------|
| **Edge case** | An unusual or boundary input that might break the code | *"Let me also handle the edge case where the input is empty."* |
| **Guard clause** | An early return at the top of a function to handle special cases | *"I'll add a guard clause at the top for the null input case."* |
| **Off-by-one** | A common bug where loop bounds are wrong by 1 | *"Wait — I think there's an off-by-one here in my loop condition."* |
| **In-place modification** | Modifying the input directly instead of using extra space | *"We can do this in-place to reduce space from O(n) to O(1)."* |
| **DRY** | Don't Repeat Yourself — avoid copy-pasting logic | *"I'll extract this into a helper to keep things DRY."* |
| **Modular** | Code split into small, single-purpose functions | *"I'll keep this modular — separate functions for graph building and Dijkstra's."* |
| **Helper function** | A smaller function that does one sub-task | *"Let me write a helper function for this validation logic."* |
| **Top-down** | Starting with the overall structure before filling in details | *"I'll code top-down — write the skeleton first, then fill in helpers."* |
| **Bottleneck** | The part of the algorithm that determines the overall complexity | *"The sort is the bottleneck — everything else is linear."* |
| **Amortized** | Average cost over many operations, even if individual ops vary | *"Each element is pushed and popped at most once — O(n) amortized."* |
| **Invariant** | A condition that remains true throughout the algorithm | *"The invariant is: everything to the left of left pointer is processed."* |

---

## PART 3 — Complexity Vocabulary

### Complexity Tiers — What They Mean in Practice

| Notation | Name | Meaning | Example |
|----------|------|---------|---------|
| O(1) | Constant | Same time regardless of input size | Hash map lookup, array index access |
| O(log n) | Logarithmic | Halves the problem each step | Binary search |
| O(n) | Linear | Proportional to input size | Single loop over array |
| O(n log n) | Linearithmic | Nearly linear | Sorting (merge sort, heapsort) |
| O(n²) | Quadratic | Two nested loops | Brute force pair comparison |
| O(n³) | Cubic | Three nested loops | Floyd-Warshall, naive matrix mult |
| O(2^n) | Exponential | Doubles with each extra element | Subset enumeration, backtracking |
| O(n!) | Factorial | All permutations | Full permutation generation |

---

### Complexity Phrases (Use These in the Interview)

**Describing time complexity:**
- *"The time complexity is O(n log n) — the sort dominates."*
- *"This runs in O(V + E) for the graph traversal."*
- *"Each element is processed at most once, so the overall time is O(n)."*
- *"The inner loop runs at most k times, giving O(n × k) overall."*
- *"In the worst case, every node is pushed and popped from the heap once — O(n log n)."*

**Describing space complexity:**
- *"Space complexity is O(n) for the hash map."*
- *"The recursion depth is O(h) where h is the tree height — O(log n) for balanced, O(n) worst case."*
- *"The dist dictionary and visited set both use O(V) space."*
- *"I can reduce space to O(1) by modifying in place — want me to explore that?"*

**Comparing approaches:**
- *"This trades O(n) space for O(1) time per lookup — worth it for repeated queries."*
- *"The naive approach is O(n²) but we can bring it to O(n log n) by sorting first."*
- *"Dijkstra's is better here — BFS would give O(V + E) but wouldn't respect edge weights."*
- *"For this scale (N = 10^5), O(n²) would be about 10 billion operations — too slow. We need O(n log n) or better."*

---

## PART 4 — Common Interview Phrases That Sound Natural

These are full sentences that experienced programmers say naturally. Practice them:

### When introducing an algorithm:
- *"This is a classic BFS problem — shortest path in an unweighted graph."*
- *"The first thing I notice is the sorted order — that immediately makes me think binary search."*
- *"The constraint 'find minimum K such that...' is a classic binary search on answer space pattern."*
- *"This has the shape of a DP problem — let me see if I can identify the state and recurrence."*

### When building a data structure:
- *"I'll use a defaultdict of lists to build the adjacency list — that way I don't need to initialize each key."*
- *"I'll use a min-heap here — Python's heapq gives me O(log n) insertions and deletions."*
- *"A Counter here saves me from writing a manual frequency loop."*

### When explaining a design choice:
- *"I'm choosing BFS over DFS here because BFS guarantees the shortest path in an unweighted graph — DFS would find A path but not necessarily the shortest one."*
- *"I'm using a visited set to avoid reprocessing nodes — without it, cycles would cause infinite loops."*
- *"I'm initializing distances to infinity so any real distance is automatically smaller."*

### When finding complexity:
- *"Building the graph is O(E). Dijkstra's with a binary heap is O((V + E) log V). The bottleneck is Dijkstra's, so overall O((V + E) log V)."*
- *"Each element is pushed and popped from the heap at most once — O(n log n) total."*
- *"The outer loop is O(n), the inner lookup is O(1) due to the hash map — so overall O(n)."*

---

## PART 5 — Words That Signal Engineering Maturity

These words and phrases, when used correctly, signal that you think about code the way a senior engineer does:

| Phrase | Signals |
|--------|---------|
| *"I'll keep this extensible so we can add new constraints easily"* | Production mindset, follow-up readiness |
| *"Let me extract this into a helper to keep the main function readable"* | Modular thinking |
| *"I want to handle this edge case defensively"* | Robustness awareness |
| *"This is correct but has a subtle off-by-one — let me fix that"* | Attention to detail |
| *"The invariant here is that [X] is always true when we enter the loop"* | Formal reasoning ability |
| *"For the scale given (N = 10^5), O(n²) would time out — we need at least O(n log n)"* | Constraint-driven thinking |
| *"I could optimize space further by modifying in place, but that would mutate the caller's input — depends on whether that's acceptable"* | Tradeoff awareness |
| *"I'll add this stub for now and implement it after the main logic is working"* | Top-down decomposition |

---

*References: notes-summarized.md (Sections 6, 11, 12), interview-flow-summarized.md (Communication Phrases Reference section), Mock Interview - 45m - Sonnet4.6.md (Alex's narration patterns throughout)*
