Interview mode

- Interview overlay   
  - **Top Strip**   
  - **Main center**  
  - **Code panel**   
  - **Side notes rail**   
    - **what to think**  
    - **what is pinned**  
    - **what quick interruption to keep ready**  
  - **Temp \- Control strip**   
- State models  
- Phase routing   
  - p2\_clarify  
  - p3\_approach  
  - p4\_code  
  - p5\_test  
  - P6\_close  
- Phase-specific generators  
  - clarification generator  
  - approach generator  
  - coding generator  
  - testing generator  
  - closing generator  
- Next \[Cmd+Enter\]  
  - serve prefetched content when available  
  - generate if no valid buffer exists  
  - expand the already visible script if nothing materially changed  
- Sync \[Cmd+Shift+Enter\]  
  - capture screenshot  
  - run interview-specific extraction  
  - refresh interview memory  
  - show a short-lived control strip  
  - if pressed again during that control-strip window, cycle the target phase  
- Interview vision and diff support  
  - pasted problem statements  
  - visible code  
  - requirement changes  
  - dry run inputs  
  - likely mistakes  
- Interview shortcut system  
  - Cmd+Shift+Left \-\> phase previous  
  - Cmd+Shift+Right \-\> phase next  
  - Cmd+Shift+Up \-\> main scroll up  
  - Cmd+Shift+Down \-\> main scroll down  
  - kill switch is bindable but has no default accelerator  
  - **phase previous/next are disabled by default**  
  - **interview scroll shortcuts are enabled by default**  
  - **kill switch exists in settings and UI, but is not hard-bound by default**

**—------ Changes —--------**

1. **Repurpose Step 7 with just 'Follow-ups'**  
   1. We don’t need any help with our question, thanks, etc.   
   2. Asking the question if needed   
   3. Just cover all the follow up relevant criterias here, like change in the code, instant answer based on the initial question context 

2. **Phase instructions managements**   
   1. Create an index-interview.md file where the new flow structure is mentioned.   
   2. Point and highlight each file where the phase specific instructions are listed, so that I can directly make the manual changes as per my output needs.   
   3. Create a global instructions file, that could be applied to each of the outputs from a single place, in which, I can just modify some major instructions from one place

3. **UI correction**   
   1. Use Docs-TEMP/Uncodixfy.md for UI reference   
   2. Our goal is to fit more content into limited available space.   
   3. We don’t want to clutter the UI with various boxes and sections to confuse the users from where to read.  
   4. Primary screen environment will be \- A chrome browser (consider top tab bar/url bar), a google doc (light theme) instance where the question will be pasted, and coding will happen, a floating google meet camera view, which I would plan to keep in bottom left or top left   
   5. Total sections –   
      1. Main section, which would have all the major content streamed. It should be kept in the center. Add a small fix subsection in the main, which we doesn’t want to keep hidden by active scroll  
      2. Code section, either top right or button right, should fit the entire code without need to scroll.  
      3. A box for dynamic quick answers, when we don’t want to add them into our main section, and want to store them in one place. This box is helpful when we’re yet to go through our main section, and get asked a question for which we need an answer, and at the same time, want to continue on to the main section after answering.  
      4. A top phase flow, where it lists all the phases, and the current phase it highlight   
      5. When user triggers Next, then it should have a small indicator on which sections were updated, or if no update found, to let user stay stress free that they’re not getting the response maybe because system is dead   
      6. A bottom box which tracks what it got from the text from the screenshot.   
      7. Any other extremely helpful feature that you could think of  
      8. We don’t want to waste space here with any information which will not help, or will create distraction or hard to read by going through entire screen  
           
   6. Space around the camera (top center) is precious, as we want to try our eyes around there. So make sure we’re starting our   
   7. Our mouse clicks will be disabled, so no need to keep any buttons that we will not be able to click.   
   8. The current overlay background is making it hard to see the beneath, so change it dim it a bit, maybe go slightly on a darker side, please take a deep brainstorm on choosing that background layer, considering the main light theme google doc as primary screen, and black coding text in it.   
   9. The current font is also unreadable in the best way, please change them to a better one, make them bold.   
   10. In the main section, add numbered lines for different lines, you may use two colors on alternate lines to make it easier to track it.   
   11. Keep borders etc thin, and don’t waste space for them.

4. **Main** **flow architecture**   
   1. We need to make each feature around the fact that USER WILL ONLY TRIGGER ‘NEXT’ ONLY WHEN THEY NEED THE UPDATED NEW INFORMATION BASED ON THE NEW CONTEXT. While the majority of time there will be need to deliver the new information, if not, we will add that in top UI that no changes.   
   2. WE WANT TO MINIMIZE THE NUMBER OF ‘NEXT’ click from the user, so we will try to load all the information in the sections when requested, and replace specific points when they need to be changed based on the updated context.   
   3. WE WILL TRY TO DELIVER THE MAJORITY OF THE CONTENT IN THE MAIN SECTION, AND APPEND NEW INFORMATION/ REPLACE WITH THE UNWANTED ONE, AS USER CAN SCROLL   
   4. We will store the main screen of each phase, and start a new phase with their own section so the user can swift through the sections without needing to scroll for old section’s need.  
   5.   
5. **Phase \- 2 | Clarify**    
   1. Mainly use the main section to load all the questions, format of the information that the user will write can stay into permanent subsection.   
   2. Upon each of the users’ NEXT, change the future/next/content of the main/sub section with respect to dynamic requirements changes if needed.  
   3. PLEASE BRAINSTORM PLAN A BETTER APPROACH HERE, HOW DO WE HANDLE THE SITUATION HERE. SCENARIO \-  We gave a list of 8 questions, and the user asked 3 of them, based on the reply, if we might have to change any of the future questions, then how can we handle removing the existing unwanted question with the new one.   
   4. When you provide the prompt files, be make sure to ask highly relevant questions which we’re missing to get the answer, not just random question we’re asking in sake for   
   5. Handle the storing the answer of this section for the next sections.   
6. **Phase \- 3 | approach**   
   1. Similar to the phase 2, load everything into the main  section in one shot, change as per the trigger and needs.   
7. **P4\_code**  
   1. Directly load the entire code in the code section, including the comments that mention the blueprint, so I can write similar minimal comments before writing entire function   
   2. Make sure this section doesn’t have any unwanted spacing/padding, and sufficient width and length to write one line at a time without breaking them, to easily see the indents   
   3. Write the entire comments that I need to say in the main section, easily mentioning each major section again there to know when can I say that line  
   4. If any new changes comes midway, and we just need to make changes in the existing code, then just do code diff rather than new code, highlight new lines, with old lines properly   
   5.   
8. P5\_test  
   1. Directly write the dry run in the main section, if needed, highlight which function to refer for each dry run,  
   2. If already delivered the dry run, then user given another variable, then simply give new dry run or replace, WHICHEVER PREFERRED 

9. P6\_FOLLOW\_UP  
   1. If changes in code, run code diff  
   2. All main information in main section, 

