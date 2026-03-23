# Google US L3 — Ideal 45-Minute Coding Interview Simulation
> A full end-to-end transcript of a model candidate performing at "Strong Hire" level  
> `[audio]` = spoken out loud · `[screen]` = typed/visible in shared Google Doc · `[note]` = coaching annotation for the reader

---

## Context & Setup

**Candidate:** Alex Chen — CS graduate, 1 year industry experience, interviewing for L3 SWE  
**Interviewer:** Jordan (Senior SWE, Google Search Infrastructure, 5 years at Google)  
**Format:** Virtual — Google Meet video call + shared Google Doc  
**Problem:** A real-world-style BFS/graph problem (as commonly seen in 2023–2025 Google L3 rounds) with a follow-up optimization variant  
**Language:** Python (Alex's choice)  
**Timer starts:** When Jordan joins the call

---

## ─────────────────────────────────────────
## PHASE 1 — Introductions & Warm-Up
## `[00:00 – 05:00]`
## ─────────────────────────────────────────

---

`[audio]` **Jordan:** Hey Alex, can you hear me okay? Great. Give me just one second to share the doc link in the chat...

`[audio]` **Alex:** Yep, loud and clear! And I can see the doc link, opening it now.

`[note]` Alex opens the shared Google Doc immediately. The doc has the interviewer's name and the date at the top — nothing else yet. Alex's camera is on. They are relaxed and smiling slightly.

---

`[audio]` **Jordan:** Perfect. So — I'm Jordan, I'm a senior SWE on the Search Infrastructure team here at Google. I've been here about five years now, mostly working on the indexing pipeline. How are you doing today?

`[audio]` **Alex:** Doing really well, thanks for asking! It's a good morning over here. That sounds like fascinating work — indexing at Google's scale must come with some really interesting latency and consistency challenges.

`[note]` Alex is warm but brief. They reference Jordan's work specifically — not generically. This signals active listening and genuine curiosity. They do NOT say "I'm nervous" or "I've been preparing a lot."

---

`[audio]` **Jordan:** Ha, yeah — definitely keeps things interesting. So tell me a little bit about yourself before we dive in.

`[audio]` **Alex:** Sure! I graduated from UC San Diego last year with a CS degree. Since then I've been at a mid-sized fintech startup, where I've been working primarily on the backend — building and maintaining REST APIs, working with Postgres and Redis, and doing a lot of work on our data pipeline for transaction processing. One project I'm particularly proud of is a rate-limiting service I designed and built from scratch — it reduced fraudulent transaction attempts by about 35% without adding meaningful latency to the happy path. I've really been wanting to work at a place where scale is a first-class concern rather than something you address reactively, which is a big part of why I'm excited about Google.

`[note]` Alex's intro is ~80 seconds. It hits: current role, specific technical skills, ONE concrete quantified project, and a forward-looking hook tied to Google's actual engineering concerns. They use "I" throughout — never "we." They stop themselves naturally at the hook.

---

`[audio]` **Jordan:** That rate-limiting work sounds really interesting — we actually deal with a lot of similar challenges at our scale. Okay, so let's jump in. I'll paste the problem into the doc now. Take a moment to read it, and feel free to ask questions.

`[audio]` **Alex:** Perfect, thank you.

---

## ─────────────────────────────────────────
## PHASE 2 — Problem Reception & Clarification
## `[05:00 – 10:30]`
## ─────────────────────────────────────────

---

`[screen]` Jordan pastes the following into the Google Doc:

```
PROBLEM: Network Message Broadcast

There are N routers in a network. Each router is identified by a unique
integer ID (0 to N-1). You are given a list of connections, where
connections[i] = [router_a, router_b, distance] represents a bidirectional
link between router_a and router_b with the given distance.

A source router `src` receives a message and broadcasts it to all routers
within a maximum distance `d`. A router receives the message if it can be
reached from src through a path where the total accumulated distance
is <= d.

Given src, d, and a destination router `dst`, return True if dst receives
the message, False otherwise.
```

`[note]` Alex reads the problem silently and completely before speaking. They take a full 20 seconds. During this time they are visibly reading, not staring blankly. They pick up a pen and jot a brief rough sketch on paper (not visible to interviewer — just a personal habit).

---

`[audio]` **Alex:** Okay — let me make sure I understand what we're working with here. So we have a network of N routers, connected by bidirectional edges that each have a distance weight. A source router sends out a message, and any router that can be reached from the source via a path whose total distance is at most `d` will receive that message. And the question is: does destination `dst` receive it?

`[audio]` **Jordan:** That's right.

`[audio]` **Alex:** Great. Let me ask a few clarifying questions before I go any further.

`[note]` Alex uses a clear transition phrase — signaling structure. They are not firing questions randomly.

---

`[audio]` **Alex:** First, on the connections: can there be multiple edges between the same pair of routers? Like, could router 0 and router 1 be connected with two different distances?

`[audio]` **Jordan:** Good question — you can assume at most one edge between any pair.

---

`[audio]` **Alex:** And can the graph have cycles? Like, could I have a path that loops back on itself?

`[audio]` **Jordan:** Yes, cycles are possible — it's a general undirected graph, not necessarily a tree.

---

`[audio]` **Alex:** Okay. What about the distance values — can they be zero or negative? I want to know if Dijkstra's or simple BFS is more appropriate here.

`[audio]` **Jordan:** Distances are all positive integers.

`[note]` This is a key question — Alex is already thinking ahead to algorithm choice. This signals algorithm literacy, not random question-asking.

---

`[audio]` **Alex:** What's the scale I should be designing for — roughly how large can N be?

`[audio]` **Jordan:** N can be up to 10 to the 4th — so ten thousand routers. And the number of edges can be up to 10 to the 5th.

---

`[audio]` **Alex:** And just to confirm — we're looking for boolean output only, true or false. We don't need to return the actual path or the actual minimum distance?

`[audio]` **Jordan:** Just boolean, yes.

---

`[audio]` **Alex:** Last one — if `src` equals `dst`, should we return True immediately?

`[audio]` **Jordan:** Yes, good catch — that's a valid edge case. Return True.

---

`[audio]` **Alex:** Perfect. Let me write down these constraints in the doc so I can reference them while I code.

`[screen]` Alex types in the Google Doc:

```python
# === CONSTRAINTS ===
# N routers, IDs: 0 to N-1
# connections[i] = [router_a, router_b, distance] — bidirectional
# At most one edge between any pair
# Graph can have cycles (general undirected graph)
# All distances are positive integers (no negatives/zero)
# N <= 10^4, edges <= 10^5
# Return True if dst is reachable from src with total path distance <= d
# Edge case: if src == dst → return True immediately
```

`[note]` Writing constraints as doc comments is a best practice that signals professional discipline. It also gives Alex a written spec to reference and prevents forgetting edge cases later.

---

`[audio]` **Alex:** One quick example just to make sure I have the model right — if I have routers 0, 1, 2 with edges 0→1 distance 3, 1→2 distance 4, and `src=0`, `d=6`, `dst=2` — the total path distance is 7, which is greater than 6, so we'd return False. But if d were 7 or more, we'd return True?

`[audio]` **Jordan:** Exactly right.

`[note]` Walking through a concrete example confirms understanding AND catches misinterpretations early. This only takes 20 seconds but is extremely high-signal.

---

## ─────────────────────────────────────────
## PHASE 3 — Approach Discussion & Alignment
## `[10:30 – 17:00]`
## ─────────────────────────────────────────

---

`[audio]` **Alex:** Alright, let me think through the approach before I start coding.

`[audio]` **Alex:** The naive brute force would be to enumerate all possible paths from `src` to `dst` — essentially a DFS that explores every path and checks if any of them has a total distance ≤ d. But since we can have cycles, we'd need to track visited nodes, and even then the number of paths could be exponential in the worst case. So that's not going to scale to N = 10^4.

`[note]` Alex states brute force unprompted and immediately identifies WHY it's inadequate. This is not just reciting — it's real reasoning.

---

`[audio]` **Alex:** Since all distances are positive and we're looking for the minimum-distance path from `src` to each reachable node, Dijkstra's algorithm comes to mind immediately. Dijkstra's gives us the shortest distance from a source to all other nodes in O((V + E) log V) time — that's about 10^4 + 10^5 times log(10^4), which is comfortably within bounds.

`[audio]` **Alex:** Once I have the shortest distance from `src` to `dst`, I just check if it's ≤ d and return True or False. And if `dst` is never reached, I return False.

---

`[audio]` **Alex:** I could also consider a simpler BFS — but standard BFS doesn't respect edge weights, so it would only work if all distances were equal, which isn't guaranteed here. So Dijkstra's is the right call.

`[note]` Alex explicitly rules out BFS and explains WHY — not just "Dijkstra is better." This contrast shows depth of understanding.

---

`[audio]` **Alex:** One thing I want to be careful about: I should stop Dijkstra's early once I pop `dst` from the min-heap — I don't need to compute the shortest distance to every single node, just to `dst`. That's a small optimization but worth doing.

`[note]` This early-termination insight is a bonus signal — it shows algorithmic maturity beyond just pattern-matching.

---

`[audio]` **Alex:** So to summarize: I'll build an adjacency list from the connections, run Dijkstra's from `src` with early termination at `dst`, and return `True` if the shortest distance to `dst` is ≤ d. Time complexity O((V + E) log V), space O(V + E) for the graph and distances. Does this direction seem reasonable to you before I start implementing?

`[audio]` **Jordan:** Yep, that sounds good. Go ahead.

`[note]` Alex explicitly aligns with the interviewer before coding. This is the "does this direction seem reasonable?" close. It's not seeking validation — it's professional collaboration.

---

## ─────────────────────────────────────────
## PHASE 4 — Coding
## `[17:00 – 34:00]`
## ─────────────────────────────────────────

---

`[audio]` **Alex:** Alright, let me start coding. I'll use Python. I'll structure this top-down — function signature first, then fill in the steps.

`[screen]` Alex begins typing. They type at a steady, deliberate pace — not racing, not sluggish:

```python
import heapq
from collections import defaultdict

def can_receive_message(n, connections, src, dst, d):
    # Edge case: source is destination
    if src == dst:
        return True
    
    # Step 1: Build adjacency list
    graph = build_graph(connections)
    
    # Step 2: Dijkstra's from src, early-exit at dst
    min_dist = dijkstra(graph, src, dst, n)
    
    # Step 3: Check if dst is reachable within distance d
    return min_dist <= d
```

`[audio]` **Alex:** I'm starting with a top-down structure — defining the overall flow first before filling in helpers. This keeps things readable and lets me reason about each piece independently.

`[note]` Top-down coding is a Google best practice and immediately signals production-code thinking over contest hacking.

---

`[audio]` **Alex:** Now let me implement `build_graph`.

`[screen]`

```python
def build_graph(connections):
    graph = defaultdict(list)
    for a, b, dist in connections:
        graph[a].append((b, dist))
        graph[b].append((a, dist))   # bidirectional
    return graph
```

`[audio]` **Alex:** I'm using a defaultdict of lists — each key is a router ID, and each value is a list of (neighbor, distance) tuples. I'm adding both directions since the connections are bidirectional.

---

`[audio]` **Alex:** Now the Dijkstra function. Let me think through the structure: I need a min-heap, a distances dictionary initialized to infinity for all nodes except the source, and a visited set to avoid reprocessing.

`[screen]`

```python
def dijkstra(graph, src, dst, n):
    # dist[node] = shortest known distance from src to node
    dist = {i: float('inf') for i in range(n)}
    dist[src] = 0
    
    # Min-heap: (current_distance, node)
    min_heap = [(0, src)]
    
    visited = set()
    
    while min_heap:
        curr_dist, node = heapq.heappop(min_heap)
        
        # Early termination: we've found the shortest path to dst
        if node == dst:
            return curr_dist
        
        # Skip if already processed
        if node in visited:
            continue
        visited.add(node)
        
        # Relax neighbors
        for neighbor, weight in graph[node]:
            new_dist = curr_dist + weight
            if new_dist < dist[neighbor]:
                dist[neighbor] = new_dist
                heapq.heappush(min_heap, (new_dist, neighbor))
    
    # dst was never reached
    return float('inf')
```

`[audio]` **Alex:** I'm initializing all distances to infinity and the source to zero. The heap starts with just the source. For each node I pop, I first check if it's the destination — if so, I return the distance immediately without processing the whole graph. I also skip nodes I've already finalized, since in Dijkstra's, the first time we pop a node from the min-heap is the shortest distance to it. Then I relax all neighbors.

`[note]` Alex narrates while coding, explaining non-obvious design choices — the early exit, the visited set purpose, the relaxation step. The code is clean: meaningful names, no magic numbers, consistent structure.

---

`[audio]` **Alex:** Let me review the full solution together before moving to testing.

`[screen]` Alex scrolls back to the top and reads the full solution in order. The complete code in the doc:

```python
import heapq
from collections import defaultdict

def can_receive_message(n, connections, src, dst, d):
    """
    Returns True if dst can receive the broadcast from src within max distance d.
    Uses Dijkstra's with early termination for efficiency.
    """
    # Edge case: source is destination
    if src == dst:
        return True
    
    # Step 1: Build adjacency list
    graph = build_graph(connections)
    
    # Step 2: Dijkstra's from src, early-exit at dst
    min_dist = dijkstra(graph, src, dst, n)
    
    # Step 3: Check if dst is reachable within distance d
    return min_dist <= d


def build_graph(connections):
    graph = defaultdict(list)
    for a, b, dist in connections:
        graph[a].append((b, dist))
        graph[b].append((a, dist))   # bidirectional
    return graph


def dijkstra(graph, src, dst, n):
    dist = {i: float('inf') for i in range(n)}
    dist[src] = 0
    
    min_heap = [(0, src)]
    visited = set()
    
    while min_heap:
        curr_dist, node = heapq.heappop(min_heap)
        
        if node == dst:
            return curr_dist
        
        if node in visited:
            continue
        visited.add(node)
        
        for neighbor, weight in graph[node]:
            new_dist = curr_dist + weight
            if new_dist < dist[neighbor]:
                dist[neighbor] = new_dist
                heapq.heappush(min_heap, (new_dist, neighbor))
    
    return float('inf')
```

`[note]` The complete solution is ~40 lines. Clean helper decomposition, docstring on the main function, consistent naming. Total coding time: ~15 minutes, which is on target.

---

## ─────────────────────────────────────────
## PHASE 5 — Testing, Edge Cases & Complexity
## `[34:00 – 41:30]`
## ─────────────────────────────────────────

---

`[audio]` **Alex:** Okay, let me trace through this with a concrete example to verify correctness.

`[screen]` Alex adds below the code:

```python
# === TEST CASES ===

# Test 1: Happy path — dst reachable within d
# n=4, connections: 0-1(3), 1-2(4), 2-3(2), src=0, dst=3, d=9
# Shortest path: 0→1→2→3 = 3+4+2 = 9
# d=9 → True ✓
```

`[audio]` **Alex:** Let me trace the algorithm manually. We start with heap = [(0, 0)], dist = {0:0, 1:inf, 2:inf, 3:inf}, visited = {}.

`[audio]` **Alex:** Pop (0, 0). Node 0 is not dst (3). Add to visited. Neighbors of 0: router 1 at distance 3. new_dist = 3 < inf → push (3, 1), update dist[1] = 3. Heap: [(3, 1)].

`[audio]` **Alex:** Pop (3, 1). Node 1 is not dst. Add to visited. Neighbors: router 0 (visited, skip), router 2 at distance 4. new_dist = 3+4 = 7 < inf → push (7, 2), dist[2] = 7. Heap: [(7, 2)].

`[audio]` **Alex:** Pop (7, 2). Node 2 is not dst. Neighbors: router 1 (visited), router 3 at distance 2. new_dist = 7+2 = 9 < inf → push (9, 3), dist[3] = 9. Heap: [(9, 3)].

`[audio]` **Alex:** Pop (9, 3). Node 3 IS dst. Return 9. Back in main: 9 ≤ 9 → return True. ✓ Correct.

---

`[audio]` **Alex:** Good. Now let me check edge cases.

`[screen]`

```python
# Test 2: src == dst
# can_receive_message(3, [...], src=2, dst=2, d=0) → True
# Handled by the early return at line 1 of main function ✓

# Test 3: dst unreachable (disconnected graph)
# n=4, connections: 0-1(3), src=0, dst=3, d=100
# Router 3 has no connections → dist[3] stays inf
# dijkstra returns inf → inf <= 100 is False → return False ✓

# Test 4: Reachable but exceeds d
# n=3, connections: 0-1(5), 1-2(5), src=0, dst=2, d=8
# Shortest path: 0→1→2 = 10 > 8 → False ✓

# Test 5: Cycle in graph — shouldn't cause infinite loop
# n=3, connections: 0-1(2), 1-2(3), 2-0(1), src=0, dst=2, d=3
# Two paths: 0→2(direct via 2-0? wait — 2-0 means 0-2 direct distance 1!)
# Actually: 0→2 directly = 1, 0→1→2 = 5
# Shortest = 1 ≤ 3 → True ✓
# visited set prevents revisiting, cycle handled correctly ✓
```

`[audio]` **Alex:** The visited set in Dijkstra's handles cycles correctly — once a node is finalized, we skip it even if it appears again on the heap due to a cycle. So no infinite loop.

`[note]` Alex addresses cycles explicitly — this is the exact edge case that a naive BFS/DFS would fail on without visited tracking. Google interviewers specifically look for this awareness.

---

`[audio]` **Alex:** One more — what about a graph where there are multiple paths to dst and we need the actual shortest, not the first found?

`[audio]` **Alex:** Dijkstra's guarantees the first time a node is popped from the min-heap is the shortest distance, since all weights are positive. So even if there are multiple paths, we'll always get the minimum. That's the beauty of the algorithm here.

`[note]` Alex proactively addresses the multi-path correctness concern without being asked. Very strong signal.

---

`[audio]` **Alex:** Alright — complexity analysis. Time complexity: building the graph is O(E). Dijkstra's with a binary heap is O((V + E) log V), where V is N up to 10^4 and E is up to 10^5. So overall O((N + E) log N) — that's roughly (10^4 + 10^5) × 14 ≈ 1.5 million operations, well within bounds.

`[audio]` **Alex:** Space complexity: O(V + E) for the adjacency list, O(V) for the dist dictionary and visited set, O(V + E) in the worst case for the heap (if we push duplicates). So overall O(V + E).

`[note]` Alex states complexity without being asked. They also do a rough sanity-check multiplication to verify feasibility, not just recite the Big-O formula. This is a "Strong Hire" behavior.

---

`[audio]` **Jordan:** Nice. I do want to point one thing out — in your `dijkstra` function, you initialize `dist` as a dictionary from `range(n)`. But what if some router IDs appear in `connections` but not in `range(n)` — or vice versa?

`[note]` Jordan introduces a subtle correctness challenge. This is a real follow-up pattern in Google interviews — probing edge cases in the implementation.

---

`[audio]` **Alex:** Oh, that's a good point. The way I've structured it, I'm assuming router IDs are contiguous from 0 to n-1, which matches the problem statement — "N routers with IDs 0 to N-1." But you're right that my current initialization only initializes those specific IDs. If a router referenced in `connections` has an ID outside 0 to n-1, the dist lookup would fail.

`[audio]` **Alex:** Given the problem constraints that IDs are 0 to N-1, I think the current implementation is safe. But if I wanted to be defensive, I could use a `defaultdict` for `dist` as well, initializing unseen keys to infinity on access. Want me to make that change?

`[audio]` **Jordan:** No, that's fine — the clarification is enough. I just wanted to see how you reasoned through it.

`[note]` Alex doesn't get defensive. They reason through the concern clearly, reference the problem constraints, and offer a fix. This is exactly the right collaborative response.

---

## ─────────────────────────────────────────
## PHASE 6 — Follow-Up Question
## `[41:30 – 44:00]`
## ─────────────────────────────────────────

---

`[audio]` **Jordan:** Great. I have a follow-up for you. The problem changes slightly: the message now travels hop-by-hop — it only goes to the single nearest router from each hop. So at each hop, the message only reaches the one directly-connected router with the minimum distance. Same question: does `dst` receive the message? And now there's no global max-distance `d` — it's just about whether it can reach `dst` following this nearest-neighbor path.

`[note]` This is a real follow-up variant seen in 2024 Google onsite experiences. The problem structure shifts from "shortest path within budget" to "greedy nearest-neighbor traversal."

---

`[audio]` **Alex:** Interesting — so the routing rule completely changes. Instead of accumulating total distance freely, each router, when it receives the message, only forwards it to its single nearest neighbor. So we're building a chain of nearest-neighbor hops, starting from `src`. The question is whether this chain ever reaches `dst`.

`[audio]` **Alex:** Let me think about this for a moment...

`[note]` Alex takes 15 seconds to think — brief, not silent. They narrate intermittently.

---

`[audio]` **Alex:** Okay, so here's how I'm modeling it: starting from `src`, we look at all directly-connected routers and pick the one with minimum edge distance. That router receives the message next. Then from that router, it picks ITS nearest neighbor — excluding the router it just came from, or do we allow going back?

`[audio]` **Jordan:** Good question — let's say we allow revisiting. No global visited state.

`[audio]` **Alex:** Alright. So this could technically loop if the nearest neighbor relationship is symmetric — router A's nearest neighbor is B, and B's nearest neighbor is A. We'd ping-pong forever and never reach `dst`. Should I detect cycles and return False if we loop without reaching `dst`?

`[audio]` **Jordan:** Yes — if we detect a cycle, return False.

---

`[audio]` **Alex:** Okay, so the algorithm becomes a simulation: maintain a `current` router, maintain a visited set to detect cycles. At each step, find the minimum-weight neighbor of `current`. If it's `dst`, return True. If it's already in visited, we're in a cycle — return False. Otherwise, mark it visited and move to it. If at any point there are no neighbors, return False.

`[screen]` Alex sketches the updated function below the original code:

```python
def can_receive_nearest_hop(n, connections, src, dst):
    if src == dst:
        return True
    
    graph = build_graph(connections)  # reuse from before
    
    current = src
    visited = {src}
    
    while True:
        if not graph[current]:
            return False  # dead end
        
        # Find nearest (minimum-distance) neighbor
        nearest_neighbor, _ = min(graph[current], key=lambda x: x[1])
        
        if nearest_neighbor == dst:
            return True
        
        if nearest_neighbor in visited:
            return False  # cycle detected, never reaching dst
        
        visited.add(nearest_neighbor)
        current = nearest_neighbor
```

`[audio]` **Alex:** I'm reusing the `build_graph` helper — no need to rewrite it. The main logic is: iterate from the current router, always picking the minimum-weight edge. Detect cycles with the visited set. Time complexity here is O(E log V) in the worst case — we traverse at most N nodes, and at each node we do a `min()` over the neighbors which is O(degree). Overall O(V × max_degree) = O(E) in the worst case. Space is O(V) for visited.

`[note]` Alex reuses existing code, handles the cycle detection correctly, and states complexity for the new variant. This completes the follow-up cleanly within the time window.

---

`[audio]` **Jordan:** Perfect. I think I've got enough signal — we're actually close on time, so let's wrap up the coding here. Any questions for me?

---

## ─────────────────────────────────────────
## PHASE 6 — Closing & Q&A
## `[44:00 – 45:00]`
## ─────────────────────────────────────────

---

`[audio]` **Alex:** Absolutely — I had a couple of questions I was hoping to ask.

`[audio]` **Alex:** First — you mentioned you work on the Search indexing pipeline. I'm curious: at Google's scale, how do you handle the tradeoff between index freshness and serving latency? Like, is there a pipeline that has to constantly balance how up-to-date the index is versus query throughput?

`[audio]` **Jordan:** Yeah, that's actually one of the most interesting parts of the work — we have tiered indexing with different freshness SLAs, and real-time signals vs. batch processing are basically in constant tension. It's a great area to be in if you care about systems and scale.

`[audio]` **Alex:** That's fascinating — that tiered approach sounds a lot like what I'd imagine a write-optimized vs read-optimized system tradeoff looks like in practice. I'd love to learn more about that.

`[note]` Alex's question is specific to Jordan's team — not generic ("what do you like about Google?"). It demonstrates that Alex was listening during the intro and has genuine intellectual curiosity about the work. The follow-up comment bridges their own experience (systems tradeoffs) to the answer, making it a real conversation not an interrogation.

---

`[audio]` **Alex:** Second — for someone joining as an L3, what does the first six months typically look like on your team? Is it mostly ramp-up and well-scoped features, or do L3s get thrown into the deep end pretty quickly?

`[audio]` **Jordan:** We pair every L3 with a tech lead mentor for the first quarter — you'd work on smaller features and bug fixes at first, then gradually take on bigger chunks of owned features by the three to six month mark. The ramp is real but we don't leave you adrift.

`[audio]` **Alex:** That's really good to hear — structured mentorship is something I've found makes a big difference. Thank you.

---

`[audio]` **Jordan:** Great questions. Alright Alex, we're at time — I'll pass my notes along. It was great chatting with you today.

`[audio]` **Alex:** Likewise — I really enjoyed the problem. The follow-up especially was a nice twist. Thanks so much for your time, Jordan.

`[audio]` **Jordan:** Good luck with the rest of the process!

`[audio]` **Alex:** Thank you — take care!

---

## ─────────────────────────────────────────
## Post-Interview: Full Google Doc State
## ─────────────────────────────────────────

`[screen]` This is what the shared Google Doc contains at the end of the interview:

```python
# === CONSTRAINTS ===
# N routers, IDs: 0 to N-1
# connections[i] = [router_a, router_b, distance] — bidirectional
# At most one edge between any pair
# Graph can have cycles (general undirected graph)
# All distances are positive integers (no negatives/zero)
# N <= 10^4, edges <= 10^5
# Return True if dst is reachable from src with total path distance <= d
# Edge case: if src == dst → return True immediately


import heapq
from collections import defaultdict


def can_receive_message(n, connections, src, dst, d):
    """
    Returns True if dst can receive the broadcast from src within max distance d.
    Uses Dijkstra's with early termination for efficiency.
    """
    if src == dst:
        return True
    
    graph = build_graph(connections)
    min_dist = dijkstra(graph, src, dst, n)
    return min_dist <= d


def build_graph(connections):
    graph = defaultdict(list)
    for a, b, dist in connections:
        graph[a].append((b, dist))
        graph[b].append((a, dist))
    return graph


def dijkstra(graph, src, dst, n):
    dist = {i: float('inf') for i in range(n)}
    dist[src] = 0
    
    min_heap = [(0, src)]
    visited = set()
    
    while min_heap:
        curr_dist, node = heapq.heappop(min_heap)
        
        if node == dst:
            return curr_dist
        
        if node in visited:
            continue
        visited.add(node)
        
        for neighbor, weight in graph[node]:
            new_dist = curr_dist + weight
            if new_dist < dist[neighbor]:
                dist[neighbor] = new_dist
                heapq.heappush(min_heap, (new_dist, neighbor))
    
    return float('inf')


# === TEST CASES ===

# Test 1: Happy path — dst reachable within d
# n=4, 0-1(3), 1-2(4), 2-3(2), src=0, dst=3, d=9 → True ✓

# Test 2: src == dst → True (early return) ✓

# Test 3: dst unreachable (disconnected) → False ✓

# Test 4: Path exists but exceeds d → False ✓

# Test 5: Cycle — visited set prevents infinite loop ✓


# === FOLLOW-UP: Nearest-Hop Only ===

def can_receive_nearest_hop(n, connections, src, dst):
    """
    Message only forwards to the single nearest (min-weight) neighbor at each hop.
    Returns True if dst is eventually reached, False if cycle detected or dead end.
    """
    if src == dst:
        return True
    
    graph = build_graph(connections)
    
    current = src
    visited = {src}
    
    while True:
        if not graph[current]:
            return False
        
        nearest_neighbor, _ = min(graph[current], key=lambda x: x[1])
        
        if nearest_neighbor == dst:
            return True
        
        if nearest_neighbor in visited:
            return False
        
        visited.add(nearest_neighbor)
        current = nearest_neighbor
```

---

## ─────────────────────────────────────────
## Interviewer Scorecard (What Jordan Would Write)
## ─────────────────────────────────────────

`[note]` This section is for the reader — this is not visible during the interview. It represents what a Google interviewer would likely submit to the Hiring Committee based on the performance above.

---

**Rating: Strong Hire**

**Problem Solving:**  
Candidate quickly identified the core structure as a shortest-path problem and correctly chose Dijkstra's over BFS given positive weighted edges. Unprompted, stated brute force first and explained why it would not scale. Introduced early-termination optimization without prompting. Strong algorithmic reasoning throughout.

**Coding:**  
Clean, production-quality code with meaningful names and logical decomposition into helpers. Top-down structure was immediately evident. Docstrings and inline comments used appropriately. No syntax errors or structural bugs. Completed main solution in ~15 minutes, well within the time budget.

**Communication:**  
Outstanding. Candidate narrated every decision — not just what they were doing but why. No extended silences. Clarifying questions were structured and purposeful; candidate explicitly wrote down constraints as doc comments before coding. Verified understanding with a concrete example. Responded to the implementation challenge (range(n) concern) calmly and with precise reasoning.

**Testing & Verification:**  
Proactively traced through test cases before being asked. Covered: happy path, src==dst, unreachable dst, distance-exceeded case, and cycles. Explicitly addressed why cycles don't cause infinite loops — a common failure point.

**Follow-Up:**  
Adapted quickly to the constraint change. Caught an ambiguity in the follow-up (revisiting vs. no-revisiting) and asked for clarification. Designed the cycle-detection mechanism independently. Correctly reused existing code. Time/space analysis was accurate.

**Googleyness Signal:**  
Warm and collaborative throughout. Closing questions were specific, thoughtful, and showed genuine curiosity about the team's work. Demonstrated intellectual engagement beyond just answering the prompt. No signs of defensiveness when challenged.

---

## ─────────────────────────────────────────
## Key Behaviors Demonstrated — Summary
## ─────────────────────────────────────────

| Moment | What Alex Did | Why It Mattered |
|--------|--------------|-----------------|
| Intro | 80-sec structured intro with quantified project | Confident, concise, memorable |
| Problem received | Silent full read, then restatement | Shows comprehension discipline |
| Clarification | 5 structured questions, wrote constraints as doc comments | Professional, prevents later mistakes |
| Concrete example | Traced 0→1→2 path before coding | Confirmed understanding, saved 15 min of wrong-direction coding |
| Brute force first | Named it, gave complexity, ruled it out | Showed reasoning process, not just recall |
| Algorithm choice | Explicitly ruled out BFS, chose Dijkstra's with justification | Deep understanding, not pattern-matching |
| Before coding | "Does this direction seem reasonable to you?" | Collaborative alignment — not insecurity |
| Top-down coding | Function skeleton before filling in | Production-code mindset |
| Narration during coding | Explained visited set, early exit, relaxation | Made thinking transparent |
| Post-code review | Scrolled back through before testing | Caught potential issues, showed diligence |
| Testing | Manually traced with numbers, then edge cases, then cycles | Proactive, thorough, no bugs found by interviewer |
| Complexity | Stated unprompted, with rough numerical sanity check | Engineering maturity |
| Interviewer challenge | Reasoned through it, referenced constraints, offered fix | Calm, precise, collaborative |
| Follow-up | Caught ambiguity immediately, asked clarifying question | Real-world engineering instinct |
| Closing questions | Team-specific, intellectually engaged, conversational | Strong culture-fit signal |

---

*This simulation is based on real L3 Google onsite question patterns (BFS/graph + follow-up variants) documented in LeetCode Discuss, Blind, Medium, and Glassdoor from 2022–2025.*