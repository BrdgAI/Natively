# Section 08 — Data Structures & Algorithms Guide

> Goal: Understand every commonly asked data structure and algorithm deeply enough that you know WHEN to use it, WHY it works, WHAT types/variants exist, and can write the basic skeleton from memory. This is your "learn from scratch" reference — not just syntax, but understanding.

---

## How to Use This Section

This section is different from Section 03 (which gives you raw Python syntax). This section explains:
- **What** the structure is and how it works conceptually
- **Types/variants** you might encounter
- **When to use it** (and when NOT to)
- **The core properties** that make it work
- **A bare-bones skeleton** you can learn
- **Common Google question patterns** for each

**Study strategy:** Read one sub-chapter per day. Draw it on paper. Then implement the skeleton from memory without looking.

---

## Ranked by Frequency at Google L3

```
RANK 1  → Graphs (BFS / DFS)               ← appear in ~40% of rounds
RANK 2  → Trees                             ← appear in ~35% of rounds
RANK 3  → Hash Maps / Hash Sets             ← used in majority of solutions
RANK 4  → Arrays & Strings                  ← two pointers, sliding window, prefix
RANK 5  → Binary Search                     ← especially on answer space
RANK 6  → Dynamic Programming               ← 1D/2D DP, memoization
RANK 7  → Heaps / Priority Queues           ← top-K, scheduling
RANK 8  → Backtracking                      ← subsets, permutations
RANK 9  → Greedy                            ← interval scheduling
RANK 10 → Tries                             ← prefix matching
RANK 11 → Union-Find                        ← connectivity
RANK 12 → Monotonic Stack                   ← next greater element
RANK 13 → Bit Manipulation                  ← mostly OA, rare in onsite
```

---

## 1. Arrays & Strings

### What it is
An **array** is a contiguous block of memory holding elements of the same type. In Python, `list` is the array. Each element is accessible by index in O(1).

A **string** is an immutable sequence of characters. Most array patterns apply to strings too — sliding window, two pointers, prefix sums.

### Core Properties
- Index access: O(1)
- Append to end: O(1) amortized
- Insert/delete at position i: O(n) — must shift elements
- Search (unsorted): O(n)
- Search (sorted): O(log n) with binary search

### Types / Variants
| Variant | Description |
|---------|-------------|
| Unsorted array | Most general case |
| Sorted array | Enables binary search, two pointers |
| Circular array | Modulo indexing |
| Prefix sum array | Built for range queries |
| Subarray problem | Contiguous slice with a property |
| Substring problem | Contiguous characters in string |

### When to Use Arrays
- When you need O(1) index access
- When order matters and you need to iterate
- As a backing structure for sliding window / two pointer

### When NOT to Use Arrays
- When you need O(1) search by value → use hash set/map
- When you need O(1) insert/delete at front → use deque
- When you need sorted order + fast insert → use sorted list or heap

### Visual
```
Index:  0    1    2    3    4
Value: [3,   1,   4,   1,   5]
        ^              ^
       left          right
       (two pointer example)
```

### Core Patterns

**Two Pointers:**
```python
left, right = 0, len(arr) - 1
while left < right:
    # process arr[left] and arr[right]
    if condition_to_move_left:
        left += 1
    else:
        right -= 1
```

**Sliding Window (fixed size k):**
```python
window = sum(arr[:k])
for i in range(k, len(arr)):
    window += arr[i] - arr[i - k]
    # check window
```

**Prefix Sum:**
```python
prefix = [0] * (n + 1)
for i in range(n):
    prefix[i+1] = prefix[i] + arr[i]
# range sum [l, r] = prefix[r+1] - prefix[l]
```

### Common Google Question Patterns
- Two Sum, Three Sum (two pointers + sort or hash map)
- Maximum sum subarray of length K (sliding window)
- Minimum window substring (variable sliding window)
- Trapping rain water (two pointers or stack)
- Product of array except self (prefix + suffix product)
- Interval merging (sort by start, then greedy merge)

---

## 2. Hash Maps & Hash Sets

### What it is
A **hash map** (dict in Python) maps keys to values. A **hash set** stores unique values. Both use a hash function to find the bucket a key belongs to, giving O(1) average for insert, lookup, and delete.

### Core Properties
- Insert: O(1) average
- Lookup: O(1) average
- Delete: O(1) average
- Space: O(n)
- Ordered? No (Python dict maintains insertion order since 3.7, but don't rely on it for algorithm logic)

### Why it Works
The hash function converts a key to an integer index in an array. Collisions are handled with chaining or open addressing. In practice, assume O(1) unless told otherwise.

### Types / Variants
| Type | Python | Use case |
|------|--------|---------|
| Regular dict | `{}` or `dict()` | General key-value |
| defaultdict(list) | `defaultdict(list)` | Adjacency list, grouping |
| defaultdict(int) | `defaultdict(int)` | Frequency counting |
| Counter | `Counter(arr)` | Frequency counting with extras |
| Set | `set()` | Unique membership check |
| frozenset | `frozenset()` | Hashable set (usable as dict key) |

### When to Use Hash Map/Set
- "Have I seen this before?" → hash set
- "How many times have I seen X?" → Counter / defaultdict(int)
- "What is the index/value of X?" → hash map
- Replacing an O(n) array search with O(1)
- Building adjacency lists for graphs

### Visual
```
Key → Hash Function → Bucket Index → Value

"apple" → hash() → bucket 3 → 5
"banana" → hash() → bucket 7 → 12
```

### Skeleton
```python
from collections import defaultdict, Counter

# Frequency count
freq = Counter(arr)               # {val: count}
freq = defaultdict(int)
for x in arr:
    freq[x] += 1

# Grouping (e.g., anagram groups)
groups = defaultdict(list)
for word in words:
    key = tuple(sorted(word))
    groups[key].append(word)

# Two-sum pattern
seen = {}
for i, val in enumerate(arr):
    complement = target - val
    if complement in seen:
        return [seen[complement], i]
    seen[val] = i
```

### Common Google Question Patterns
- Two Sum / Four Sum
- Group Anagrams
- Longest consecutive sequence
- Subarray sum equals K (prefix sum + hash map)
- First non-repeating character

---

## 3. Graphs

### What it is
A **graph** is a set of **nodes (vertices)** connected by **edges**. It is the most general data structure — trees, linked lists, and grids are all special cases of graphs.

### Core Properties
- V = number of vertices (nodes)
- E = number of edges
- A graph can be: directed or undirected, weighted or unweighted, cyclic or acyclic

### Types of Graphs
| Type | Description | Example |
|------|-------------|---------|
| **Undirected** | Edges go both ways | Social network friendships |
| **Directed** | Edges have one direction | Twitter follow, web links |
| **Weighted** | Edges have a cost/distance | Road maps, network latency |
| **Unweighted** | All edges equal | Social graph, grid |
| **DAG** | Directed, no cycles | Task dependencies, course prereqs |
| **Tree** | Connected, undirected, no cycles | File system, org chart |
| **Grid/Matrix** | 2D array treated as a graph | Islands, shortest path in maze |
| **Dense** | E ≈ V² | Many connections, use adjacency matrix |
| **Sparse** | E ≈ V | Few connections, use adjacency list |

### Representation
```
Adjacency List (default choice — O(V+E) space):
graph = {
    0: [(1, 3), (2, 7)],   # node 0 connects to 1 (weight 3) and 2 (weight 7)
    1: [(0, 3), (3, 2)],
    2: [(0, 7)],
    3: [(1, 2)]
}

Adjacency Matrix (for dense graphs — O(V²) space):
matrix[i][j] = weight of edge from i to j (0 if no edge)
```

### When to Use Which Algorithm
| Problem | Algorithm | Why |
|---------|-----------|-----|
| Shortest path, unweighted | BFS | Layer-by-layer guarantees minimum hops |
| Shortest path, positive weights | Dijkstra's | Min-heap always picks cheapest next node |
| Shortest path, negative weights | Bellman-Ford | Relaxes all edges V-1 times |
| All-pairs shortest path | Floyd-Warshall | O(V³) DP over all node triples |
| Topological ordering | Kahn's (BFS) or DFS | For DAGs only — orders by dependencies |
| Connected components | BFS or DFS | Flood-fill each unvisited node |
| Cycle detection | DFS with colors (directed) or visited set (undirected) | |
| Minimum spanning tree | Prim's or Kruskal's | Greedy edge selection |

---

### Algorithm: BFS (Breadth-First Search)

**What it does:** Explores the graph level by level from a start node. The first time you reach a node, it is the shortest path (in an unweighted graph).

**How it works:**
1. Put start node in a queue, mark it visited
2. While queue not empty: pop a node, process it, add all unvisited neighbors to queue
3. When you pop the target, the distance is the shortest path

**When to use:**
- Shortest path in unweighted graphs
- Level-order problems ("all nodes at distance k")
- "Is there a path from A to B?"
- Connected components in a grid

**Complexity:** O(V + E) time, O(V) space

```
Visual: graph 0-1-2-3 (linear)

BFS from 0:
Queue: [0]       visited: {0}
Pop 0 → Queue: [1]       visited: {0,1}
Pop 1 → Queue: [2]       visited: {0,1,2}
Pop 2 → Queue: [3]       visited: {0,1,2,3}
Pop 3 → done
```

**Skeleton:**
```python
from collections import deque

def bfs(graph, start, target):
    queue = deque([(start, 0)])    # (node, distance)
    visited = {start}
    
    while queue:
        node, dist = queue.popleft()
        if node == target:
            return dist
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, dist + 1))
    
    return -1   # not reachable
```

---

### Algorithm: DFS (Depth-First Search)

**What it does:** Explores as deep as possible before backtracking. Good for finding paths, detecting cycles, and topological ordering.

**How it works:**
- Recursive: call DFS on each unvisited neighbor, then return
- Iterative: use an explicit stack instead of the call stack

**When to use:**
- Finding any path (not necessarily shortest)
- Cycle detection
- Topological sort
- Connected components
- Tree traversal (all tree DFS is just graph DFS on a tree-shaped graph)

**Complexity:** O(V + E) time, O(V) space (call stack)

```
Visual: graph 0→1→3, 0→2

DFS from 0 (recursive):
  Visit 0 → Visit 1 → Visit 3 (leaf, backtrack)
           → backtrack to 0 → Visit 2 (leaf, backtrack)
  → done

Order visited: 0, 1, 3, 2
```

**Skeleton:**
```python
def dfs(graph, node, visited=None):
    if visited is None:
        visited = set()
    visited.add(node)
    
    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs(graph, neighbor, visited)
    
    return visited
```

---

### Algorithm: Dijkstra's

**What it does:** Finds shortest paths from a source to all other nodes in a graph with non-negative edge weights.

**Key insight:** A min-heap always gives you the next unprocessed node with the smallest known distance. The first time you pop a node, that distance is final (because all weights are positive, no future path can be shorter).

**When to use:**
- Shortest path when edges have different positive weights
- "Minimum cost to reach X from Y"

**When NOT to use:**
- Unweighted graphs → use BFS instead (faster)
- Negative weights → use Bellman-Ford instead

**Complexity:** O((V + E) log V) with a binary heap

**Skeleton:**
```python
import heapq

def dijkstra(graph, src, n):
    dist = [float('inf')] * n
    dist[src] = 0
    heap = [(0, src)]        # (distance, node)
    
    while heap:
        d, node = heapq.heappop(heap)
        if d > dist[node]:   # stale entry
            continue
        for neighbor, weight in graph[node]:
            if dist[node] + weight < dist[neighbor]:
                dist[neighbor] = dist[node] + weight
                heapq.heappush(heap, (dist[neighbor], neighbor))
    
    return dist
```

---

### Algorithm: Topological Sort (Kahn's Algorithm)

**What it does:** Orders a DAG so that every node comes before all nodes it points to. Used for dependency ordering.

**Key insight:** A node with in-degree 0 has no dependencies — it can go first. After processing it, decrement its neighbors' in-degrees. If a neighbor's in-degree hits 0, it's ready.

**When to use:**
- "Can you complete all courses given prerequisites?"
- "What order should tasks be done?"
- "Is there a valid ordering?" (detecting cycles in directed graphs)

**Complexity:** O(V + E) time and space

**Skeleton:**
```python
from collections import deque

def topological_sort(n, edges):
    graph = [[] for _ in range(n)]
    in_degree = [0] * n
    
    for a, b in edges:
        graph[a].append(b)
        in_degree[b] += 1
    
    queue = deque([i for i in range(n) if in_degree[i] == 0])
    order = []
    
    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
    
    return order if len(order) == n else []  # empty = cycle exists
```

---

### Algorithm: Union-Find (Disjoint Set Union)

**What it does:** Tracks which nodes are in the same connected component. Supports two operations: `find(x)` (which component is x in?) and `union(x, y)` (merge the components of x and y).

**Key insight:** Each component has a "representative" (root). Path compression and union by rank make both operations nearly O(1) amortized.

**When to use:**
- "Are nodes A and B connected?"
- "How many connected components are there?"
- Kruskal's Minimum Spanning Tree
- Detecting cycles in undirected graphs

**Complexity:** O(α(n)) per operation (α = inverse Ackermann, practically O(1))

**Skeleton:**
```python
class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n
        self.components = n
    
    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # path compression
        return self.parent[x]
    
    def union(self, x, y):
        px, py = self.find(x), self.find(y)
        if px == py:
            return False   # already connected
        if self.rank[px] < self.rank[py]:
            px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]:
            self.rank[px] += 1
        self.components -= 1
        return True
```

---

## 4. Trees

### What it is
A **tree** is a connected, undirected graph with no cycles. It has exactly V-1 edges for V nodes. In coding interviews, trees are almost always **rooted** (one special node is the "root") and **directed downward** (parent → children).

A **binary tree** means each node has at most 2 children (left and right). A **BST** (Binary Search Tree) is a binary tree where left child < parent < right child.

### Core Properties
- N nodes → N-1 edges
- Exactly one path between any two nodes
- Height: longest root-to-leaf path
- Depth of a node: distance from root

### Types of Trees
| Type | Description | Key property |
|------|-------------|-------------|
| **Binary Tree** | Each node has ≤ 2 children | Most common interview type |
| **Binary Search Tree (BST)** | left < root < right | O(log n) search if balanced |
| **Balanced BST** | Height is O(log n) | Ensures O(log n) operations |
| **N-ary Tree** | Each node has any number of children | `node.children` is a list |
| **Complete Binary Tree** | All levels full except possibly last | Used in heaps |
| **Perfect Binary Tree** | All leaves at same level | Exactly 2^h - 1 nodes |
| **Trie (Prefix Tree)** | Each edge is a character | String/prefix problems |
| **Segment Tree** | Range query + update | Rare at L3 |

### Traversals — The Most Important Concept

```
        1
       / \
      2   3
     / \
    4   5

Inorder  (Left-Root-Right): 4, 2, 5, 1, 3  ← gives sorted order in BST
Preorder (Root-Left-Right): 1, 2, 4, 5, 3  ← good for copying trees
Postorder(Left-Right-Root): 4, 5, 2, 3, 1  ← good for deletion, bottom-up computation
Level-order (BFS):          1, 2, 3, 4, 5  ← layer by layer
```

### When to Use Which Traversal
| Problem type | Use this |
|-------------|---------|
| BST sorted order / kth smallest | Inorder |
| Copy a tree / serialize | Preorder |
| Compute subtree values (height, sum) | Postorder |
| Level-by-level processing, min depth | Level-order (BFS) |
| Path from root to node | Preorder DFS |
| Diameter, max path sum | Postorder DFS with return values |

### Node Definition (Memorize)
```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class NaryNode:
    def __init__(self, val=None, children=None):
        self.val = val
        self.children = children or []
```

### Core Recursion Pattern (Memorize)
Almost all tree problems follow this exact shape:
```python
def solve(node):
    if not node:                      # base case: null node
        return BASE_VALUE
    
    left_result = solve(node.left)    # recurse left
    right_result = solve(node.right)  # recurse right
    
    # combine results to compute this node's answer
    return COMBINE(node.val, left_result, right_result)
```

Examples:
```python
# Height of tree
def height(node):
    if not node: return 0
    return 1 + max(height(node.left), height(node.right))

# Sum of all nodes
def tree_sum(node):
    if not node: return 0
    return node.val + tree_sum(node.left) + tree_sum(node.right)

# Count nodes
def count(node):
    if not node: return 0
    return 1 + count(node.left) + count(node.right)
```

### Skeletons

**Inorder (recursive):**
```python
def inorder(root, result=[]):
    if root:
        inorder(root.left, result)
        result.append(root.val)
        inorder(root.right, result)
    return result
```

**Level-order (BFS):**
```python
from collections import deque
def level_order(root):
    if not root: return []
    result, queue = [], deque([root])
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)
            if node.left: queue.append(node.left)
            if node.right: queue.append(node.right)
        result.append(level)
    return result
```

**LCA (Lowest Common Ancestor):**
```python
def lca(root, p, q):
    if not root or root == p or root == q: return root
    left = lca(root.left, p, q)
    right = lca(root.right, p, q)
    return root if (left and right) else (left or right)
```

### Common Google Question Patterns
- Maximum depth / minimum depth of binary tree
- Validate BST
- Binary tree diameter (longest path between any two nodes)
- Symmetric tree / mirror tree
- Serialize and deserialize a binary tree
- Path sum (does any root-to-leaf path equal target?)
- LCA of two nodes
- Construct tree from inorder + preorder

---

## 5. Binary Search

### What it is
**Binary search** finds a target in a sorted space by repeatedly halving the search range. Every step eliminates half the remaining candidates.

### Core Property
Requires a **monotonic** space: an ordering where once something is False, everything after it is also False (or vice versa). If you can phrase your problem as "find the first/last position where a condition is True/False," binary search applies.

### Types of Binary Search
| Type | Description |
|------|-------------|
| **Classic** | Find exact value in sorted array |
| **Left boundary** | Find first position where condition is True |
| **Right boundary** | Find last position where condition is True |
| **Answer space** | Binary search on the range of answers, not the array itself |
| **On strings** | Binary search on length or index of a pattern |

### When to Use Binary Search
- Sorted array with a target value
- "Minimum X such that condition Y holds" → binary search on the answer
- The constraint says N ≤ 10^9 → you definitely need O(log n)
- The sorted property of input appears in the constraints
- "How many X satisfy condition Y?" (can often be binary searched)

### Visual
```
arr = [1, 3, 5, 7, 9, 11], target = 7

Step 1: left=0, right=5, mid=2 → arr[2]=5 < 7 → left = mid+1 = 3
Step 2: left=3, right=5, mid=4 → arr[4]=9 > 7 → right = mid-1 = 3
Step 3: left=3, right=3, mid=3 → arr[3]=7 == 7 → return 3 ✓
```

### Skeleton (Classic)
```python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = left + (right - left) // 2    # prevents overflow
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
```

### Skeleton (Answer Space — Most Common at Google)
```python
def find_min_valid(lo, hi, is_valid):
    # Find the smallest value in [lo, hi] where is_valid(x) is True
    while lo < hi:
        mid = (lo + hi) // 2
        if is_valid(mid):
            hi = mid          # mid works, try to go smaller
        else:
            lo = mid + 1      # mid doesn't work, go larger
    return lo
```

### Common Google Question Patterns
- Find first/last position of target in sorted array
- Search in rotated sorted array
- Koko eating bananas (binary search on answer)
- Minimum days to make bouquets (binary search on answer)
- Binary search on strings (find smallest valid substring length)
- Find peak element

---

## 6. Dynamic Programming (DP)

### What it is
**Dynamic Programming** solves optimization problems by breaking them into overlapping subproblems and storing solutions to avoid recomputation.

### Two Conditions Required for DP
1. **Optimal substructure:** The optimal solution is built from optimal solutions of subproblems
2. **Overlapping subproblems:** The same subproblem occurs multiple times

If only condition 1 holds → use greedy. If only condition 2 holds → use memoization without optimization.

### Types of DP
| Type | Description | Example problems |
|------|-------------|-----------------|
| **1D DP** | State is a single index | Fibonacci, climbing stairs, house robber |
| **2D DP** | State is two indices | Grid paths, edit distance, LCS |
| **DP on strings** | Comparing/modifying two strings | Edit distance, longest common subsequence |
| **DP on trees** | Recursion + memoization on tree structure | Tree diameter, max path sum |
| **DP + binary search** | Optimize inner loop with binary search | LIS, jump game variants |
| **Bitmask DP** | State encodes subset as integer bitmask | Traveling salesman, assignment problem |
| **Interval DP** | State is a range [i, j] | Matrix chain multiplication, burst balloons |

### Two Approaches: Top-Down vs Bottom-Up
```
Top-Down (Memoization):
  - Start from the original problem, recurse to subproblems
  - Cache results in a dict/array
  - Uses Python's @lru_cache or explicit memo dict
  - More intuitive, but has recursion overhead

Bottom-Up (Tabulation):
  - Start from base cases, fill table toward the original problem
  - Uses a DP table (array)
  - No recursion stack, usually faster
  - Requires figuring out the correct fill order
```

### The 4-Step DP Design Process
1. **Define the state:** What does `dp[i]` or `dp[i][j]` represent?
2. **Write the recurrence:** How does state `i` depend on smaller states?
3. **Identify base cases:** What is the smallest valid input with a known answer?
4. **Determine the answer:** Is it `dp[n]`? `dp[n-1][m-1]`? `max(dp)`?

### Visual — 1D DP (Climbing Stairs)
```
Problem: n stairs, can climb 1 or 2 at a time. How many ways to reach top?

State: dp[i] = number of ways to reach stair i
Recurrence: dp[i] = dp[i-1] + dp[i-2]  (came from 1 below OR 2 below)
Base cases: dp[0] = 1 (one way to be at ground), dp[1] = 1

i:    0  1  2  3  4  5
dp:   1  1  2  3  5  8
```

### Visual — 2D DP (Grid Min Path Sum)
```
grid = [[1,3,1],    dp = [[1, 4, 5],
        [1,5,1],          [2, 7, 6],
        [4,2,1]]          [6, 8, 7]]

dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])
Answer: dp[2][2] = 7
```

### Skeletons

**Top-down (memoization):**
```python
from functools import lru_cache

def solve(n):
    @lru_cache(maxsize=None)
    def dp(i):
        if i <= 1:          # base case
            return i
        return dp(i-1) + dp(i-2)    # recurrence
    return dp(n)
```

**Bottom-up (1D):**
```python
def solve(n):
    dp = [0] * (n + 1)
    dp[0], dp[1] = 1, 1      # base cases
    for i in range(2, n + 1):
        dp[i] = dp[i-1] + dp[i-2]   # recurrence
    return dp[n]
```

**Bottom-up (2D grid):**
```python
def min_path(grid):
    rows, cols = len(grid), len(grid[0])
    dp = [[0]*cols for _ in range(rows)]
    dp[0][0] = grid[0][0]
    for c in range(1, cols):
        dp[0][c] = dp[0][c-1] + grid[0][c]
    for r in range(1, rows):
        dp[r][0] = dp[r-1][0] + grid[r][0]
    for r in range(1, rows):
        for c in range(1, cols):
            dp[r][c] = grid[r][c] + min(dp[r-1][c], dp[r][c-1])
    return dp[rows-1][cols-1]
```

### Common Google Question Patterns
- Climbing stairs, house robber (1D DP)
- Coin change, jump game (1D DP optimization)
- Unique paths, minimum path sum (2D DP on grid)
- Longest common subsequence, edit distance (2D DP on strings)
- Word break (1D DP + hash set)
- Longest increasing subsequence (DP + binary search)
- Parallel courses III (DP on DAG / topological sort + DP)

---

## 7. Heaps / Priority Queues

### What it is
A **heap** is a complete binary tree that maintains the **heap property**: in a min-heap, every parent is smaller than its children. This guarantees the minimum element is always at the root and accessible in O(1).

### Core Properties
- Get min (or max): O(1)
- Insert: O(log n)
- Remove min (or max): O(log n)
- Build heap from array: O(n)

### Types
| Type | Description | Python |
|------|-------------|--------|
| **Min-heap** | Smallest element at root | `heapq` (default) |
| **Max-heap** | Largest element at root | Negate values with `heapq` |
| **Priority queue** | Abstract interface to a heap | `heapq` or `queue.PriorityQueue` |

### When to Use a Heap
- "Find the k-th largest/smallest"
- "Always process the cheapest/most urgent item next"
- Dijkstra's algorithm
- Merge K sorted lists/arrays
- Task scheduling
- "Running median" (two heaps)

### When NOT to Use a Heap
- When you need sorted order of ALL elements → sort instead (O(n log n) but simpler)
- When you only need min/max once → just use min()/max()
- When the dataset is small → sorting is cleaner

### Visual
```
Min-heap:
        1
       / \
      3   2
     / \ / \
    7  4 5  6

Array representation: [1, 3, 2, 7, 4, 5, 6]
Parent of i: (i-1)//2
Left child of i: 2i+1
Right child of i: 2i+2
```

### Skeleton
```python
import heapq

# Min-heap (default)
heap = []
heapq.heappush(heap, 5)
heapq.heappush(heap, 1)
smallest = heapq.heappop(heap)      # 1

# Max-heap: negate values
heapq.heappush(heap, -5)
largest = -heapq.heappop(heap)      # 5

# Build from list
arr = [3, 1, 4, 1, 5]
heapq.heapify(arr)                  # O(n) in-place

# Top-K pattern
import heapq
def top_k(nums, k):
    return heapq.nlargest(k, nums)  # simple but O(n log k)

# Manual top-K with min-heap of size k
def top_k_manual(nums, k):
    heap = []
    for num in nums:
        heapq.heappush(heap, num)
        if len(heap) > k:
            heapq.heappop(heap)     # remove smallest
    return list(heap)
```

### Common Google Question Patterns
- K-th largest element in array
- Top K frequent elements
- Merge K sorted lists
- Find median from data stream (two heaps)
- Task scheduler
- Dijkstra's shortest path

---

## 8. Backtracking

### What it is
**Backtracking** is a recursive algorithm that builds a solution incrementally, abandoning (backtracking) partial solutions as soon as it determines they cannot lead to a valid complete solution.

It is essentially DFS with a "undo" step.

### Core Pattern
```
for each choice at current step:
    make choice
    recurse to next step
    undo choice (backtrack)
```

### Types of Backtracking Problems
| Type | Description | Example |
|------|-------------|---------|
| **Subsets** | All subsets of a set | Power set, combination sum |
| **Permutations** | All orderings | String permutations, anagram search |
| **Combinations** | Choose k from n | Combinations, phone number letters |
| **Constraint satisfaction** | Fill in values satisfying rules | N-Queens, Sudoku |
| **Word search** | Navigate a grid following a pattern | Word Search on a board |

### When to Use Backtracking
- "Find ALL valid solutions" (not just one)
- "Generate all combinations/permutations"
- N is small (≤ 20–25) — backtracking is O(2^n) or O(n!)
- Problem says "return all..." or "count all..."

### Visual (Subsets of [1,2,3])
```
Start: []
  Include 1: [1]
    Include 2: [1,2]
      Include 3: [1,2,3] ← RESULT
      Skip 3:   [1,2]    ← RESULT
    Skip 2: [1]
      Include 3: [1,3]   ← RESULT
      Skip 3:   [1]      ← RESULT
  Skip 1: []
    ... (same pattern for 2, 3)
```

### Skeleton (Subsets)
```python
def subsets(nums):
    result = []
    
    def backtrack(start, current):
        result.append(current[:])      # record current subset
        
        for i in range(start, len(nums)):
            current.append(nums[i])    # make choice
            backtrack(i + 1, current)  # recurse
            current.pop()              # undo choice (backtrack)
    
    backtrack(0, [])
    return result
```

### Skeleton (Permutations)
```python
def permutations(nums):
    result = []
    
    def backtrack(current, remaining):
        if not remaining:
            result.append(current[:])
            return
        for i in range(len(remaining)):
            current.append(remaining[i])
            backtrack(current, remaining[:i] + remaining[i+1:])
            current.pop()
    
    backtrack([], nums)
    return result
```

### Common Google Question Patterns
- Subsets / Subsets II (with duplicates)
- Combination sum
- Permutations
- Phone number letter combinations
- N-Queens
- Word search on grid
- Palindrome partitioning

---

## 9. Greedy Algorithms

### What it is
A **greedy** algorithm makes the locally optimal choice at each step, hoping (and being able to prove) that this leads to a globally optimal solution.

### Key Distinction from DP
- **DP:** explores multiple options and takes the best
- **Greedy:** takes the best option locally and never reconsiders

Not all problems are solvable with greedy. The technique works when you can prove the **greedy property**: a local optimal choice is also a global optimal choice.

### When to Use Greedy
- Interval scheduling problems
- "What is the minimum number of X needed to cover all Y?"
- Problems where sorting + iterating gives the answer
- When you can prove taking the largest/smallest available option is always optimal

### Common Greedy Patterns
| Pattern | Example |
|---------|---------|
| Sort then greedily pick | Interval merging, activity selection |
| Always pick the local minimum | Dijkstra's, Prim's |
| Two pointer greedy | Container with most water |
| Greedy string building | Removing K digits to minimize result |

### Skeleton (Interval Merging)
```python
def merge_intervals(intervals):
    intervals.sort(key=lambda x: x[0])    # sort by start time
    merged = [intervals[0]]
    
    for start, end in intervals[1:]:
        if start <= merged[-1][1]:         # overlaps with last merged
            merged[-1][1] = max(merged[-1][1], end)   # extend
        else:
            merged.append([start, end])    # no overlap, new interval
    
    return merged
```

---

## 10. Tries (Prefix Trees)

### What it is
A **Trie** is a tree where each node represents a character. A path from root to a node spells a prefix. A path from root to a marked node (`is_end = True`) spells a complete word.

### Core Properties
- Insert: O(L) where L = word length
- Search: O(L)
- Prefix check: O(L)
- Space: O(total characters across all words)

### When to Use a Trie
- "Does any word start with prefix X?" (autocomplete)
- "Find all words matching a prefix"
- "Count words with a given prefix"
- String problems where prefix matching is repeated

### Visual
```
Words: ["cat", "car", "card", "care"]

       root
        |
        c
        |
        a
       / \
      t   r
    (end) |
         / \
        d   e
      (end) (end)
```

### Skeleton (Full Trie Class)
```python
class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()
    
    def insert(self, word):
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.is_end = True
    
    def search(self, word):
        node = self.root
        for ch in word:
            if ch not in node.children:
                return False
            node = node.children[ch]
        return node.is_end
    
    def starts_with(self, prefix):
        node = self.root
        for ch in prefix:
            if ch not in node.children:
                return False
            node = node.children[ch]
        return True
```

---

## 11. Stacks & Monotonic Stack

### What a Stack Is
A **stack** is a LIFO (Last-In, First-Out) structure. The last element you push is the first one you pop. Used for: function call tracking, undo operations, DFS iteration, and monotonic stack patterns.

### What a Monotonic Stack Is
A **monotonic stack** is a stack where elements are always in sorted order (either increasing or decreasing). When you push a new element, you pop all elements that violate the monotonic property first.

### When to Use
- "Next greater element to the right of each element"
- "Number of days until a warmer temperature"
- "Largest rectangle in histogram"
- "Trapping rain water" (two-pass or stack)
- Any problem where you need to track the "most recent thing that satisfies a condition"

### Visual (Monotonic Stack — Next Greater Element)
```
arr = [2, 1, 5, 6, 2, 3]
stack = []  (stores indices, not values)

i=0 (val=2): stack empty → push 0. stack=[0]
i=1 (val=1): 1 < arr[0]=2 → push 1. stack=[0,1]
i=2 (val=5): 5 > arr[1]=1 → pop 1, result[1]=5. 5>arr[0]=2 → pop 0, result[0]=5. push 2. stack=[2]
i=3 (val=6): 6 > arr[2]=5 → pop 2, result[2]=6. push 3. stack=[3]
i=4 (val=2): 2 < arr[3]=6 → push 4. stack=[3,4]
i=5 (val=3): 3 > arr[4]=2 → pop 4, result[4]=3. 3 < arr[3]=6 → push 5. stack=[3,5]

result = [5, 5, 6, -1, 3, -1]
```

### Skeleton (Monotonic Decreasing Stack)
```python
def next_greater(arr):
    n = len(arr)
    result = [-1] * n
    stack = []    # indices of elements waiting for their "next greater"
    
    for i in range(n):
        while stack and arr[stack[-1]] < arr[i]:
            idx = stack.pop()
            result[idx] = arr[i]    # arr[i] is the next greater for idx
        stack.append(i)
    
    return result
```

---

## 12. Binary Search on Answer Space — Deep Dive

This deserves special attention because Google frequently uses this pattern, and many candidates don't recognize it.

### The Key Recognition Signal
These phrases in a problem description often mean "binary search on answer":
- "Find the **minimum** X such that [condition]"
- "Find the **maximum** X such that [condition]"
- "What is the **minimum number of** operations/days/pages..."
- "Can you achieve [goal] with exactly K of something?"

### The Template (Universal)
```python
def binary_search_answer(lo, hi):
    """
    lo = minimum possible answer
    hi = maximum possible answer
    is_valid(x) = True if answer x is achievable/valid
    """
    def is_valid(mid):
        # check if mid is a valid answer
        # this check is usually O(n) or O(n log n)
        pass
    
    while lo < hi:
        mid = (lo + hi) // 2
        if is_valid(mid):
            hi = mid           # mid works → try to find smaller valid answer
        else:
            lo = mid + 1       # mid too small → need larger answer
    
    return lo    # smallest valid answer
```

### Example: Koko Eating Bananas
```
Piles = [3,6,7,11], H = 8 (hours)
"What is the minimum eating speed K such that Koko can eat all bananas in H hours?"

Binary search on K (the answer):
  lo = 1 (minimum speed)
  hi = max(piles) (max speed needed)
  is_valid(K) = sum(ceil(pile/K) for pile in piles) <= H
```

---

## 13. Bit Manipulation (OA Focus)

### What it is
Operations directly on the binary representation of integers. Rarely needed in onsites but appears in OA.

### Core Operations
```python
# AND: 1 if both bits are 1
5 & 3    # 101 & 011 = 001 = 1

# OR: 1 if either bit is 1
5 | 3    # 101 | 011 = 111 = 7

# XOR: 1 if bits are different (0 XOR 0 = 0, 1 XOR 1 = 0, 0 XOR 1 = 1)
5 ^ 3    # 101 ^ 011 = 110 = 6
x ^ x = 0                    # XOR with itself = 0
x ^ 0 = x                    # XOR with 0 = itself

# NOT: flip all bits
~5       # -(5+1) = -6 in Python (due to two's complement)

# Left shift: multiply by 2^k
1 << 3   # 1 * 8 = 8

# Right shift: divide by 2^k (floor)
8 >> 2   # 8 // 4 = 2

# Check if bit k is set
n & (1 << k)      # non-zero if bit k is 1

# Set bit k
n | (1 << k)

# Clear bit k
n & ~(1 << k)

# Count set bits (popcount)
bin(n).count('1')
```

### Common Bit Patterns
```python
# Find the single non-repeating element (all others appear twice)
# XOR of all elements: pairs cancel out, lone element remains
def single_number(nums):
    result = 0
    for n in nums:
        result ^= n
    return result

# Check if n is a power of 2
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0
    # Powers of 2 have exactly one 1-bit: 1000
    # n-1 flips all lower bits:          0111
    # AND = 0 iff exactly one bit set
```

---

## Quick "When to Use What" Reference Card

```
PROBLEM SIGNAL                     → USE THIS
─────────────────────────────────────────────────
Shortest path, no weights         → BFS
Shortest path, positive weights   → Dijkstra's
All pairs shortest path           → Floyd-Warshall
Dependencies / ordering           → Topological Sort (Kahn's)
Connectivity, components          → Union-Find or BFS/DFS
Find target in sorted array       → Binary Search
Minimum X such that condition Y   → Binary Search on answer space
Top K elements                    → Heap (min-heap size k)
Merge K sorted lists              → Heap
Count/lookup by value             → Hash Map / Counter
Any path exists?                  → DFS
All paths / combinations          → Backtracking
Contiguous subarray property      → Sliding Window / Two Pointers
Range sum queries                 → Prefix Sum
Prefix word matching              → Trie
Next greater / previous smaller   → Monotonic Stack
Tree bottom-up computation        → Postorder DFS
Tree level processing             → BFS / Level-order
Overlapping subproblems           → DP (memoization or tabulation)
Locally optimal = globally optimal→ Greedy
Interval merging / scheduling     → Sort + Greedy
```

---

## Complexity Cheat Sheet

| Structure / Algorithm | Access | Search | Insert | Delete | Space |
|----------------------|--------|--------|--------|--------|-------|
| Array (unsorted) | O(1) | O(n) | O(1) end / O(n) mid | O(n) | O(n) |
| Array (sorted) | O(1) | O(log n) | O(n) | O(n) | O(n) |
| Hash Map / Set | — | O(1) avg | O(1) avg | O(1) avg | O(n) |
| Min/Max Heap | O(1) top | — | O(log n) | O(log n) | O(n) |
| Binary Search Tree | O(log n) avg | O(log n) avg | O(log n) avg | O(log n) avg | O(n) |
| Trie | — | O(L) | O(L) | O(L) | O(n×L) |
| Union-Find | — | O(α) | O(α) | — | O(n) |
| Stack / Queue | O(1) top | — | O(1) | O(1) | O(n) |

| Algorithm | Time | Space | Notes |
|-----------|------|-------|-------|
| BFS / DFS | O(V+E) | O(V) | Both visit every node/edge once |
| Dijkstra's | O((V+E)logV) | O(V+E) | Binary heap; positive weights only |
| Topological Sort | O(V+E) | O(V) | DAGs only |
| Binary Search | O(log n) | O(1) | Requires sorted/monotonic |
| Merge Sort | O(n log n) | O(n) | Stable, worst-case guaranteed |
| Quicksort | O(n log n) avg | O(log n) | Unstable, O(n²) worst case |
| Backtracking | O(2^n × n) | O(n) | For subsets; O(n! × n) for permutations |
| DP (1D) | O(n) | O(n) or O(1) | |
| DP (2D) | O(n×m) | O(n×m) or O(m) | |
| Heapify | O(n) | O(1) | Build heap from array |

---

*References: notes-summarized.md (Section 6: Coding Patterns & High-Frequency Topics, complete ranked list), interview-flow-summarized.md (Problem-Type Specific Adjustments section), Mock Interview - 45m - Sonnet4.6.md (Dijkstra's implementation with full explanation)*
