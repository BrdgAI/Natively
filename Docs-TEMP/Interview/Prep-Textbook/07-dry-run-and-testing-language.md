# Section 07 — Dry Run & Testing Language

> Goal: Know how to trace through code out loud, step-by-step, for every type of algorithm. Know how to name and test edge cases. Know how to state complexity clearly. This section covers Phase 5 in full detail, with tie-ins to Phase 3 (approach narration) and Phase 4 (coding narration).

---

## Why This Phase Is Not Optional

> **"Many candidates treat this phase as optional — it is not. Proactively testing and analyzing your solution is one of the strongest signals of engineering maturity."**
> — interview-flow-summarized.md

**The hierarchy of testing (best to worst):**
1. You find the bug and fix it yourself ← highest signal
2. You find the bug but need to trace to understand it
3. Interviewer finds the bug and you fix it quickly
4. Interviewer finds the bug and you struggle to fix it
5. Bug stays in the code ← lowest signal, most harmful

Always aim for level 1 or 2. This section teaches you how.

---

## Phase 3 Tie-In: Narrating During Approach Discussion

Before coding, when you describe your algorithm, use this narration structure:

**State the pattern → Explain why → Give complexity:**

> *"I'll use Dijkstra's here [pattern] — because all edge weights are positive, BFS wouldn't respect the weights [why] — giving us O of V plus E log V time [complexity]."*

**Introduce the key data structures you'll use:**

> *"I'll maintain a min-heap for efficient extraction of the minimum distance node, a dist dictionary initialized to infinity, and a visited set to avoid reprocessing."*

**Describe the main loop logic in plain language before coding it:**

> *"The loop: I pop the node with the smallest known distance. If it's the destination, I return that distance. If I've already finalized it, I skip it. Otherwise I relax all its neighbors."*

This narration should take 2–3 minutes in Phase 3. It previews the code and helps both you and the interviewer understand what's about to be written.

---

## Phase 4 Tie-In: Narrating While Coding

While you are typing, narrate WHY you're doing things — not WHAT you're doing:

| What you're writing | What to say |
|--------------------|-------------|
| `dist = {i: float('inf') for i in range(n)}` | *"Initializing all distances to infinity — any real path will be shorter."* |
| `dist[src] = 0` | *"Source distance is zero — it costs nothing to start here."* |
| `min_heap = [(0, src)]` | *"The heap starts with just the source at distance zero."* |
| `if node in visited: continue` | *"Skip already-finalized nodes — in Dijkstra's, first pop is always the shortest."* |
| `visited.add(node)` | *"Mark as finalized — we won't revisit this node."* |
| `new_dist = curr_dist + weight` | *"Compute the potential new distance through this node to the neighbor."* |
| `if new_dist < dist[neighbor]:` | *"Only update if this path is actually shorter — that's the relaxation condition."* |

**Rule:** Narrate decision points, not every single line. If two lines are obvious sequential steps, you can narrate them together. Never go more than 60 seconds without saying something.

---

## PHASE 5 — Full Dry Run Protocol

### Step 1 — Announce It

Before doing anything, announce that you are testing:

> *"Let me trace through this with a concrete example to verify correctness."*

> *"Before we move on, I want to manually walk through a test case."*

> *"Let me do a quick dry run to make sure the logic holds up."*

This signals intentionality. It tells the interviewer: "I test my own code — I don't just assume it's correct."

---

### Step 2 — Pick a Simple Test Input

Choose the smallest input that exercises the main logic. Do NOT pick a huge complex example — small and clear is better.

Example for a BFS graph problem:
```
n=4, connections: [(0,1,3), (1,2,4), (2,3,2)], src=0, dst=3, d=9
```

Write this as a comment in the doc:
```python
# Test 1: Happy path
# n=4, 0-1(3), 1-2(4), 2-3(2), src=0, dst=3, d=9
# Expected: True (path 0→1→2→3 = 3+4+2 = 9 ≤ 9)
```

---

### Step 3 — Trace the State, Out Loud

Walk through the algorithm step by step, saying the state of key variables at each step. Write key state changes in the doc.

**The golden rule:** Write what changes. Skip what stays the same.

---

## Dry Run Templates by Algorithm Type

### Template 1 — BFS / Dijkstra's Trace

**Setup (write in doc):**
```
dist = {0:0, 1:∞, 2:∞, 3:∞}
heap = [(0, 0)]
visited = {}
```

**Trace (say out loud + key changes in doc):**
```
Pop (0, node=0): not visited → add to visited
  Neighbor 1: new_dist = 0+3 = 3 < ∞ → push (3,1), dist[1]=3
  heap = [(3,1)]

Pop (3, node=1): not visited → add to visited
  Neighbor 0: already visited, skip
  Neighbor 2: new_dist = 3+4 = 7 < ∞ → push (7,2), dist[2]=7
  heap = [(7,2)]

Pop (7, node=2): not visited → add to visited
  Neighbor 1: already visited, skip
  Neighbor 3: new_dist = 7+2 = 9 < ∞ → push (9,3), dist[3]=9
  heap = [(9,3)]

Pop (9, node=3): node == dst → return 9
Result: 9 ≤ d=9 → True ✓
```

**What to say:** *"I start with heap = [(0, source)]. Pop the source — add it to visited, relax neighbors. The heap now has [(3, router 1)]. Pop router 1 — add to visited, relax its neighbors. Continue until I pop the destination..."*

---

### Template 2 — Two-Pointer Trace

**Setup:**
```
arr = [1, 2, 3, 4, 6], target = 9
left = 0, right = 4
```

**Trace:**
```
left=0 (val=1), right=4 (val=6): sum=7 < 9 → move left right
left=1 (val=2), right=4 (val=6): sum=8 < 9 → move left right
left=2 (val=3), right=4 (val=6): sum=9 == 9 → return [2, 4] ✓
```

**What to say:** *"Left starts at 0, right at the end. The sum is 7 — too small, move left pointer right. Sum is 8 — still too small, move left again. Sum is 9 — found it. Return indices 2 and 4."*

---

### Template 3 — Sliding Window Trace

**Setup:**
```
arr = [2, 1, 5, 1, 3, 2], k = 3
```

**Trace:**
```
Initial window [2,1,5]: sum=8
i=3 (val=1): add 1, remove arr[0]=2 → sum = 8+1-2 = 7
i=4 (val=3): add 3, remove arr[1]=1 → sum = 7+3-1 = 9
i=5 (val=2): add 2, remove arr[2]=5 → sum = 9+2-5 = 6
max_sum = 9 ✓ (window [5,1,3])
```

**What to say:** *"I initialize the window with the first k elements. Then I slide it — add the new right element, remove the old left element. Track the maximum sum seen. The peak was 9 from window [5, 1, 3]."*

---

### Template 4 — DP Table Trace

**Problem:** Minimum path sum in a 2x3 grid.

**Setup:**
```
grid = [[1, 3, 1],
        [1, 5, 1]]
```

**Trace (say while filling):**
```
dp[0][0] = 1 (base case: top-left)

First row (can only come from left):
dp[0][1] = dp[0][0] + grid[0][1] = 1+3 = 4
dp[0][2] = dp[0][1] + grid[0][2] = 4+1 = 5

First col (can only come from above):
dp[1][0] = dp[0][0] + grid[1][0] = 1+1 = 2

Remaining cells (min of above or left):
dp[1][1] = grid[1][1] + min(dp[0][1], dp[1][0]) = 5 + min(4,2) = 7
dp[1][2] = grid[1][2] + min(dp[0][2], dp[1][1]) = 1 + min(5,7) = 6

Answer: dp[1][2] = 6 ✓
```

**What to say:** *"I fill the DP table row by row. The first row can only be reached from the left — so I accumulate from dp[0][0]. The first column can only be reached from above. For everything else, I take the min of coming from above or from the left, plus the current cell's value."*

---

### Template 5 — DFS Tree Trace

**Problem:** Find height of a binary tree.

**Setup:**
```
    1
   / \
  2   3
 / \
4   5
```

**Trace (recursion call stack):**
```
height(1)
  → height(2)
      → height(4): no children → return 0
      → height(5): no children → return 0
      → return 1 + max(0, 0) = 1
  → height(3): no children → return 0
  → return 1 + max(1, 0) = 2

Answer: 2 ✓
```

**What to say:** *"I recursively call height on each subtree. The base case is a null node — return 0. For leaves (nodes 4, 5, 3), each call returns 0. Node 2 gets max(0, 0) + 1 = 1. The root gets max(1, 0) + 1 = 2. That's the height."*

---

### Template 6 — BFS on Grid Trace (Islands)

**Setup:**
```
grid = [['1','1','0'],
        ['0','1','0'],
        ['0','0','1']]
```

**Trace:**
```
Scan (0,0): '1', not visited → BFS
  Queue: [(0,0)]. Pop (0,0): mark visited. Add neighbors (0,1)
  Queue: [(0,1)]. Pop (0,1): mark visited. Add neighbors: (1,1)
  Queue: [(1,1)]. Pop (1,1): mark visited. No new unvisited '1' neighbors.
  Queue empty → island 1 complete.

Continue scan... (1,0): '0', skip. (2,0): '0', skip.
(2,2): '1', not visited → BFS
  Only this cell, no '1' neighbors → island 2 complete.

Total: 2 islands ✓
```

---

## Step 4 — Test Edge Cases (Name Each One)

After the happy path, go through your edge case list by name. Call each one out loud:

> *"Now let me check edge cases. First — empty input: [trace or explain]. Second — single element: [trace]. Third — let me check for cycles in the graph..."*

### The Standard Edge Case List (use in every interview)

Name them in this order. Check each one:

```
1. Empty input
   "If the input is empty, my function [returns immediately / returns -1 / returns [] 
    on line X due to the guard clause]."

2. Single element
   "If n = 1 and [condition], my code [does X]."

3. All duplicates
   "If all values are the same, [does the logic still work?]."

4. All negatives
   "If all values are negative, [does the minimum/maximum logic still hold?]."

5. Target not present
   "If the target doesn't exist in the input, I return [X] at the end."

6. src == dst (for path problems)
   "If source equals destination, my guard clause on line 1 returns True immediately."

7. Minimum boundary value
   "With the minimum allowed value, [does anything overflow or break?]."

8. Maximum boundary value
   "With N at its maximum of 10^5, the algorithm runs in [complexity] which is fine."

9. Cycle (for graph problems)
   "For a graph with a cycle like 0→1→2→0, the visited set prevents revisiting node 0."

10. Disconnected graph
    "If the destination is in a different component, dist[dst] stays infinity, 
     so I return False correctly."
```

---

## How to Write Test Cases in the Doc

Follow this exact format (from the mock interview example):

```python
# === TEST CASES ===

# Test 1: Happy path — describe what it tests
# [input], [expected output], [brief reason]
# n=4, 0-1(3), 1-2(4), 2-3(2), src=0, dst=3, d=9 → True ✓ (sum=9=d)

# Test 2: Edge case name
# [input], [expected output]
# src == dst → True (early return, line 1) ✓

# Test 3: Edge case name  
# [input], [expected output]
# n=4, only edge 0-1(3), src=0, dst=3, d=100 → False ✓ (dst unreachable)

# Test 4: Edge case name
# [input], [expected output]
# n=3, 0-1(5), 1-2(5), src=0, dst=2, d=8 → False ✓ (path=10 > d=8)

# Test 5: Structural edge case
# Graph with cycle 0→1→2→0 → visited set prevents infinite loop ✓
```

---

## Complexity Analysis — Step-by-Step How to State It

Never just state the answer — derive it briefly out loud. This shows you understand it, not just memorized it.

### Formula for deriving complexity out loud:

**Step 1** — Identify each part of your code:
> *"There are three parts: building the graph, running Dijkstra's, and the final comparison."*

**Step 2** — State the complexity of each part:
> *"Building the graph is O of E — one loop over all edges. Dijkstra's with a binary heap is O of V plus E, times log V. The final comparison is O of one."*

**Step 3** — Identify the bottleneck:
> *"The bottleneck is Dijkstra's — it dominates the other two."*

**Step 4** — State the final answer:
> *"So overall time complexity is O of V plus E, times log V."*

**Step 5** — State space:
> *"Space complexity: the adjacency list is O of V plus E. The dist dictionary and visited set are O of V each. The heap can hold up to O of E entries in the worst case. So overall O of V plus E space."*

---

### Complexity Templates by Algorithm

| Algorithm | Time | Space | What to say |
|-----------|------|-------|-------------|
| Single loop | O(n) | O(1) | *"One pass through the array — O of en time, O of one extra space."* |
| Two nested loops | O(n²) | O(1) | *"Two nested loops, each up to N — O of en squared."* |
| Sort + loop | O(n log n) | O(1) or O(n) | *"The sort dominates at O of en log en. The rest is linear."* |
| BFS on graph | O(V + E) | O(V + E) | *"BFS visits each vertex and edge once — O of V plus E. Queue and visited set are O of V."* |
| Dijkstra's (binary heap) | O((V+E) log V) | O(V + E) | *"Each node popped once (V times), each edge relaxed once (E times), heap ops are log V each."* |
| DFS on tree | O(n) | O(h) | *"Visit every node once — O of en. Recursion depth is the tree height — O of h, O of en worst case for skewed."* |
| Binary search | O(log n) | O(1) | *"Halves the search space each step — O of log en."* |
| Sliding window | O(n) | O(1) | *"Each element enters and leaves the window at most once — O of en total, O of one space."* |
| Prefix sum build + query | O(n) build, O(1) query | O(n) | *"Building the prefix array is O of en. Each range query is O of one — a single subtraction."* |
| Heap top-K | O(n log k) | O(k) | *"Push N elements, heap size stays k — each push is log k. Total O of en log k."* |
| DP 1D | O(n) | O(n) or O(1) | *"One pass filling the DP table — O of en. Can reduce space to O of one with rolling variables."* |
| DP 2D (grid) | O(rows × cols) | O(rows × cols) | *"Fill every cell once — O of rows times cols. Can reduce to O of cols if rolling row."* |
| Backtracking (subsets) | O(2^n × n) | O(n) | *"2^N subsets, each takes O of N to build — O of two to the en times N. Recursion depth O of N."* |
| Trie insert/search | O(L) per operation | O(total chars) | *"Each insert/search traverses the word length L — O of L. Total space is all characters inserted."* |

---

## Offering Optimizations and Tradeoffs

After stating complexity, proactively offer a tradeoff:

> *"I could reduce space to O of one if I modified the input array in place — but that would mutate the caller's data. Depends on whether that's acceptable."*

> *"I could optimize the time to O of en by using a hash map instead of the sorted array, at the cost of losing order."*

> *"I chose BFS over DFS here because BFS guarantees the shortest path in an unweighted graph — DFS would find a path but not necessarily the shortest one."*

> *"The Dijkstra's approach handles positive weights. If we needed to support negative weights, we'd need Bellman-Ford — but that's slower at O of V times E."*

These voluntary tradeoff observations are a "Strong Hire" signal. They show you think about the full design space, not just the current solution.

---

## Narrating Code You Did NOT Write (Reading Given Code)

Occasionally the interviewer gives you code and asks questions about it. Use this process:

**Step 1** — Identify the data structure:
> *"The key structure here is... the heap (I see heapq.heappop). So this is some kind of priority-based traversal."*

**Step 2** — Identify the main loop:
> *"The main loop runs while the heap is non-empty — classic Dijkstra's / BFS pattern."*

**Step 3** — Trace the state:
> *"Let me trace with a small example to understand what the variables hold at each step..."*

**Step 4** — Answer the question:
> *"So the bug/optimization/edge case is... [answer]."*

Common things given code might be doing:
- `heapq.heappop` → priority queue extraction
- `deque.popleft` → BFS queue
- `stack.pop` → DFS or iterative backtracking
- `memo[state]` or `@lru_cache` → memoization
- `in_degree[node] -= 1` → Kahn's topological sort
- `for dr, dc in [(0,1),...]` → grid traversal

---

## Quick Checklist: Before You're Done Testing

```
□ Happy path traced in the doc (step-by-step, with state shown)
□ Empty input tested (or confirmed not possible by constraints)
□ Single element tested
□ All duplicates considered
□ Negative values considered (if applicable)
□ Target not present tested
□ Cycle handling verified (for graph problems)
□ Disconnected graph tested (for graph problems)
□ Time complexity stated (with derivation, not just the answer)
□ Space complexity stated
□ At least one optimization or tradeoff offered voluntarily
```

---

*References: interview-flow-summarized.md (Phase 5 complete, Phase 3 diagram + narration guidance), notes-summarized.md (Sections 5, 8, 11), Mock Interview - 45m - Sonnet4.6.md (Alex's complete Phase 5 trace: happy path + 5 edge cases + complexity analysis)*
