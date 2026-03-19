By Sonnet-6, long one hour

---
# Google Coding Interview Simulation #1

**Format:** Virtual On-Screen Coding Interview

**Duration:** 60 Minutes

**Role:** L4/L5 Software Engineer

**Platform:** Google Meet + Shared Coding Environment (Google Docs / CoderPad equivalent)

**Notation:**

- `[screen]` — something is visible on the shared screen

- `[Interviewer]:` — interviewer speaking (audio)

- `[Candidate]:` — candidate speaking (audio)

- `[silence]` — active thinking pause, normal and expected

  

---

  

## Pre-Interview Setup

  

```

[screen] — Google Meet join screen. Calendar invite titled:

"Google SWE Interview — [Candidate Name] — Coding Round"

Room: meet.google.com/xxx-xxxx-xxx

```

  

---

  

## [00:00 — 00:02] | Joining & Setup

  

```

[screen] — Google Meet video call. Two participants: Interviewer (camera on, Google badge faintly visible)

and Candidate (camera on). A blank Google Doc or shared coding pad link is visible

in the chat but not yet opened.

```

  

`[Interviewer]:` Hi! Can you hear me alright? Good — come on in. Let me just get this set up on my end. One second.

  

`[Candidate]:` Yeah, I can hear you clearly. Good to meet you!

  

`[Interviewer]:` Good to meet you too. My name is Priya — I'm an engineer on the Distributed Systems team here at Google, been here about four years. So today I'll be your interviewer. How are you doing today?

  

`[Candidate]:` I'm doing well, feeling good. A little excited, but mostly good.

  

`[Interviewer]:` That's the right energy. *(laughs)* Alright, before we jump in, let me just confirm a few things. We'll have about 60 minutes together. I'll present a problem, and the expectation is that we work through it together — think of it more as a pair programming session rather than a formal test. You talking through your thinking out loud is honestly more valuable to me than just getting the right answer, so please do that. Sound good?

  

`[Candidate]:` Absolutely, sounds good.

  

`[Interviewer]:` Great. I'm going to drop a link in the chat — we'll be using a shared coding doc. You can write your code there, and I can see it in real time.

  

```

[screen] — Chat notification: "Priya shared a link → [Coding Pad URL]"

Candidate opens the link.

[screen] — Shared coding environment opens. Blank page, language selector visible.

Candidate selects Python.

```

  

`[Interviewer]:` Perfect. Alright, let me also pull up a quick notepad on my end. One more second... okay, we're good. Ready when you are.

  

`[Candidate]:` Ready.

  

---

  

## [00:02 — 00:07] | Icebreaker & Context Setting

  

`[Interviewer]:` Quick question before we dive in — just so I know where you're coming from. What have you been working on most recently? Like, the last project or problem that genuinely got you excited to sit down at your keyboard.

  

`[Candidate]:` Yeah, sure. So recently I've been working on optimizing a data pipeline — it was processing a pretty large stream of events, and we had some latency issues. We moved from a naive in-order processing approach to a sliding window aggregation and it cut our P99 latency by about 40%. That one was satisfying because the idea was actually quite simple but the execution needed some careful handling of ordering guarantees.

  

`[Interviewer]:` That's interesting — sliding window aggregations are great, especially when you get the edge cases right. Did you run into any ordering edge cases?

  

`[Candidate]:` We did, actually. Out-of-order events were the tricky part. We had to decide — do we wait for a late-arriving event or do we close the window and drop it? We went with a configurable late-arrival tolerance window.

  

`[Interviewer]:` Smart call. Alright, I appreciate that context. Let's get into the problem.

  

---

  

## [00:07 — 00:14] | Problem Introduction & Clarification Phase

  

```

[screen] — Coding pad still blank. No problem statement is displayed.

The interviewer does NOT paste a problem — it is delivered verbally only.

```

  

`[Interviewer]:` So here's the scenario. Imagine you're working on a system for a civil engineering firm. They're building a series of vertical retaining walls along a channel — think of it like a cross-section view. They give you a list of wall heights. Your job is to figure out the maximum volume of water that can be contained between any two walls.

  

`[Candidate]:` Got it. I have some clarifying questions before I start, if that's alright.

  

`[Interviewer]:` Of course. Please.

  

`[Candidate]:` Okay, first — when you say "between any two walls," do we choose exactly two walls, or is it any contiguous segment of walls?

  

`[Interviewer]:` Exactly two. You pick any two walls, and water fills up between them.

  

`[Candidate]:` Got it. Second — the walls are at fixed integer positions? Like the spacing between adjacent walls is uniform?

  

`[Interviewer]:` Yes, you can assume the walls are unit distance apart. So the width between wall at index `i` and wall at index `j` is `j - i`.

  

`[Candidate]:` Perfect. Third — can wall heights be zero? Or negative? Like, could a wall have height zero, meaning it doesn't exist?

  

`[Interviewer]:` Reasonable question. Let's say heights are non-negative integers. A height of zero is valid — it just means there's a gap.

  

`[Candidate]:` And the water level is limited by the shorter of the two walls, right? It overflows at the minimum height.

  

`[Interviewer]:` Exactly. The water fills up to the height of the shorter wall.

  

`[Candidate]:` One more — what's the size of the input we should expect? Are we talking tens of elements, millions?

  

`[Interviewer]:` Good question. Assume up to 10 to the 5th elements. So a hundred thousand walls.

  

`[Candidate]:` And the heights themselves?

  

`[Interviewer]:` Heights can be up to 10 to the 4th.

  

`[Candidate]:` Alright. And just to confirm — we're maximizing `min(heights[i], heights[j]) * (j - i)` over all valid pairs `i < j`?

  

`[Interviewer]:` Yes, that's the correct formulation. Well done — you extracted that cleanly.

  

```

[screen] — Candidate types the problem statement into the coding pad:

  

# Problem:

# Given a list of non-negative integers `heights` representing

# wall heights at unit-distance positions, find the maximum volume

# of water that can be trapped between any two walls.

#

# Volume = min(heights[i], heights[j]) * (j - i)

# Maximize over all pairs i < j

#

# Constraints:

# - 1 <= len(heights) <= 10^5

# - 0 <= heights[i] <= 10^4

```

  

`[Candidate]:` Let me also just call out a few edge cases I'm thinking about:

  

1. What if the list has only one wall? There's no pair, so the answer would be zero.

2. What if all walls have height zero? Volume would be zero.

3. What if all walls have the same height? The widest span, i.e., the two outermost walls, would give the most water.

4. What if the tallest wall is in the middle? It might not be part of the optimal pair.

  

`[Interviewer]:` These are great. For the single-element case — yes, return zero. The others you've identified correctly. Keep those in mind as you build your solution.

  

```

[screen] — Candidate adds to the coding pad:

  

# Edge Cases:

# - len(heights) == 1 → return 0

# - all zeros → return 0

# - all equal heights → max pair is outermost (widest)

# - tallest wall in middle → doesn't necessarily contribute to max

```

  

---

  

## [00:14 — 00:26] | Brute Force Approach

  

`[Candidate]:` Alright. Let me start with a brute force approach and then we can talk about how to make it better. The straightforward way is to check every pair of walls.

  

```

[screen] — Candidate types:

  

def max_water_brute(heights):

n = len(heights)

if n < 2:

return 0

max_vol = 0

for i in range(n):

for j in range(i + 1, n):

width = j - i

height = min(heights[i], heights[j])

vol = width * height

max_vol = max(max_vol, vol)

return max_vol

```

  

`[Candidate]:` So for every pair `(i, j)`, I compute the width as `j - i`, the effective height as the minimum of the two walls, multiply them, and track the maximum. Pretty direct.

  

`[Interviewer]:` Looks good. What's the time complexity here?

  

`[Candidate]:` We have two nested loops — the outer runs `n` times, the inner runs up to `n - 1` times. So it's O(n²) time. With n up to 10^5, that's 10^10 operations in the worst case, which is definitely too slow.

  

`[Interviewer]:` And space?

  

`[Candidate]:` O(1) extra space — we're just tracking a running maximum and a few variables. No additional data structures.

  

`[Interviewer]:` Right. So we can't use this for the given constraints. What's your thinking for optimization?

  

`[Candidate]:` Yeah, so let me think about this out loud. The problem with brute force is that we're blindly checking every pair. The question is — can we avoid that by making smarter decisions about which pairs to skip?

  

*(pause — about 20 seconds)*

  

`[Candidate]:` Let me think about what determines the volume. Volume equals width times min-height. So there are two levers: width and height. If I start with the widest possible pair — the two outermost walls — I have the maximum possible width. The only way to get more volume from a narrower pair is if the minimum height increases enough to compensate for the reduced width.

  

`[Interviewer]:` Keep going — that's an interesting observation.

  

`[Candidate]:` Right. So let's say I have a left pointer at index 0 and a right pointer at index n-1. I compute the volume. Now if I want to try a different pair, I need to move one of the pointers inward — that necessarily reduces the width by at least 1. So the only way that can help is if the minimum height for the new pair is greater than the current minimum height.

  

`[Candidate]:` Here's the key insight: the minimum height of the current pair is determined by the shorter of the two walls. If I move the pointer at the taller wall inward, the new minimum height can only stay the same or decrease — because the shorter wall is still one of the walls. So moving the taller wall inward can never improve things.

  

`[Interviewer]:` Walk me through that reasoning more carefully. Why can't moving the taller wall ever help?

  

`[Candidate]:` Sure. Say `heights[left] <= heights[right]` — so left is the shorter wall. The volume is `heights[left] * (right - left)`. Now if I move `right` inward to `right - 1`, the new volume is `min(heights[left], heights[right-1]) * (right - 1 - left)`. The width shrank by 1, and `min(heights[left], heights[right-1])` is at most `heights[left]` — because the left wall is still there and it's the bottleneck. So the new volume is at most `heights[left] * (right - 1 - left)`, which is strictly less than `heights[left] * (right - left)`. Moving the taller wall inward always makes things worse or equal — we can safely discard it.

  

`[Interviewer]:` That's a solid argument. So which pointer do you move?

  

`[Candidate]:` Move the pointer at the shorter wall inward — because that's the only move that has a chance of increasing the minimum height.

  

`[Interviewer]:` Good. Does this guarantee we find the optimal solution?

  

`[Candidate]:` Yes — and here's the proof sketch: For any pair `(i*, j*)` that produces the global maximum, at the moment when our left pointer reaches `i*` or our right pointer reaches `j*`, the algorithm won't skip that pair. More formally — suppose `heights[i*] <= heights[j*]`. The right pointer could only have moved past `j*` if, at the time, the left pointer pointed to something taller than the current right wall, meaning we'd already found something at least as good. So the optimal pair is never missed.

  

`[Interviewer]:` I'll accept that as a valid argument. You can prove it more formally with a contradiction but that's the right intuition. So what's your algorithm?

  

`[Candidate]:` Two pointers — one at each end, moving inward. At each step, compute the current volume, update the maximum, then advance the pointer at the shorter wall. If both walls are equal in height, it doesn't matter which we move — I'll move the left one. We stop when the pointers meet.

  

`[Interviewer]:` Great. What will the complexity be?

  

`[Candidate]:` O(n) time — we iterate through the array once, each pointer moves at most n steps total. O(1) space — just a couple of pointers and a running max. That's a factor of n improvement over brute force.

  

`[Interviewer]:` Perfect. Go ahead and code it up.

  

---

  

## [00:26 — 00:42] | Coding the Optimal Solution

  

```

[screen] — Candidate moves to a new section of the coding pad and types:

```

  

`[Candidate]:` Alright, let me write this up.

  

```

[screen] — Candidate types incrementally, speaking through each line:

  

def max_water(heights):

# Handle edge case: need at least two walls

if len(heights) < 2:

return 0

```

  

`[Candidate]:` First, the edge case check. If there's fewer than two walls, there's no valid pair, so we return zero.

  

```

[screen]:

left, right = 0, len(--heights) - 1

max_vol = 0

```

  

`[Candidate]:` Initialize the two pointers — left starts at the beginning, right starts at the end. `max_vol` tracks our global maximum.

  

```

[screen]:

while left < right:

# Current pair volume

width = right - left

height = min(heights[left], heights[right])

current_vol = width * height

max_vol = max(max_vol, current_vol)

```

  

`[Candidate]:` At each iteration, compute the volume for the current pair. Width is the distance between the pointers, height is the minimum of the two walls.

  

```

[screen]:

# Move the pointer at the shorter wall inward

if heights[left] <= heights[right]:

left += 1

else:

right -= 1

```

  

`[Candidate]:` If the left wall is shorter or equal, we advance left. Otherwise advance right. This is the greedy choice we argued for.

  

```

[screen]:

return max_vol

```

  

`[Candidate]:` And return the maximum. Let me look at the full function once.

  

```

[screen] — Full function visible:

  

def max_water(heights):

if len(heights) < 2:

return 0

left, right = 0, len(heights) - 1

max_vol = 0

while left < right:

width = right - left

height = min(heights[left], heights[right])

current_vol = width * height

max_vol = max(max_vol, current_vol)

if heights[left] <= heights[right]:

left += 1

else:

right -= 1

return max_vol

```

  

`[Candidate]:` Looks clean. Let me just double check the loop termination — we stop when `left >= right`, meaning all pairs have been considered. The loop only runs when there's at least one valid pair remaining.

  

`[Interviewer]:` Good. Before we run it, let me ask — is there any case where your pointer advancement decision could be wrong?

  

`[Candidate]:` *(thinking for a moment)* The only potential concern is the tie case — when `heights[left] == heights[right]`. In that case, I move left. Could moving right be better? Well, since both walls have the same height, either choice leads to the same effective height constraint being "freed up" for the next step. The argument I made earlier — moving the shorter wall — is equally valid for either pointer in a tie. So both choices are correct in a tie situation.

  

`[Interviewer]:` Exactly right. Good. One other thing — I notice you used `min()` as a function call. Is that a concern?

  

`[Candidate]:` It's O(1) — `min` of two values is a constant time operation, so no concern there. If it were a `min` over a subarray, that'd be different.

  

`[Interviewer]:` Good. Let's do a dry run.

  

---

  

## [00:42 — 00:49] | Dry Run

  

`[Interviewer]:` Use this example: `[1, 8, 6, 2, 5, 4, 8, 3, 7]`. What do you get?

  

```

[screen] — Candidate adds below the function:

  

# Dry Run: heights = [1, 8, 6, 2, 5, 4, 8, 3, 7]

# Indices: 0 1 2 3 4 5 6 7 8

# Expected max_vol = 49 (walls at index 1 and 8, height=min(8,7)=7, width=7 → 49)

# Step-by-step:

# left=0, right=8: width=8, height=min(1,7)=1, vol=8 → max_vol=8. heights[0]<heights[8] → left++

# left=1, right=8: width=7, height=min(8,7)=7, vol=49 → max_vol=49. heights[1]>heights[8] → right--

# left=1, right=7: width=6, height=min(8,3)=3, vol=18 → max_vol=49. heights[7]<heights[1] → right--

# left=1, right=6: width=5, height=min(8,8)=8, vol=40 → max_vol=49. heights[1]==heights[6] → left++

# left=2, right=6: width=4, height=min(6,8)=6, vol=24 → max_vol=49. heights[2]<heights[6] → left++

# left=3, right=6: width=3, height=min(2,8)=2, vol=6 → max_vol=49. heights[3]<heights[6] → left++

# left=4, right=6: width=2, height=min(5,8)=5, vol=10 → max_vol=49. heights[4]<heights[6] → left++

# left=5, right=6: width=1, height=min(4,8)=4, vol=4 → max_vol=49. heights[5]<heights[6] → left++

# left=6, right=6: left == right → loop ends.

#

# Result: 49 ✓

```

  

`[Candidate]:` Walking through it — at `left=1, right=8`, we get `min(8,7) * 7 = 49`. That's our maximum and we never beat it in subsequent steps. The final answer is 49.

  

`[Interviewer]:` That's correct. The answer is 49, corresponding to walls at index 1 height 8 and index 8 height 7, with a width of 7. Very clean trace — I appreciate that you put that directly in the code as documentation.

  

`[Candidate]:` Thanks — I find it's the best way to validate correctness without running it. It also catches off-by-one issues in the loop.

  

`[Interviewer]:` Let me ask one more question about the dry run. At step where `left=1, right=6` with equal heights, you moved left. Walk me through why you're confident you didn't miss the optimal answer by not moving right there.

  

`[Candidate]:` Sure. At that point, `max_vol` is already 49. If I had moved right instead of left, I'd be at `left=1, right=5`: `min(8,4) * 4 = 16`. Still doesn't beat 49. The optimal answer was already captured. But even setting this specific case aside — in general, when heights are equal, moving either pointer is valid because the minimum height constraint can only get better if you move into a taller wall. Since both walls are currently equal, both are equally the "bottleneck." I could even try both and take the better next step, but it's not necessary for correctness.

  

`[Interviewer]:` Good answer. Alright, let's add a couple of test cases.

  

```

[screen] — Candidate adds:

  

# Test Cases

print(max_water([1, 8, 6, 2, 5, 4, 8, 3, 7])) # Expected: 49

print(max_water([1, 1])) # Expected: 1

print(max_water([4, 3, 2, 1, 4])) # Expected: 16

print(max_water([1, 2, 1])) # Expected: 2

print(max_water([0, 0, 0])) # Expected: 0

print(max_water([5])) # Expected: 0 (edge case)

print(max_water([])) # Expected: 0 (edge case)

```

  

`[Candidate]:` Let me trace the second-to-last one — `[4, 3, 2, 1, 4]`. Left=0 height=4, Right=4 height=4. Width=4, vol=16. Equal heights, move left. Left=1, right=4: min(3,4)=3, width=3, vol=9. Left wall shorter, move left. Left=2, right=4: min(2,4)*2=4. Move left. Left=3, right=4: min(1,4)*1=1. Move left. Left=4=right, stop. Answer: 16.

  

`[Interviewer]:` Correct. That's the optimal — the two `4`s at the ends.

  

---

  

## [00:49 — 00:53] | Time & Space Complexity Discussion

  

`[Interviewer]:` Let's summarize the complexity formally. Time and space — brute force versus optimal.

  

`[Candidate]:` Sure.

  

```

[screen] — Candidate adds:

  

# Complexity Analysis:

#

# Brute Force:

# Time: O(n²) — checking all pairs

# Space: O(1) — only scalar variables

#

# Two-Pointer Optimal:

# Time: O(n) — single pass, each pointer moves at most n steps

# Space: O(1) — two pointers and a running max, no extra data structures

#

# The two-pointer approach is optimal:

# - Time: We can't do better than O(n) since we need to read every element at least once

# - Space: O(1) is already optimal for output as a scalar

```

  

`[Interviewer]:` Why can't we do better than O(n) time?

  

`[Candidate]:` Information-theoretic lower bound — we need to at least read every element once, because a single element we miss could change the answer. For example, if we skip element `k`, we don't know if it's a wall height of 0 or 10,000, which could completely change the optimal pair. So any correct algorithm must be at least O(n).

  

`[Interviewer]:` Perfect. That's exactly right.

  

---

  

## [00:53 — 01:00] | Follow-Up Questions

  

`[Interviewer]:` Alright, let's do a follow-up. Good work so far. *(tone shifts slightly, more deliberate)* New question: What if I told you we want the top K pairs by water volume, not just the best one? How does your thinking change?

  

`[Candidate]:` Hmm. *(pause — about 15 seconds)* Interesting. The two-pointer approach as written doesn't naturally give us all pairs, just the maximum. To get top K, we'd need to evaluate more pairs.

  

`[Candidate]:` One approach: generate all O(n²) pairs with their volumes, sort them descending, return the top K. That's O(n² log n) time and O(n²) space — very expensive.

  

`[Candidate]:` Better approach: since we're looking for the top K, we could use a max-heap. We don't want to enumerate all pairs. Let me think if the two-pointer structure can be extended...

  

*(pause — about 20 seconds)*

  

`[Candidate]:` Actually, this is tricky. The two-pointer approach exploits the structure of the maximum problem — we discard a subproblem because we've proven it can't be the global max. But for top K, the second-best pair might be one we skipped. So the greedy discard doesn't directly transfer.

  

`[Candidate]:` A modified approach: We could think of this as a priority queue problem. Start with the widest pair, compute its volume, push it to the heap. Then generate the next candidates by shrinking from each end of the current pair and push those volumes into the heap. It's similar to how K-th smallest in a sorted matrix works. But the tricky part is avoiding duplicates — we'd need careful bookkeeping.

  

`[Interviewer]:` What would the complexity be for that?

  

`[Candidate]:` If we're careful about deduplication with a visited set, we'd explore at most O(K * n) pairs in the worst case, with heap operations costing O(log n) each. So roughly O(K * n * log n) time, O(n) space for the heap and visited set. For small K, this is much better than the O(n²) approach.

  

`[Interviewer]:` That's a reasonable direction. We don't need to code it fully, but can you sketch the structure?

  

```

[screen] — Candidate types:

  

# Top-K Pairs Sketch:

# import heapq

#

# def top_k_water(heights, k):

# n = len(heights)

# # max-heap: store (-volume, left_idx, right_idx)

# heap = [(-max_water_single(heights, 0, n-1), 0, n-1)]

# visited = {(0, n-1)}

# result = []

#

# while heap and len(result) < k:

# vol, l, r = heapq.heappop(heap)

# result.append((-vol, l, r))

#

# # Generate candidates by moving each pointer inward

# if l + 1 < r and (l+1, r) not in visited:

# heapq.heappush(heap, (-max_water_single(heights, l+1, r), l+1, r))

# visited.add((l+1, r))

# if l < r - 1 and (l, r-1) not in visited:

# heapq.heappush(heap, (-max_water_single(heights, l, r-1), l, r-1))

# visited.add((l, r-1))

#

# return result

#

# Note: This explores pairs greedily by volume. However, this doesn't

# guarantee we catch all top-K pairs — the volume landscape is non-monotone

# when shrinking both sides. This would need more rigorous analysis.

# The safe fallback for correctness is the O(n^2) enumeration if n is small,

# or approximate approaches for large n.

```

  

`[Candidate]:` I want to be honest here — this sketch works well heuristically, but proving it's complete for top-K requires more careful analysis because the volume function isn't monotone in the pair space. For a production system, I'd want to validate this or fall back to the full enumeration if K is small relative to n.

  

`[Interviewer]:` That's an excellent observation — being honest about the limits of your reasoning is really important. We value that. What's the trade-off between correctness and performance here?

  

`[Candidate]:` The trade-off is classic: correctness requires O(n²) enumeration which is exhaustive; the heap approach is faster but may miss some pairs in the top K. For an application where approximate top-K is acceptable — like a recommendation system — the heap approach may be fine. For a civil engineering system where you need the exact top K capacity pairs for regulatory approval, you'd need correctness guarantees, so enumeration or a formal proof of the heap approach's completeness.

  

`[Interviewer]:` Well reasoned. One last quick question — what if the input contained negative wall heights?

  

`[Candidate]:` Negative wall heights don't make physical sense — a wall can't have negative height. But algorithmically: if we allowed negatives, `min(heights[i], heights[j])` could be negative, giving a negative volume, which doesn't make sense physically. We'd either define volume as `max(0, min(heights[i], heights[j])) * (j - i)` — flooring at zero — or we could filter out all non-positive height walls upfront. The two-pointer logic would still work under the floored definition.

  

`[Interviewer]:` Smart to handle it at the constraint level. Good.

  

---

  

## [00:59 — 01:00] | Wrap-Up

  

`[Interviewer]:` Alright, I think we're at time. Let me just say — you did a really solid job today. You asked great clarifying questions upfront, your brute force analysis was clean, the two-pointer reasoning and proof sketch were strong, the dry run was thorough, and the top-K discussion showed good breadth. The acknowledgment of limitations in your top-K sketch is exactly the kind of intellectual honesty we look for.

  

`[Candidate]:` Thank you — that means a lot. I enjoyed the problem. The top-K extension was a fun challenge to think through.

  

`[Interviewer]:` Do you have any questions for me?

  

`[Candidate]:` Actually — one quick one. Is there a version of this problem you commonly see that adds a third dimension, like a 2D grid of heights?

  

`[Interviewer]:` *(smiles)* You're thinking of Trapping Rain Water II — the 3D variant. That's a different beast. Uses BFS with a min-heap. But that's a story for another interview. *(laughs)*

  

`[Candidate]:` Good to know. I'll look into it!

  

`[Interviewer]:` Alright, thanks for your time today. We'll be in touch through the recruiter. Take care!

  

`[Candidate]:` Thank you so much, Priya. Really appreciate it. Have a great day!

  

```

[screen] — Google Meet "Call ended" screen.

Duration displayed: 1:00:03

```

  

---

  

## Complete Final Code

  

```

[screen] — Final state of the coding pad at end of interview:

```

  

```python

# ============================================================

# Problem:

# Given a list of non-negative integers `heights` representing

# wall heights at unit-distance positions, find the maximum volume

# of water that can be trapped between any two walls.

#

# Volume = min(heights[i], heights[j]) * (j - i)

# Maximize over all pairs i < j

#

# Constraints:

# - 1 <= len(heights) <= 10^5

# - 0 <= heights[i] <= 10^4

#

# Edge Cases:

# - len(heights) == 1 → return 0

# - all zeros → return 0

# - all equal heights → max pair is outermost (widest)

# - tallest wall in middle → doesn't necessarily contribute to max

# ============================================================

  
  

# --- Brute Force O(n^2) ---

def max_water_brute(heights):

n = len(heights)

if n < 2:

return 0

  

max_vol = 0

for i in range(n):

for j in range(i + 1, n):

width = j - i

height = min(heights[i], heights[j])

vol = width * height

max_vol = max(max_vol, vol)

  

return max_vol

  
  

# --- Optimal Two-Pointer O(n) ---

def max_water(heights):

if len(heights) < 2:

return 0

  

left, right = 0, len(heights) - 1

max_vol = 0

  

while left < right:

width = right - left

height = min(heights[left], heights[right])

current_vol = width * height

max_vol = max(max_vol, current_vol)

  

# Move the pointer at the shorter wall inward —

# the taller wall can never improve the bottleneck by moving

if heights[left] <= heights[right]:

left += 1

else:

right -= 1

  

return max_vol

  
  

# Dry Run: heights = [1, 8, 6, 2, 5, 4, 8, 3, 7]

# Indices: 0 1 2 3 4 5 6 7 8

#

# left=0, right=8: width=8, height=min(1,7)=1, vol=8 → max_vol=8. left++

# left=1, right=8: width=7, height=min(8,7)=7, vol=49 → max_vol=49. right--

# left=1, right=7: width=6, height=min(8,3)=3, vol=18 → max_vol=49. right--

# left=1, right=6: width=5, height=min(8,8)=8, vol=40 → max_vol=49. left++ (tie)

# left=2, right=6: width=4, height=min(6,8)=6, vol=24 → max_vol=49. left++

# left=3, right=6: width=3, height=min(2,8)=2, vol=6 → max_vol=49. left++

# left=4, right=6: width=2, height=min(5,8)=5, vol=10 → max_vol=49. left++

# left=5, right=6: width=1, height=min(4,8)=4, vol=4 → max_vol=49. left++

# left=6 == right=6 → stop.

# Result: 49 ✓

  
  

# Test Cases

print(max_water([1, 8, 6, 2, 5, 4, 8, 3, 7])) # Expected: 49

print(max_water([1, 1])) # Expected: 1

print(max_water([4, 3, 2, 1, 4])) # Expected: 16

print(max_water([1, 2, 1])) # Expected: 2

print(max_water([0, 0, 0])) # Expected: 0

print(max_water([5])) # Expected: 0

print(max_water([])) # Expected: 0

  
  

# Complexity Analysis:

#

# Brute Force:

# Time: O(n²) — checking all pairs

# Space: O(1) — only scalar variables

#

# Two-Pointer Optimal:

# Time: O(n) — single pass, each pointer moves at most n steps

# Space: O(1) — two pointers and a running max

#

# Lower bound: O(n) is optimal — must read all elements.

  
  

# ============================================================

# Follow-Up: Top-K Pairs (sketch — not fully proven complete)

# ============================================================

# import heapq

#

# def top_k_water(heights, k):

# n = len(heights)

# def vol(l, r): return min(heights[l], heights[r]) * (r - l)

#

# heap = [(-vol(0, n-1), 0, n-1)]

# visited = {(0, n-1)}

# result = []

#

# while heap and len(result) < k:

# v, l, r = heapq.heappop(heap)

# result.append((-v, l, r))

#

# if l + 1 < r and (l+1, r) not in visited:

# heapq.heappush(heap, (-vol(l+1, r), l+1, r))

# visited.add((l+1, r))

# if l < r - 1 and (l, r-1) not in visited:

# heapq.heappush(heap, (-vol(l, r-1), l, r-1))

# visited.add((l, r-1))

#

# return result

#

# Time: O(K * n * log n), Space: O(n)

# Note: This is a heuristic — not proven complete for all top-K pairs.

# For guaranteed correctness: enumerate all O(n^2) pairs.

```

  

---

  

## Interview Scorecard (Internal — Interviewer Reference)

  

| Dimension | Signal Observed | Rating |

|---|---|---|

| **Problem Clarification** | Asked about constraints, edge cases, validated formulation verbally before coding | Strong |

| **Communication** | Narrated every decision, proactively flagged trade-offs | Strong |

| **Brute Force → Optimal** | Identified O(n²) solution cleanly, motivated the two-pointer optimization step by step | Strong |

| **Algorithmic Reasoning** | Provided informal correctness proof for the greedy pointer choice | Strong |

| **Code Quality** | Clean, readable, commented, edge-cases handled at function boundary | Strong |

| **Dry Run** | Volunteered a full step-by-step trace unprompted | Strong |

| **Complexity Analysis** | Correctly analyzed time and space, gave lower-bound argument | Strong |

| **Follow-Up Adaptability** | Extended to top-K thoughtfully, acknowledged limits of sketch | Strong |

| **Intellectual Honesty** | Flagged incomplete proof for top-K without prompting | Exceptional |

  

---

  

## Candidate Self-Review Notes

  

**What went well:**

- Clarifying questions extracted the complete problem from a vague prompt

- Two-pointer reasoning was motivated, not just stated — explained the greedy choice

- Dry run was thorough and caught the tie-case nuance

- Top-K extension showed systems thinking and honesty about limitations

  

**Areas to practice:**

- The formal proof of the two-pointer greedy can be tightened (proof by contradiction on optimal pair never being skipped)

- The top-K heap approach should be studied more deeply — Trapping Rain Water II (3D) is a natural follow-up

- Practice articulating the "information-theoretic lower bound" argument more fluidly