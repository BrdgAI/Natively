Our goal is to fit more content into limited available space. 
We don’t want to clutter the UI with various boxes and sections to confuse the users from where to read.
Primary screen environment will be - A chrome browser (consider top tab bar/url bar), a google doc (light theme) instance where the question will be pasted, and coding will happen, a floating google meet camera view, which I would plan to keep in bottom left or top left. Main goal should be to design a transparent overlay, which let us clearly see and read from the primary screen beneath, at the same time, cleanly readable text on the hidden overlay to read from.
Total sections – 
Main section, which would have all the major content streamed. It should be kept in the center. Add a small pinned subsection in the main, which will serve active instant answers to the question without harming the flow. 
Code section, either top right or button right, should fit the entire code without need to scroll. A second code section, next right to this one, which will help during the dry run or follow up code modification, we will highlight the new diff code here in the second copy
A top phase flow, where it lists all the phases, and the current phase it highlight 
When a user triggers Next, then it should have a small indicator on which sections were updated, or if no update is found with this request, to let user stay stress free that they’re not getting the response, maybe because system is dead. Should be around the camera and easily accessible 
A bottom box which tracks what it got from the text from the screenshot from the last screenshot
Any other extremely helpful feature that you could think of
We don’t want to waste space here with any information which will not help, or will create distraction or hard to read by going through entire screen

Space around the camera (top center) is precious, as we want to try our eyes around there. So make sure we’re starting our main content from it after some margins of menu bar/task bar
Our mouse clicks will be disabled, so no need to keep any buttons that we will not be able to click. 
The current overlay background is making it hard to see the beneath, so change it dim it a bit, maybe go slightly on a darker side, please take a deep brainstorm on choosing that background layer, considering the main light theme google doc as primary screen, and black coding text in it. 
The current font is also unreadable in the best way, please change them to a better one, make them bold. 
In the main section, add numbered lines for different lines, you may use two colors on alternate lines to make it easier to track it. 
Keep borders etc thin, and don’t waste space for them.

Main flow architecture 
We need to make each feature around the fact that USER WILL ONLY TRIGGER ‘NEXT’ ONLY WHEN THEY NEED THE UPDATED NEW INFORMATION BASED ON THE NEW CONTEXT. While the majority of time there will be need to deliver the new information, if not, we will add that in top UI that no changes. 
WE WANT TO MINIMIZE THE NUMBER OF ‘NEXT’ click from the user, so we will try to load all the information in the sections when requested, and replace specific points when they need to be changed based on the updated context. 
WE WILL TRY TO DELIVER THE MAJORITY OF THE CONTENT IN THE MAIN SECTION, AND APPEND NEW INFORMATION/ REPLACE WITH THE UNWANTED ONE, AS USER CAN SCROLL 
We will store the main screen of each phase, and start a new phase with their own section so the user can swift through the sections without needing to scroll for old section’s need.


Phase - 2 | Clarify  
Mainly use the main section to load all the questions, format of the information that the user will write can stay into permanent subsection. 
Upon each of the users’ NEXT, change the future/next/content of the main/sub section with respect to dynamic requirements changes if needed.
PLEASE BRAINSTORM PLAN A BETTER APPROACH HERE, HOW DO WE HANDLE THE SITUATION HERE. SCENARIO -  We gave a list of 8 questions, and the user asked 3 of them, based on the reply, if we might have to change any of the future questions, then how can we handle removing the existing unwanted question with the new one. 
When you provide the prompt files, be make sure to ask highly relevant questions which we’re missing to get the answer, not just random question we’re asking in sake for 
Handle the storing the answer of this section for the next sections. 
Phase - 3 | approach 
Similar to the phase 2, load everything into the main  section in one shot, change as per the trigger and needs. 
P4_code
Directly load the entire code in the code section, including the comments that mention the blueprint, so I can write similar minimal comments before writing entire function 
Make sure this section doesn’t have any unwanted spacing/padding, and sufficient width and length to write one line at a time without breaking them, to easily see the indents 
Write the entire comments that I need to say in the main section, easily mentioning each major section again there to know when can I say that line
If any new changes comes midway, and we just need to make changes in the existing code, then just do code diff rather than new code, highlight new lines, with old lines properly 


P5_test
Directly write the dry run in the main section, if needed, highlight which function to refer for each dry run,
If already delivered the dry run, then user given another variable, then simply give new dry run or replace, WHICHEVER PREFERRED 

P6_FOLLOW_UP
If changes in code, show the new code in the second code section, highlight the new lines.
All main information in main section, 
