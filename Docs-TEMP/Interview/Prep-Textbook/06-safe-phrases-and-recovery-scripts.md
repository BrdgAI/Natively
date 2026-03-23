# Section 06 — Safe Phrases & Recovery Scripts

> Goal: Have a word-for-word script ready for every difficult moment in the interview. Going blank, getting stuck, making a mistake, getting a hint, running out of time — this section covers all of them. Read this the night before the interview. Memorize your favorites.

---

## Core Principle

> **"Nervousness is normal. Silence is not. Turn nerves into narration."**
> — interview-flow-summarized.md

The interview is not just testing whether you can solve problems. It is testing whether you can **communicate under pressure**. A candidate who narrates uncertainty gracefully scores higher than a candidate who solves things silently.

Every moment of difficulty in this section has a scripted recovery. You are never truly "stuck" — you always have something to say.

---

## PHASE 1 RESCUES — Warm-Up & Introductions

### If you forget part of your intro mid-sentence

Just continue naturally. Say:

> *"Sorry, let me put that more clearly — [continue from a different angle]."*

Nobody expects perfect memorized speech. A brief reset is completely normal.

---

### If there are technical issues (lag, audio problems) at the start

> *"I want to make sure you can hear me clearly — can you confirm audio is coming through?"*

> *"Seems like there might be a small connection issue on my end — can you still hear me okay?"*

Stay calm. Technical issues happen. Your response to them is itself a signal.

---

### If the interviewer skips intro and jumps straight to the problem

Match their energy. Don't try to force a social exchange. Just say:

> *"Sure, happy to jump right in — let me take a moment to read through the problem."*

Adaptability is itself evaluated.

---

## PHASE 2 RESCUES — Problem Reception & Clarification

### If the problem seems very long and complex

> *"This is quite detailed — let me take a moment to read through it carefully and will ask follow-up questions as I go."*

Read slowly. It is completely fine to take 60–90 seconds reading in silence before speaking.

---

### If you are confused by the problem statement

Do NOT say "I don't understand." Say:

> *"I want to make sure I parse this correctly before I ask questions — let me think through what I'm seeing here..."*

Then restate what you DO understand and say where it becomes unclear:

> *"I follow the setup — N routers, connections with distances. What I'm less clear on is... [specific part]. Could you clarify that?"*

This sounds thoughtful, not lost.

---

### If you ask a question and the answer surprises you / changes your thinking

> *"Oh, that changes things — let me update my understanding. So we're actually [corrected understanding]. That makes sense."*

Never pretend you understood something you didn't. Asking again is fine:

> *"Just to confirm I have this right — you're saying [restate it]?"*

---

### If you realize mid-clarification that you need to ask more questions than planned

> *"There's one more thing I want to confirm before I start — [ask it]."*

You can ask up to 5 well-chosen clarifying questions without it being awkward. Just be organized and don't repeat questions.

---

### Safe list of clarifying questions you can always ask (even on familiar problems)

```
1. "What's the scale — how large can N be?"
2. "Can values be negative or zero?"
3. "Can the input be empty?"
4. "Can there be duplicates?"
5. "What should I return if no answer exists — negative one, null, or an empty list?"
6. "Is there a time complexity target I should be designing toward?"
7. "Can I modify the input in place, or should I leave it unchanged?"
8. "Can I use built-in library functions?"
```

---

## PHASE 3 RESCUES — Approach Discussion

### If you have NO idea where to start

**The 4-Step Recovery Script** (use in order):

**Step 1** — Narrate what you DO know:
> *"Let me start with what I can observe about this problem. The input is [X]. We need to produce [Y]. The constraint is [Z]..."*

**Step 2** — State brute force:
> *"The simplest approach would be to try every possible [X] — that would be O of en squared, probably too slow, but let me use it as a baseline..."*

**Step 3** — Enumerate patterns out loud:
> *"Given the constraints... N equals ten to the fifth suggests we need O of en log en or better. The input structure makes me think of [hash map / BFS / binary search / two pointers]... Let me think about which fits..."*

**Step 4** — Ask an indirect hint question (without directly asking for the answer):
> *"Is there a property of the input I should be leveraging that I might be overlooking?"*

> *"I have a general direction in mind, but I want to make sure I'm not missing something obvious — does the input have any special structure I should exploit?"*

If still stuck after this, it is completely acceptable to ask directly:
> *"I'm a bit stuck here — could you give me a small nudge in the right direction?"*

Asking for a hint after showing genuine effort is not weakness. It is collaboration. Interviewers give hints intentionally.

---

### If you are unsure between two approaches

> *"I see two options here and I'm trying to decide between them. Option A is [X] — O of [complexity], but [tradeoff]. Option B is [Y] — O of [complexity], but [tradeoff]. For the given constraints, I'd lean toward [one] because [reason] — does that make sense to you?"*

Thinking through tradeoffs out loud is exactly what they want to see.

---

### If you describe an approach and realize it's wrong

> *"Actually — wait. I'm seeing a problem with this. If [edge case], my approach would [fail]. Let me reconsider..."*

Then pivot. Announce the new direction:

> *"Let me back up. Instead of [wrong approach], I think [better approach] handles this more correctly because [reason]."*

This is NOT a failure. Finding a flaw in your own approach before coding it is a major positive signal.

---

### If the interviewer seems unresponsive or poker-faced while you explain

Do not try to read their face. Force an interaction:

> *"I'm about to commit to this approach — any concerns with this direction before I start coding?"*

> *"Does this tradeoff seem reasonable to you, or is there a better angle you'd suggest?"*

Silence from them does NOT mean you are wrong. They are trained not to give reactions. Keep going.

---

## PHASE 4 RESCUES — Coding

### If you go blank mid-code and don't know what to write next

Stop. Say:

> *"Give me just a second — I want to think through the next step carefully before I write it."*

Then reason out loud:

> *"I've processed the node... now I need to update neighbors... the condition is if the new distance is less than the currently known distance..."*

Writing what you KNOW you need even as English comments keeps the conversation alive:

```python
# TODO: relax neighbors here
# TODO: update dist if new_dist < dist[neighbor]
```

Then fill in the code.

---

### If you realize your approach is fundamentally wrong mid-code

**Do NOT just silently rewrite everything.** Say:

> *"I'm realizing there's a fundamental issue with this approach — I'm not handling the case where [problem]. Let me stop here."*

Take a breath. Then:

> *"Do you want me to patch this specific issue, or should I reconsider the approach from the beginning?"*

Take the interviewer's guidance. If they say "reconsider," then say:

> *"Okay — so the issue is [X]. If I instead approach it as [Y], that would handle [X] because [reason]. Does that direction make more sense?"*

---

### If you have a small bug and catch it yourself

Say it out loud calmly:

> *"Hold on — I see an off-by-one here on line [X]. Let me fix that."*

> *"Wait — this fails if the list is empty because [reason]. Let me add a guard at the top."*

Then fix it quietly and continue. No apology needed. No drama. Finding your own bug is the correct behavior.

---

### If you are going too slowly and running out of time

At around minute 30–32, do a quick self-check. If you're not done with the main logic, announce it:

> *"I want to make sure I finish the key logic — I'll prioritize the core algorithm and can describe the remaining edge case handling verbally if needed."*

Write the critical code path completely. For things you can't finish, use stubs:

```python
# TODO: handle edge case where graph is disconnected
# → would return -1 / float('inf') here
```

Then say what the stub would do:

> *"This stub would handle the case where the destination is unreachable — I'd return -1."*

Explaining what you would write is always better than having incomplete or broken code.

---

### If you need to look up syntax (even in a real interview)

It's fine to say:

> *"I know the pattern but I'm blanking on the exact syntax for heapq — I know it's heapq.heappush with a tuple, let me just write it and note the method name."*

Then write what you remember. Don't freeze. Keep going.

---

## PHASE 5 RESCUES — Testing & Complexity

### If the interviewer finds a bug before you do

Never get defensive. Never say "no, it's correct." Say:

> *"Good catch — let me trace through why that's failing..."*

Then actually trace it in the doc:

> *"So if the input is [X]... at this point the variable is [Y]... ah, I see — [root cause]. Let me fix that."*

The correct response sequence is: acknowledge → trace → understand → fix → continue.

**What NOT to say:**
- "I think it's actually fine..." → argumentation
- "Sorry, sorry, I'm so sorry..." → excessive apology
- Silent panic, deleting everything → do not restart from scratch

---

### If you can't figure out the complexity on the spot

Don't guess a wrong number. Reason out loud:

> *"Let me think through this carefully. The outer loop runs N times. For each iteration, the heap operation is O of log N. So the outer loop with heap operations is O of N log N. The rest is O of N. So overall O of N log N. Does that sound right to you?"*

Deriving complexity out loud — even slowly — scores much better than confidently stating a wrong answer.

---

### If you realize your approach has a completely wrong complexity

> *"I've been saying O of en log en, but actually — let me rethink. The inner loop here can also run N times in the worst case, which would make it O of en squared. I need to fix that."*

Being self-correcting is a positive signal. Claiming wrong complexity without correcting is a major negative one.

---

### If you can't think of all 5 edge cases in the moment

Start with the ones you know and name them:

> *"Let me check: empty input — [trace]. Single element — [trace]. And let me also think about what happens with all duplicates..."*

Even naming 3 edge cases and testing them is better than testing only the happy path. The effort and process matter.

---

## PHASE 6 RESCUES — Follow-ups & Closing

### If you get a follow-up question you have no idea how to answer

Never say "I don't know" and stop. Always engage:

> *"Interesting — let me think about that for a moment..."*

Then reason out loud, even if you're not sure:

> *"If the data doesn't fit in memory, the in-memory approach I described would break. I'd probably think about [streaming / external sort / partitioning]. The key question would be: what's the read/write pattern? That would determine whether we need [X] or [Y]..."*

Partial credit for a correct direction is always available. Full shutdown is not recoverable.

---

### If you run out of time mid-follow-up

Stop coding. Give a verbal roadmap:

> *"I wouldn't have time to implement the full [Trie / Segment Tree / etc.] here, but the logic would be: [describe step 1], then [step 2], and the return condition would be [step 3]. The overall complexity would be [X]."*

State it explicitly and confidently. A clear verbal roadmap earns partial credit.

---

### If the interviewer says "I've got enough signal — let's move on"

**Do NOT interpret this as negative.** It often means they are satisfied and want to move to complexity discussion or a follow-up.

> *"Sure — happy to discuss time and space complexity, or we can move to a follow-up."*

Respond smoothly, without asking "did I do okay?" or "was that good?" — seeking reassurance after this phrase reads as insecurity.

---

### If you finish very early with time remaining

Proactively go deeper. Do not just sit there:

> *"How would this change if the input were a stream and didn't fit in memory?"*

> *"How would we make this thread-safe for concurrent writes?"*

> *"How would we test this? What unit tests would we write?"*

> *"Can we optimize space to O of one? I'd have to modify in place..."*

This signals the mindset of a higher-level engineer and is explicitly mentioned as a "Strong Hire" behavior.

---

## Universal Recovery Phrases — Quick Reference

Memorize these. They work in ANY phase when you're stuck or uncertain:

### To buy time:
- *"Let me think through this for a moment..."*
- *"Give me just a second to trace this mentally..."*
- *"I want to make sure I approach this correctly..."*
- *"One moment — I'm working through the logic..."*

### To reframe confusion:
- *"Let me restate what I understand so far — [X]. What I'm less clear on is [Y]."*
- *"Let me think out loud here so you can follow my reasoning..."*
- *"I'm considering [X] but I'm not sure it handles [Y] correctly..."*

### To ask for a hint diplomatically:
- *"Is there a property of the input I should be leveraging that I might be overlooking?"*
- *"I have a general direction, but I want to make sure I'm not missing something — any guidance?"*
- *"I'm a bit stuck here — could you give me a small nudge in the right direction?"*

### When receiving a hint:
- *"Oh, that's a great observation — so you're suggesting I look at [X]? Let me think about how that would work..."*
- *"That's a great point — incorporating that now..."*
- *"I see — so the key insight is [restate]. Let me adjust the approach accordingly."*

### When you catch your own mistake:
- *"Hold on — I see an off-by-one here. Let me fix that."*
- *"Wait — this would fail for [edge case]. Let me add a guard here."*
- *"Actually, I'm realizing [issue]. Let me back up and fix this."*

### When interviewer catches your mistake:
- *"Good catch — let me trace through why that's failing..."*
- *"That's a great point — I see the issue now. Let me fix that."*
- *"You're right — I missed [X]. Let me correct that."*

### When pivoting approach:
- *"I'm realizing this approach has a problem — I'm not handling [case]. Let me reconsider."*
- *"Let me back up — I think [new approach] is more correct because [reason]."*
- *"I want to change direction here — do you want me to restart with [X] or patch the specific issue?"*

### When running out of time:
- *"I'm running a bit short on time — let me prioritize finishing the core logic."*
- *"I'll use a stub here and describe what it would do."*
- *"I wouldn't have time to implement this fully, but the logic would be [describe]."*

---

## The "Going Blank" Emergency Protocol

If your mind goes completely blank and you cannot think of anything:

**Step 1 (immediate):** Say something to keep the conversation alive:
> *"Give me just a moment — I want to think through this carefully."*

**Step 2 (within 10 seconds):** Narrate the problem back:
> *"So we have [input]. We need [output]. The constraints are [constraints]..."*

**Step 3 (within 20 seconds):** State brute force, even if it's obvious:
> *"The simplest thing I can think of is [brute force] — that's O of en squared..."*

**Step 4 (within 30 seconds):** Enumerate patterns:
> *"Given N equals ten to the fifth, we need O of en log en or better... The input structure makes me think of [hash map / sorted order / graph]..."*

**Step 5 (if still blank):** Ask a targeted question:
> *"Is there a specific property of the input I should be paying attention to?"*

Following these 5 steps, in order, will rescue you from almost any blank moment. You will never be truly "out of things to say."

---

*References: interview-flow-summarized.md (Decision Trees section, all phase "Alternate scenario" sections), notes-summarized.md (Sections 11 and 12), Mock Interview - 45m - Sonnet4.6.md (Alex's responses to the follow-up challenge and interviewer's clarification)*
