# Section 02 — Constraint Writing & Problem Framing

> Goal: Know exactly what to write in the Google Doc and in what order. This section teaches you how to read a problem, ask the right questions, write a professional constraint block, and derive edge cases from what you wrote.

---

## Why This Phase Matters More Than You Think

> **"This is the most skipped and most critical phase. Rushing past it is one of the top-cited rejection reasons."**
> — interview-flow-summarized.md

Spending the full 5 minutes on clarification is **time well spent**. Interviewers reward thoroughness here. Candidates who skip straight to coding almost always hit edge cases they didn't think about — and they look unprepared.

**The key insight:** The constraint block you write at the top of the doc becomes your written spec. It prevents mistakes. It shows you think before you code. It signals production-code habits.

---

## PHASE 2 — Problem Reception & Clarification `[Min 05–10]`

### Step 1 — Read Fully Before Speaking

When the problem appears in the doc or is spoken to you:
- Read it fully in silence. Take 20–30 seconds.
- Do NOT interrupt the interviewer while they're explaining.
- After they finish, take one more breath, then speak.

> *"One moment — let me read through this fully before I ask questions."*

**Important:** Some interviewers give the problem verbally only — there may be nothing on screen. If this happens, listen attentively, then immediately ask to restate.

---

### Step 2 — Restate the Problem in Your Own Words

Before asking any questions, restate the problem:

> *"Okay — let me make sure I understand what we're working with. So we have [input], and the goal is to [output description]. We want to return [format]. Does that capture it?"*

**Why this works:**
- Confirms you understood it correctly
- Gives the interviewer a chance to correct any misunderstanding early
- Buys you thinking time while sounding engaged

---

### Step 3 — Ask Structured Clarifying Questions

Ask questions in this order. Do NOT ask randomly — go through these categories systematically.

#### Category 1 — INPUT
These questions define what you're receiving:

| Question to ask | Spoken form |
|----------------|-------------|
| Size / range of N | *"What scale should I be designing for — how large can N be?"* |
| Value range | *"Can the values be negative? Can they be zero?"* |
| Empty / null input | *"Should I handle the case where the input is empty or null?"* |
| Duplicates | *"Can there be duplicate values in the input?"* |
| Sorted | *"Is the input sorted, or should I assume arbitrary order?"* |
| Graph: directed? | *"Is the graph directed or undirected?"* |
| Graph: weighted? | *"Are the edge weights positive, or can they be zero or negative?"* |
| Graph: cycles? | *"Can the graph have cycles, or is it a DAG?"* |
| Graph: connected? | *"Is the graph guaranteed to be connected?"* |
| String: character set | *"Are we working with only lowercase English letters, or can there be uppercase, numbers, or special characters?"* |

#### Category 2 — OUTPUT
These questions define what you need to return:

| Question to ask | Spoken form |
|----------------|-------------|
| Format | *"Should I return the index, the value, or a boolean?"* |
| Multiple answers | *"If multiple valid answers exist, can I return any one, or do you want all of them?"* |
| Specific ordering | *"Should the output be sorted, or is any order acceptable?"* |
| Return on failure | *"If no answer exists, should I return -1, null, an empty list, or raise an exception?"* |

#### Category 3 — CONSTRAINTS
These questions define performance expectations:

| Question to ask | Spoken form |
|----------------|-------------|
| Time complexity | *"Is there a target time complexity I should be designing toward?"* |
| Space complexity | *"Are there any memory constraints?"* |
| Optimization priority | *"Is the optimization priority time over space, or does it depend on the use case?"* |
| In-place modification | *"Can I modify the input array in place, or should I leave it unchanged?"* |
| Standard library | *"Can I use built-in library functions like sort(), or should I implement that from scratch?"* |

#### Category 4 — EDGE CASES (State Assumptions)
For things you're going to assume, state them explicitly and ask for confirmation:

> *"I'll assume the input won't be null or empty unless specified — is that okay?"*

> *"I'll assume all integers fit in a 32-bit signed integer range — is that right?"*

> *"I'll assume the graph won't have self-loops — should I also handle those?"*

---

### Step 4 — Write the Constraint Block in the Doc

After getting answers, write your constraint block as comments at the very top of the doc. Say:

> *"Let me just write these down in the doc so I have a reference while I code."*

#### The Universal Constraint Block Template

```python
# === CONSTRAINTS ===
# Input: [describe what you're given]
# N (size): [e.g., 1 ≤ N ≤ 10^5]
# Values: [e.g., -10^4 ≤ arr[i] ≤ 10^4, can be negative]
# Duplicates: [yes / no / ask]
# Sorted: [yes / no]
# Output: [what to return — index / value / boolean / list]
# Multiple answers: [return any one / return all / return first]
# Edge case: empty input → [return -1 / return [] / not possible]
# Edge case: single element → [describe]
# Edge case: [problem-specific edge case] → [describe]
# Time target: O([...]) | Space target: O([...])
```

#### Example — Filled in for a Graph Problem

```python
# === CONSTRAINTS ===
# Input: N routers (IDs 0 to N-1), list of connections [a, b, distance]
# N <= 10^4, edges <= 10^5
# All distances: positive integers (no negatives, no zero)
# Graph: undirected, can have cycles, at most one edge per pair
# Output: boolean (True/False)
# Edge case: src == dst → return True immediately
# Edge case: dst unreachable → return False
# Time target: O((V + E) log V) | Space target: O(V + E)
```

#### Example — Filled in for an Array Problem

```python
# === CONSTRAINTS ===
# Input: list of N integers
# N: 1 ≤ N ≤ 10^5
# Values: -10^4 ≤ arr[i] ≤ 10^4 (can be negative)
# Duplicates: possible
# Sorted: no
# Output: index of target, -1 if not found
# Edge case: empty list → return -1
# Edge case: target not in array → return -1
# Edge case: multiple occurrences → return first index
```

#### Example — Filled in for a Tree Problem

```python
# === CONSTRAINTS ===
# Input: root of binary tree, target value k
# Tree: standard binary tree (not necessarily BST or balanced)
# N nodes: up to 10^4
# Values: integers, may be negative
# Output: list of all nodes at depth k from target node
# Edge case: target not in tree → return []
# Edge case: empty tree (root is None) → return []
# Edge case: k = 0 → return [target] itself
```

---

### Step 5 — Trace One Concrete Example

After writing constraints, trace a simple example in the doc:

> *"Let me just walk through a quick example to make sure I have the right model..."*

Then write it:

```
Example: arr = [3, 1, 4, 1, 5], target = 4
Expected output: index 2
```

Then trace it verbally:
> *"So with this input, the target 4 is at position 2, so we'd return 2 — does that match your expectation?"*

**If you're wrong:** The interviewer will correct you here — before you've written any code. This is the best possible time to be corrected.

---

## Problem-Type Specific Question Checklists

### Arrays / Lists
```
□ What is the size range? (N ≤ 10^5? N ≤ 10^9?)
□ Can values be negative?
□ Can there be duplicates?
□ Is the array sorted?
□ Can I modify the array in place?
□ What to return for empty array?
□ What to return if answer doesn't exist?
□ Are indices 0-based or 1-based? (usually 0-based in Python)
```

### Graphs
```
□ Directed or undirected?
□ Are there cycles?
□ Are edges weighted? Positive only, or can be negative?
□ Can there be multiple edges between the same pair?
□ Is the graph guaranteed to be connected?
□ Are there self-loops?
□ What are the node IDs? (integers 0 to N-1, or arbitrary strings?)
□ What to return if destination is unreachable?
□ What to return if src == dst?
```

### Trees
```
□ Is it a binary tree, BST, or n-ary tree?
□ Is it guaranteed to be balanced?
□ Can values repeat in the tree?
□ Can the root be null (empty tree)?
□ Is there a parent pointer, or only children?
□ For BST: is the BST property guaranteed?
□ What to return for empty tree?
```

### Dynamic Programming / Backtracking
```
□ What are the state dimensions? (1D? 2D? on a grid?)
□ What are the base cases?
□ What does each state represent?
□ Is there a maximum recursion depth concern?
□ Should I return just the optimal value, or also the path?
□ Are there constraints on the number of moves/operations?
```

### Strings
```
□ Only lowercase letters, or can there be uppercase, numbers, spaces?
□ Are there special characters or Unicode?
□ Is the string empty a valid input?
□ Is the comparison case-sensitive?
□ Can there be leading/trailing spaces?
□ Are there length constraints?
```

### Heaps / Priority Queues
```
□ What is K? Can K exceed array size?
□ Should ties be broken in any specific way?
□ Is there a stream of inputs or a fixed array?
□ Is the data sorted, partially sorted, or arbitrary?
□ Do elements get added/removed dynamically?
```

---

## The Hint-Reading Table: Constraint → Algorithm

> When the interviewer gives you a constraint, they are often hinting at what algorithm complexity they expect. Use this table to decode it.

| N constraint | What it implies | Algorithms to consider |
|-------------|----------------|----------------------|
| N ≤ 10–12 | O(n!) or O(2^n) is fine | Brute force, full backtracking, all permutations |
| N ≤ 20–25 | O(2^n) is acceptable | Bitmask DP, subset enumeration, exponential search |
| N ≤ 100 | O(n³) is fine | Floyd-Warshall (all-pairs shortest path), 3-nested loops |
| N ≤ 1,000 | O(n²) is fine | Two nested loops, basic DP, insertion sort |
| N ≤ 10,000 | O(n²) is borderline | Aim for O(n log n) or O(n√n) |
| N ≤ 100,000 | Need O(n log n) or better | Merge sort, binary search, BFS/DFS, Dijkstra's, heaps |
| N ≤ 1,000,000 | Need O(n) or O(n log n) | Sliding window, two pointers, hash map, prefix sums |
| N ≤ 10^9 | Need O(log n) or O(1) | Binary search on answer space, mathematical formula |

**Also watch for:**
- **Positive weights on a graph + shortest path** → Dijkstra's (not BFS)
- **Negative weights allowed** → Bellman-Ford (rare at L3)
- **"Top K" in the problem** → heap (O(n log k))
- **"All unique subsets" or "all permutations"** → backtracking
- **"Prefix sum" or "range query"** → prefix array, possibly segment tree
- **Grid / matrix with BFS** → typically O(rows × cols)
- **"Count distinct"** → hash set or sort+count

---

## PHASE 5 — Deriving Edge Cases from Your Constraints `[Min 35–42]`

Once your constraint block is written, you can **systematically derive edge cases from it** during testing. Go through each constraint line and ask "what is the extreme value of this?"

### Derivation Formula

| Constraint you wrote | Edge case to test |
|---------------------|------------------|
| `N: 1 ≤ N ≤ 10^5` | N = 1 (single element), N = 10^5 (max, usually no need to test manually but think about overflow) |
| `Values: -10^4 ≤ arr[i] ≤ 10^4` | All negatives, all zeros, mix of positive/negative |
| `Duplicates: possible` | All elements are the same |
| `Sorted: no` | Already sorted (ascending), reverse sorted (descending) |
| `Edge case: empty → -1` | Actually test `arr = []` — does your code return -1 correctly? |
| `Edge case: src == dst` | Test it — does your guard clause fire at the right place? |
| `Graph: can have cycles` | Create a small cycle (0→1→2→0) and verify no infinite loop |
| `Graph: can be disconnected` | dst is in a component src can't reach → return False/empty |
| `Target not found` | What happens when the target never appears in the input? |

### Standard Edge Case List (Memorize These)

```
1. Empty input (empty array / null / empty string / empty graph)
2. Single element (n = 1 / tree with only root)
3. All duplicates (all values the same)
4. All negative values
5. Target is not present in the input
6. src == dst (source equals destination)
7. Minimum boundary value (e.g., arr[i] = -10^4)
8. Maximum boundary value (e.g., arr[i] = 10^4)
9. Graph with a cycle → verify visited prevents infinite loop
10. Graph that is disconnected → verify unreachable returns correct value
11. Already sorted input (ascending)
12. Reverse sorted input (descending)
13. k = 0 or k > n (for top-K type problems)
```

---

## Quick Decision: What to Ask vs. What to Assume

| Situation | Ask or assume? |
|-----------|---------------|
| Input could be null/empty | Ask: *"Should I handle empty input?"* |
| Values are non-negative | Ask: *"Can values be negative?"* |
| N fits in 32-bit int | Usually assume, but say so: *"I'll assume N fits in a standard integer."* |
| Array is unsorted | Usually assume unsorted unless told otherwise |
| Graph edges are positive | Ask: *"Are edge weights all positive?"* (critical for Dijkstra's vs. BFS vs. Bellman-Ford) |
| Return format is ambiguous | Always ask: *"Should I return the index or the value?"* |
| Multiple valid answers | Always ask: *"If multiple valid answers exist, can I return any one?"* |

---

## Mini-Drill: Practice This Each Session

Before each practice problem, do this in 3 minutes:

1. Write the constraint block in a doc (even for familiar problems)
2. Ask yourself all 4 question categories out loud
3. Trace one example and verify expected output
4. List 3 edge cases from the constraints

Over time, this becomes muscle memory and you will do it automatically in the interview.

---

*References: interview-flow-summarized.md (Phase 2 detailed steps), notes-summarized.md (Section 11 tips: clarify before coding), Mock Interview - 45m - Sonnet4.6.md (Alex's constraint block and questioning approach)*
