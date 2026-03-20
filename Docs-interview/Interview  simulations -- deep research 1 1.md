By Gemini

---
This simulation represents the "Gold Standard" for a 45-minute Google L3 (Entry Level) Technical Interview. It follows the ideal time-management blueprint: 5 mins for intro, 5 mins for clarification, 10 mins for approach, 15 mins for coding, 5 mins for testing, and 5 mins for Q&A.

The problem selected is the **"GPS Time-Series Interpolation"**, a high-frequency 2024-2025 L3 onsite question involving two-pointers and linear math.

---

### **0:00 – 0:05: The Human Connection & Introduction**

**[audio] Interviewer:** "Hi there! I'm Sarah, a Senior SWE on the Google Maps team. I've been here about four years. Today we’ll spend about 35-40 minutes on a coding problem and then leave some time at the end for your questions. How are you doing today?"

**[audio] Candidate:** "I'm doing great, Sarah! Thanks for having me. I’m currently finishing my Master's at GT and have been working on a few distributed systems projects. Really excited to chat about Maps, it's a product I use every day."

---

### **0:05 – 0:10: Problem Statement & Clarifying Questions**

**[audio] Interviewer:** "Great! I've pasted the problem into the doc. Take a moment to read it."

**[screen] Shared Doc:**

> _Google’s location services receive a stream of GPS data points from a user’s device. Each data point is a tuple: `(timestamp, latitude, longitude)`. Because data is sent over a variable network, we might miss some points. Write a function that takes this list of data points and a `target_timestamp`, and returns the estimated location._

**[audio] Candidate:** "Okay, looking at the prompt. Just to clarify, if the `target_timestamp` matches an existing point exactly, I should just return that location, right?"

**[audio] Interviewer:** "Correct."

**[audio] Candidate:** "And if it's in between two points, should I use linear interpolation? For example, if I have points at $t=10$ and $t=20$, and the target is $t=15$, should I return the midpoint?"

**[audio] Interviewer:** "Exactly. How should we handle cases where the `target_timestamp` is before the first point or after the last one?"

**[audio] Candidate:** "Good question. Since we can't interpolate without two boundaries, we could either return an error, the closest point (clamping), or `null`. For a real-time system, I'd suggest returning `null` or an empty result to avoid false accuracy."

**[audio] Interviewer:** "Let's go with `null` for out-of-bounds."

---

### **0:10 – 0:20: The Approach & Complexity Discussion**

**[audio] Candidate:** "The most straightforward way—the brute force—would be to iterate through the list until we find two timestamps that 'sandwich' our target. That would be $O(N)$ time. However, if this list is sorted by timestamp, which GPS data usually is, we can optimize this."

**[audio] Interviewer:** "Assume the data is sorted. How would you optimize?"

**[audio] Candidate:** "I can use **Binary Search**. Instead of a linear scan, I’ll find the insertion point in $O(\log N)$ time. Once I have the two neighboring indices, I’ll apply the linear interpolation formula."

**[audio] Interviewer:** "What's the formula you'd use for the interpolation?"

**[audio] Candidate:** "For each coordinate—let’s say latitude—the value would be: $Lat_{target} = Lat_1 + (Lat_2 - Lat_1) \times \frac{T_{target} - T_1}{T_2 - T_1}$ Essentially, finding the ratio of time elapsed and applying it to the distance between coordinates."

**[audio] Interviewer:** "Sounds solid. Let's implement that. Use whatever language you’re most comfortable with."

---

### **0:20 – 0:35: Implementation (Coding Phase)**

**[audio] Candidate:** "I'll use Python. I'll start by defining the helper for the math and then the main search."

**[screen] Candidate Types (No Syntax Highlighting):**

Python

```
def get_location(data, target_t):
    # data is list of [t, lat, lon]
    if not data:
        return None
    
    n = len(data)
    # Check boundaries
    if target_t < data or target_t > data[n-1]:
        return None
        
    # Binary Search for the right bound
    left, right = 0, n - 1
    while left <= right:
        mid = (left + right) // 2
        if data[mid] == target_t:
            return (data[mid][1], data[mid][2])
        elif data[mid] < target_t:
            left = mid + 1
        else:
            right = mid - 1
            
    # After loop, 'right' is the index before target, 'left' is after
    p1 = data[right]
    p2 = data[left]
    
    return interpolate(p1, p2, target_t)

def interpolate(p1, p2, target_t):
    t1, lat1, lon1 = p1
    t2, lat2, lon2 = p2
    
    ratio = (target_t - t1) / (t2 - t1)
    
    res_lat = lat1 + (lat2 - lat1) * ratio
    res_lon = lon1 + (lon2 - lon1) * ratio
    
    return (res_lat, res_lon)
```

**[audio] Candidate:** "I’m naming the variables `p1` and `p2` for points 1 and 2. I’m also making sure I don't have a division by zero; since we checked for an exact match and the points are sorted, `t2 - t1` should always be positive."

---

### **0:35 – 0:40: Dry Run & Nudges**

**[audio] Interviewer:** "Looks clean. Let’s dry run with `data = [[10, 20, 20], [20, 30, 30]]` and `target_t = 15`."

**[audio] Candidate:** "Sure.

1. `target_t` is 15. It's within bounds.
    
2. Binary search: `mid` will eventually settle. After the loop, `right` will be index 0 ($t=10$) and `left` will be index 1 ($t=20$).
    
3. `p1` is `[10, 20, 20]`, `p2` is `[20, 30, 30]`.
    
4. `ratio = (15 - 10) / (20 - 10) = 5/10 = 0.5`.
    
5. `res_lat = 20 + (30 - 20) * 0.5 = 20 + 5 = 25`.
    
6. Return `(25, 25)`. That matches the midpoint intuition."
    

**[audio] Interviewer:** "Great. What if the `data` stream is extremely large—too large for memory—and we are looking for many `target_timestamps` in increasing order?"

**[audio] Candidate:** "Ah, for a streaming or 'Big Data' context! If both the data and the queries are sorted, Binary Search is actually redundant. I should use a **Two-Pointer** approach. I’ll keep a pointer on the current data segment and just advance it as the `target_timestamp` increases. This keeps the complexity at $O(N + M)$ for $N$ points and $M$ queries, which is much better than $O(M \log N)$ if $M$ is large."

---

### **0:40 – 0:45: Wrap Up & Q&A**

**[audio] Interviewer:** "I like that optimization. We have a few minutes left. Any questions for me?"

**[audio] Candidate:** "Yes! I saw that Google recently updated the routing algorithms for eco-friendly paths. How does your team balance the trade-off between the fastest route and the most fuel-efficient one in terms of system latency?"

**[audio] Interviewer:** "That’s a great question. We actually use a multi-objective optimization framework..." (Interviewer explains for 3 minutes).

**[audio] Candidate:** "That's fascinating. Thank you for the insight and for the session today!"

**[audio] Interviewer:** "Thanks for the clear explanation. You’ll hear from your recruiter soon!"

---

### **Why this is the "Best Case":**

- **Clarification:** Identified out-of-bounds edge cases before coding.
    
- **Communication:** Narrated every logic step ("After loop, `right` is..."), preventing silence.
    
- **Speed:** Finished the primary implementation with 10 minutes to spare for the "Big Data" follow-up.
    
- **Googliness:** Stayed humble, asked high-quality product questions, and handled the "nudges" regarding two-pointers gracefully.