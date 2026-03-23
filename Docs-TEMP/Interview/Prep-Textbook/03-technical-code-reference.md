# Section 03 — Technical Code Reference

> Goal: Your complete Python reference for every data structure and algorithm type you will encounter. Each section shows: exact syntax, how to READ code you're given, how to NARRATE while you write it, and the most common patterns asked at Google L3.

---

## How to Use This Section

- **Before coding practice:** Read the relevant sub-chapter first.
- **During practice:** Keep this open alongside your code.
- **Reading given code:** Jump to the sub-chapter for whatever data structure you see.
- **In the interview:** You should have this memorized. Practice each template until you can write it from memory in Google Docs.

---

## Quick Pattern Recognition Guide

When you see a problem, match it to a pattern first:

| Problem says / involves | Think of this pattern |
|------------------------|----------------------|
| "shortest path", "minimum distance" | BFS (unweighted) or Dijkstra's (weighted, positive) |
| "all possible paths", "number of ways" | DFS / backtracking / DP |
| "top K", "kth largest/smallest" | Heap (min-heap or max-heap) |
| "contains / lookup in O(1)" | Hash map / hash set |
| "sorted array", "find target" | Binary search |
| "contiguous subarray", "window", "substring" | Sliding window / two pointers |
| "prefix sum", "range sum" | Prefix array |
| "connected components", "islands" | BFS or DFS on a grid |
| "dependencies", "course schedule", "ordering" | Topological sort |
| "tree traversal", "path in tree" | DFS recursion |
| "next greater element", "stock prices", "temperatures" | Monotonic stack |
| "optimize over choices", "can we do better than n²" | Hash map to trade space for time |
| "all subsets", "combinations", "permutations" | Backtracking |
| "prefix matching", "autocomplete", "word search" | Trie |

---

## 1. Arrays & Lists

### Core Operations

```python
arr = [3, 1, 4, 1, 5, 9, 2, 6]

# Length
n = len(arr)                   # n = 8

# Indexing
first = arr[0]                 # 3
last = arr[-1]                 # 6
last = arr[n - 1]              # also 6 (safer in interviews)

# Slicing (creates a new list)
sub = arr[1:4]                 # [1, 4, 1]  (index 1 up to but NOT including 4)
from_start = arr[:3]           # [3, 1, 4]
from_end = arr[3:]             # [1, 5, 9, 2, 6]
copy = arr[:]                  # full copy

# Appending and popping
arr.append(7)                  # add to end — O(1)
val = arr.pop()                # remove and return last element — O(1)
val = arr.pop(0)               # remove and return FIRST element — O(n) — SLOW
                               # Use deque.popleft() instead for O(1) front removal

# Inserting and removing at specific index
arr.insert(2, 99)              # insert 99 at index 2 — O(n)
arr.remove(4)                  # remove FIRST occurrence of value 4 — O(n)
del arr[2]                     # remove element at index 2 — O(n)

# Sorting
arr.sort()                     # in-place, ascending — O(n log n)
arr.sort(reverse=True)         # in-place, descending
sorted_arr = sorted(arr)       # returns new sorted list, original unchanged
sorted_arr = sorted(arr, key=lambda x: -x)   # sort by custom key

# Searching
idx = arr.index(4)             # first index of value 4 — raises ValueError if not found
exists = 4 in arr              # True/False — O(n)

# Min / max
minimum = min(arr)             # O(n)
maximum = max(arr)             # O(n)

# Sum
total = sum(arr)               # O(n)

# Reversing
arr.reverse()                  # in-place reverse
rev = arr[::-1]                # returns new reversed list
```

---

### Two-Pointer Pattern

Use when: sorted array, finding pairs, checking if palindrome, shrinking window.

```python
def two_pointer_example(arr, target):
    left, right = 0, len(arr) - 1
    while left < right:
        current_sum = arr[left] + arr[right]
        if current_sum == target:
            return [left, right]
        elif current_sum < target:
            left += 1         # need bigger sum → move left pointer right
        else:
            right -= 1        # need smaller sum → move right pointer left
    return []
```

**Narrate as:** *"I'm using two pointers — left starts at 0, right starts at the end. I move them toward each other based on whether the current pair is too small or too large."*

---

### Sliding Window Pattern

Use when: "contiguous subarray", "substring with property", "maximum sum of length k".

```python
def sliding_window_fixed_k(arr, k):
    # Fixed-size window of size k
    window_sum = sum(arr[:k])     # initial window
    max_sum = window_sum
    
    for i in range(k, len(arr)):
        window_sum += arr[i]      # add new element on right
        window_sum -= arr[i - k]  # remove element that fell out on left
        max_sum = max(max_sum, window_sum)
    
    return max_sum


def sliding_window_variable(arr, target):
    # Variable-size window — expand right, shrink left when condition violated
    left = 0
    current_sum = 0
    min_length = float('inf')
    
    for right in range(len(arr)):
        current_sum += arr[right]
        
        while current_sum >= target:          # shrink from left
            min_length = min(min_length, right - left + 1)
            current_sum -= arr[left]
            left += 1
    
    return min_length if min_length != float('inf') else 0
```

**Narrate as:** *"I'm using a sliding window — I expand the right boundary on each iteration, and shrink from the left whenever the condition is violated."*

---

### Prefix Sum Pattern

Use when: multiple range sum queries, subarray sum equals target.

```python
def build_prefix(arr):
    prefix = [0] * (len(arr) + 1)   # prefix[0] = 0 (empty prefix)
    for i, val in enumerate(arr):
        prefix[i + 1] = prefix[i] + val
    return prefix

# Range sum from index l to r (inclusive, 0-based)
def range_sum(prefix, l, r):
    return prefix[r + 1] - prefix[l]
```

**Narrate as:** *"I'm building a prefix sum array where prefix[i] holds the sum of the first i elements. That lets me answer range sum queries in O(1)."*

---

## 2. Hash Maps & Hash Sets

### Core Operations

```python
from collections import defaultdict, Counter

# Regular dict
d = {}
d['key'] = 'value'             # set
val = d.get('key', 0)          # get with default (safe — won't KeyError)
val = d['key']                 # get — raises KeyError if missing
exists = 'key' in d            # True/False
del d['key']                   # remove
for k, v in d.items():         # iterate key-value pairs
    pass

# defaultdict — auto-initializes missing keys
graph = defaultdict(list)      # missing key → empty list
count = defaultdict(int)       # missing key → 0
graph[0].append(1)             # no KeyError needed

# Counter — count frequencies
from collections import Counter
freq = Counter([1, 2, 2, 3, 3, 3])    # {3: 3, 2: 2, 1: 1}
freq = Counter("hello")                # {'l': 2, 'h': 1, 'e': 1, 'o': 1}
most_common = freq.most_common(2)      # [(3, 3), (2, 2)] — top 2

# Sets
s = set()
s.add(1)
s.remove(1)                    # raises KeyError if not present
s.discard(1)                   # safe remove — no error if missing
exists = 1 in s                # O(1) lookup
union = s1 | s2                # all elements in either
intersection = s1 & s2         # elements in both
difference = s1 - s2           # elements in s1 not in s2
```

**When to use hash map:** Any time you need O(1) lookup instead of O(n) search. Classic pattern: "have I seen this before?"

**Narrate as:** *"I'm using a hash map here to trade O(n) space for O(1) lookup time — instead of scanning the array every time, I can check in constant time whether a value exists."*

---

### Common Hash Map Pattern: Complement / Two-Sum

```python
def two_sum(arr, target):
    seen = {}                          # value → index
    for i, val in enumerate(arr):
        complement = target - val
        if complement in seen:
            return [seen[complement], i]
        seen[val] = i
    return []
```

---

## 3. Graphs

### Building an Adjacency List

```python
from collections import defaultdict

def build_graph(edges, directed=False):
    graph = defaultdict(list)
    for a, b in edges:
        graph[a].append(b)
        if not directed:
            graph[b].append(a)   # undirected: add both directions
    return graph

# Weighted graph
def build_weighted_graph(edges):
    graph = defaultdict(list)
    for a, b, weight in edges:
        graph[a].append((b, weight))
        graph[b].append((a, weight))   # bidirectional
    return graph
```

**How to READ given graph code:**
- `graph[node]` = list of neighbors
- `graph[node]` = list of `(neighbor, weight)` tuples for weighted graphs
- `for neighbor in graph[node]` = iterate over all edges from node

---

### BFS — Breadth-First Search

Use for: **shortest path in unweighted graphs**, level-order traversal, connected components.

```python
from collections import deque

def bfs(graph, start):
    visited = set()
    visited.add(start)
    queue = deque([start])
    
    while queue:
        node = queue.popleft()          # O(1) — use deque, not list
        
        # Process node here
        print(node)
        
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
```

**BFS Shortest Path (returns distances):**

```python
def bfs_shortest_path(graph, start):
    dist = {start: 0}
    queue = deque([start])
    
    while queue:
        node = queue.popleft()
        for neighbor in graph[node]:
            if neighbor not in dist:
                dist[neighbor] = dist[node] + 1
                queue.append(neighbor)
    
    return dist
```

**Narrate as:** *"I'm using BFS here because we want the shortest path in an unweighted graph. BFS explores layer by layer, so the first time we reach any node, that's guaranteed to be the shortest path."*

---

### DFS — Depth-First Search

Use for: **exploring all paths**, cycle detection, connected components, topological sort.

```python
# Recursive DFS
def dfs_recursive(graph, node, visited=None):
    if visited is None:
        visited = set()
    visited.add(node)
    
    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs_recursive(graph, neighbor, visited)
    
    return visited


# Iterative DFS (safer for deep graphs — avoids recursion limit)
def dfs_iterative(graph, start):
    visited = set()
    stack = [start]
    
    while stack:
        node = stack.pop()             # LIFO — stack
        if node not in visited:
            visited.add(node)
            for neighbor in graph[node]:
                if neighbor not in visited:
                    stack.append(neighbor)
    
    return visited
```

**Narrate as:** *"I'm using DFS here — I'll use a stack (or recursion) to go deep into each path before backtracking."*

---

### Dijkstra's Algorithm

Use for: **shortest path with positive edge weights**.

```python
import heapq
from collections import defaultdict

def dijkstra(graph, src, n):
    dist = {i: float('inf') for i in range(n)}
    dist[src] = 0
    
    min_heap = [(0, src)]      # (distance, node)
    visited = set()
    
    while min_heap:
        curr_dist, node = heapq.heappop(min_heap)
        
        if node in visited:
            continue
        visited.add(node)
        
        for neighbor, weight in graph[node]:
            new_dist = curr_dist + weight
            if new_dist < dist[neighbor]:
                dist[neighbor] = new_dist
                heapq.heappush(min_heap, (new_dist, neighbor))
    
    return dist
```

**How to READ Dijkstra code:**
- `heapq.heappop` → always pops the smallest (distance, node) pair
- `visited` set → once a node is popped, its shortest path is finalized
- `dist[neighbor] = new_dist` → "relaxing" the edge
- `heapq.heappush(min_heap, ...)` → adding a shorter path candidate

**Narrate as:** *"I'm using Dijkstra's because all edge weights are positive. I maintain a min-heap of (distance, node) pairs. The first time I pop a node, that's the shortest distance to it."*

---

### Topological Sort (BFS / Kahn's Algorithm)

Use for: dependency ordering, course scheduling, task sequencing.

```python
from collections import deque, defaultdict

def topological_sort(n, prerequisites):
    # prerequisites = [[course, prereq], ...]
    graph = defaultdict(list)
    in_degree = [0] * n
    
    for course, prereq in prerequisites:
        graph[prereq].append(course)
        in_degree[course] += 1
    
    # Start with nodes that have no dependencies
    queue = deque([i for i in range(n) if in_degree[i] == 0])
    order = []
    
    while queue:
        node = queue.popleft()
        order.append(node)
        
        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
    
    # If order has all N nodes, no cycle exists
    return order if len(order) == n else []
```

**Narrate as:** *"I'm using Kahn's algorithm for topological sort. I track in-degrees — how many prerequisites each node has. I start from nodes with zero dependencies, process them, and reduce the in-degree of their dependents."*

---

### Cycle Detection in a Directed Graph (DFS)

```python
def has_cycle(n, edges):
    graph = defaultdict(list)
    for a, b in edges:
        graph[a].append(b)
    
    WHITE, GRAY, BLACK = 0, 1, 2   # not visited, in progress, done
    color = [WHITE] * n
    
    def dfs(node):
        color[node] = GRAY           # mark as in-progress
        for neighbor in graph[node]:
            if color[neighbor] == GRAY:
                return True          # back edge → cycle!
            if color[neighbor] == WHITE:
                if dfs(neighbor):
                    return True
        color[node] = BLACK          # fully processed
        return False
    
    return any(dfs(i) for i in range(n) if color[i] == WHITE)
```

---

### BFS on a Grid (Islands, Flood Fill)

```python
from collections import deque

def bfs_grid(grid):
    rows, cols = len(grid), len(grid[0])
    visited = set()
    components = 0
    
    def bfs(r, c):
        queue = deque([(r, c)])
        visited.add((r, c))
        while queue:
            row, col = queue.popleft()
            for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]:   # 4 directions
                nr, nc = row + dr, col + dc
                if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in visited and grid[nr][nc] == '1':
                    visited.add((nr, nc))
                    queue.append((nr, nc))
    
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == '1' and (r, c) not in visited:
                bfs(r, c)
                components += 1
    
    return components
```

**How to READ grid BFS:**
- `for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]` → the four cardinal neighbors
- `0 <= nr < rows and 0 <= nc < cols` → bounds check (always needed)
- `visited.add((r, c))` → mark before enqueuing, not after popping (prevents duplicates)

---

## 4. Trees

### Node Definition

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
```

### Tree Traversals

```python
# Inorder: Left → Root → Right (gives sorted order for BST)
def inorder(root):
    if not root:
        return []
    return inorder(root.left) + [root.val] + inorder(root.right)


# Preorder: Root → Left → Right (good for copying/serialization)
def preorder(root):
    if not root:
        return []
    return [root.val] + preorder(root.left) + preorder(root.right)


# Postorder: Left → Right → Root (good for deletion, calculating subtree values)
def postorder(root):
    if not root:
        return []
    return postorder(root.left) + postorder(root.right) + [root.val]


# Level-order (BFS) — returns list of lists by level
from collections import deque
def level_order(root):
    if not root:
        return []
    result = []
    queue = deque([root])
    while queue:
        level = []
        for _ in range(len(queue)):   # process one full level
            node = queue.popleft()
            level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        result.append(level)
    return result
```

**How to READ tree traversal code:**
- `if not root: return` → base case, handles null nodes
- `root.left` / `root.right` → child nodes
- The recursive structure mirrors the traversal order

**Narrate as:** *"I'm doing a recursive DFS on the tree. The base case is when node is null — we return immediately. Otherwise I recursively process left subtree, then current node, then right subtree — that's inorder."*

---

### Tree: DFS with Return Value Pattern

Many tree problems need you to compute something at each node using results from children:

```python
def tree_height(root):
    if not root:
        return 0
    left_height = tree_height(root.left)
    right_height = tree_height(root.right)
    return 1 + max(left_height, right_height)


def max_path_sum(root):
    max_sum = [float('-inf')]   # use list so inner function can modify it
    
    def dfs(node):
        if not node:
            return 0
        left = max(dfs(node.left), 0)    # ignore negative paths
        right = max(dfs(node.right), 0)
        max_sum[0] = max(max_sum[0], node.val + left + right)
        return node.val + max(left, right)  # return best single-path extension
    
    dfs(root)
    return max_sum[0]
```

---

### N-ary Tree

```python
class Node:
    def __init__(self, val=None, children=None):
        self.val = val
        self.children = children if children else []

def n_ary_traversal(root):
    if not root:
        return []
    result = [root.val]
    for child in root.children:       # iterate all children (not just left/right)
        result.extend(n_ary_traversal(child))
    return result
```

---

### Lowest Common Ancestor (LCA)

```python
def lca(root, p, q):
    if not root or root == p or root == q:
        return root
    left = lca(root.left, p, q)
    right = lca(root.right, p, q)
    if left and right:
        return root           # p is on one side, q is on the other
    return left or right      # both are on the same side
```

---

## 5. Dynamic Programming

### The DP Mindset

Before writing any DP code, **state the recurrence relation and base cases out loud**:

> *"dp[i][j] represents the minimum cost to reach cell (i, j). The base case is dp[0][0] = grid[0][0]. The transition is: dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])."*

---

### 1D DP — Classic Patterns

```python
# Fibonacci-style (each state depends on previous 1-2 states)
def climbing_stairs(n):
    if n <= 1:
        return 1
    dp = [0] * (n + 1)
    dp[0], dp[1] = 1, 1
    for i in range(2, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    return dp[n]


# Knapsack-style (include or exclude each item)
def knapsack(weights, values, capacity):
    n = len(weights)
    dp = [0] * (capacity + 1)
    for i in range(n):
        for w in range(capacity, weights[i] - 1, -1):   # iterate backwards for 0/1 knapsack
            dp[w] = max(dp[w], dp[w - weights[i]] + values[i])
    return dp[capacity]
```

---

### 2D DP — Grid / Matrix

```python
def min_path_sum(grid):
    rows, cols = len(grid), len(grid[0])
    dp = [[0] * cols for _ in range(rows)]
    dp[0][0] = grid[0][0]
    
    # Fill first row
    for c in range(1, cols):
        dp[0][c] = dp[0][c-1] + grid[0][c]
    
    # Fill first column
    for r in range(1, rows):
        dp[r][0] = dp[r-1][0] + grid[r][0]
    
    # Fill rest
    for r in range(1, rows):
        for c in range(1, cols):
            dp[r][c] = grid[r][c] + min(dp[r-1][c], dp[r][c-1])
    
    return dp[rows-1][cols-1]
```

---

### Memoization with @lru_cache (Top-Down DP)

```python
from functools import lru_cache

def word_break(s, word_dict):
    word_set = set(word_dict)
    
    @lru_cache(maxsize=None)
    def can_break(start):
        if start == len(s):
            return True
        for end in range(start + 1, len(s) + 1):
            if s[start:end] in word_set and can_break(end):
                return True
        return False
    
    return can_break(0)
```

**Narrate as:** *"I'm adding memoization here with lru_cache — this ensures each subproblem is solved only once, bringing it from O(2^n) down to O(n²)."*

---

### DP — Identifying the Pattern

```
Ask yourself these questions:
1. "Can I define a state that represents the sub-problem?"
   → dp[i] = ... / dp[i][j] = ...
2. "What is the base case? (smallest valid input)"
3. "What is the recurrence? (how does state i depend on smaller states?)"
4. "What is the final answer? (dp[n]? dp[n-1][m-1]? max over all dp[i]?)"
```

---

## 6. Heaps / Priority Queues

```python
import heapq

# Python's heapq is a MIN-heap by default
min_heap = []
heapq.heappush(min_heap, 5)
heapq.heappush(min_heap, 1)
heapq.heappush(min_heap, 3)
smallest = heapq.heappop(min_heap)   # returns 1

# Max-heap trick: negate values
max_heap = []
heapq.heappush(max_heap, -5)
heapq.heappush(max_heap, -1)
largest = -heapq.heappop(max_heap)   # returns 5

# Peek without popping
peek = min_heap[0]

# Build heap from list in O(n)
arr = [3, 1, 4, 1, 5]
heapq.heapify(arr)

# Heap with tuples — sorted by first element
heapq.heappush(min_heap, (priority, data))
```

---

### Top-K Pattern

```python
import heapq

def top_k_frequent(nums, k):
    from collections import Counter
    freq = Counter(nums)
    
    # Use min-heap of size k — pop when exceeds k
    heap = []
    for num, count in freq.items():
        heapq.heappush(heap, (count, num))
        if len(heap) > k:
            heapq.heappop(heap)         # remove smallest frequency
    
    return [num for count, num in heap]
```

**Narrate as:** *"I'm using a min-heap of size k. As I process elements, if the heap exceeds k, I pop the smallest. At the end, what remains in the heap are the k largest elements."*

---

### K-th Largest

```python
def find_kth_largest(nums, k):
    # Min-heap of size k: top of heap is the k-th largest
    heap = nums[:k]
    heapq.heapify(heap)
    
    for num in nums[k:]:
        if num > heap[0]:
            heapq.heapreplace(heap, num)  # pop min, push new
    
    return heap[0]    # the k-th largest
```

---

## 7. Strings

### Core Operations

```python
s = "hello world"

# Length
n = len(s)

# Accessing characters
ch = s[0]           # 'h'
last = s[-1]        # 'd'

# Slicing
sub = s[0:5]        # "hello"
rev = s[::-1]       # "dlrow olleh"

# Methods
upper = s.upper()
lower = s.lower()
stripped = s.strip()          # remove leading/trailing whitespace
parts = s.split(" ")          # ["hello", "world"]
joined = " ".join(["a", "b"]) # "a b"
replaced = s.replace("l", "r") # "herro worrd"
starts = s.startswith("hel")   # True
ends = s.endswith("rld")       # True
found = s.find("world")        # index 6, or -1 if not found
count = s.count("l")           # 3

# Check character type
"a".isalpha()     # True (letter)
"1".isdigit()     # True (digit)
"a".islower()     # True
"A".isupper()     # True

# String → list (to modify, since strings are immutable)
chars = list(s)
chars[0] = 'H'
result = "".join(chars)
```

---

### Sliding Window on Strings

```python
def longest_substring_without_repeat(s):
    char_index = {}
    left = 0
    max_len = 0
    
    for right, char in enumerate(s):
        if char in char_index and char_index[char] >= left:
            left = char_index[char] + 1     # shrink window past last occurrence
        char_index[char] = right
        max_len = max(max_len, right - left + 1)
    
    return max_len
```

---

## 8. Stacks & Queues (Deque)

```python
from collections import deque

# Stack (LIFO) — use a list or deque
stack = []
stack.append(1)       # push
stack.append(2)
top = stack[-1]       # peek without pop
val = stack.pop()     # pop from top

# Queue (FIFO) — always use deque, NOT list
queue = deque()
queue.append(1)       # enqueue (add to right)
queue.append(2)
front = queue[0]      # peek front
val = queue.popleft() # dequeue (remove from left) — O(1)
# NEVER use list.pop(0) for a queue — it's O(n)
```

---

### Monotonic Stack Pattern

Use for: "next greater element", "temperatures", "largest rectangle in histogram".

```python
def daily_temperatures(temperatures):
    result = [0] * len(temperatures)
    stack = []   # stores indices, not values
    
    for i, temp in enumerate(temperatures):
        while stack and temperatures[stack[-1]] < temp:
            prev_idx = stack.pop()
            result[prev_idx] = i - prev_idx    # days until warmer
        stack.append(i)
    
    return result
```

**How to READ monotonic stack code:**
- `stack` stores indices (not values) so you can compute distances
- `while stack and condition` → pop elements that are now "resolved"
- What's left in the stack after the loop → unresolved elements (result stays 0 or default)

**Narrate as:** *"I'm using a monotonic stack — I maintain a stack of indices whose 'next greater' hasn't been found yet. When I see a larger value, I resolve all smaller ones waiting in the stack."*

---

## 9. Binary Search

### Standard Binary Search

```python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:            # NOTE: <= not <
        mid = left + (right - left) // 2    # avoids overflow
        
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1    # not found
```

---

### Binary Search on Answer Space

Use when: "find minimum X such that condition Y holds".

```python
def binary_search_answer(lo, hi, condition_func):
    # lo = minimum possible answer
    # hi = maximum possible answer
    # condition_func(mid) = True if mid is a valid answer
    
    while lo < hi:
        mid = (lo + hi) // 2
        if condition_func(mid):
            hi = mid         # mid works, try smaller
        else:
            lo = mid + 1     # mid doesn't work, go larger
    
    return lo    # smallest value where condition is True
```

**Example:** "Minimum number of days to make m bouquets":
```python
def min_days(bloom_day, m, k):
    lo, hi = min(bloom_day), max(bloom_day)
    
    def can_make(day):
        bouquets = consecutive = 0
        for b in bloom_day:
            if b <= day:
                consecutive += 1
                if consecutive == k:
                    bouquets += 1
                    consecutive = 0
            else:
                consecutive = 0
        return bouquets >= m
    
    while lo < hi:
        mid = (lo + hi) // 2
        if can_make(mid):
            hi = mid
        else:
            lo = mid + 1
    
    return lo if can_make(lo) else -1
```

---

## 10. Tries

Use for: prefix search, autocomplete, word existence.

```python
class TrieNode:
    def __init__(self):
        self.children = {}       # char → TrieNode
        self.is_end = False      # marks end of a word

class Trie:
    def __init__(self):
        self.root = TrieNode()
    
    def insert(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end = True
    
    def search(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                return False
            node = node.children[char]
        return node.is_end
    
    def starts_with(self, prefix):
        node = self.root
        for char in prefix:
            if char not in node.children:
                return False
            node = node.children[char]
        return True     # prefix exists (doesn't need to be a full word)
```

**Narrate as:** *"I'm using a Trie — each node represents a character, and children represent the next characters in the word. is_end flags the end of a complete word. Insert is O(L) where L is word length, and search is also O(L)."*

---

## Reading Given Code — Quick Guide

When the interviewer shows you code and asks questions about it:

1. **Identify the data structure being used** — look at how variables are initialized
2. **Trace the control flow** — find the main loop / recursion structure
3. **Identify the "state"** — what variables change at each step?
4. **Find the return condition** — what triggers returning a result?
5. **Look for edge cases** — is there a `if not root` / `if left >= right` guard?

Common things to notice in given code:
- `heapq.heappop(heap)` → this is a heap, min-heap by default
- `deque.popleft()` → this is a queue (BFS)
- `stack.pop()` → this is a stack (DFS, iterative)
- `visited = set()` → cycle/revisit prevention
- `dp[i] = dp[i-1] + ...` → dynamic programming with 1D state
- `for dr, dc in [...]` → grid traversal in 4/8 directions
- `@lru_cache` or `memo = {}` → memoization

---

*References: notes-summarized.md (Section 6: Coding Patterns & High-Frequency Topics), Mock Interview - 45m - Sonnet4.6.md (complete Dijkstra's implementation with narration), interview-flow-summarized.md (Phase 4 code quality checklist)*
