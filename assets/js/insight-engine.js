function pick(arr){ 
  return arr[Math.floor(Math.random()*arr.length)]; 
}

// ---- Memory Keys ----
const USED_KEY = "uniqueAstraInsights_v5";
const NAME_KEY = "cachedUsername";

let usedInsights = JSON.parse(localStorage.getItem(USED_KEY) || "[]");

// ---- Username helper ----
function getUserName(){
  return localStorage.getItem(NAME_KEY) || "there";
}

export function cacheUsername(name){
  if(name) localStorage.setItem(NAME_KEY, name);
}

// ---- Extended Natural Openers (37 total) ----
const NATURAL_OPENERS = [
  "Hey",
  "Hi",
  "Alright",
  "So",
  "Listen",
  "Okay look",
  "Right then",
  "Hmm",
  "Well",
  "Here's the thing",
  "Quick heads up",
  "Just a note",
  "Heads up",
  "Small update",
  "Real talk",
  "Between us",
  "Honestly",
  "Straight up",
  "No pressure but",
  "Friendly nudge",
  "Quick word",
  "For what it's worth",
  "Not gonna lie",
  "Fair warning",
  "Quick check-in",
  // ---- 12 NEW OPENERS ----
  "I've been watching",
  "Something caught my eye",
  "Let me be direct",
  "Taking a step back",
  "From where I stand",
  "Here's what I'm seeing",
  "Wanted to flag this",
  "Let's be real for a second",
  "Putting it out there",
  "Observing your pattern",
  "This stood out to me",
  "Candidly speaking"
];

// ---- Contextual Greetings (Extended) ----
function contextualGreeting(){
  const hour = new Date().getHours();
  const name = getUserName();
  
  // Early morning (5-8)
  if (hour >= 5 && hour < 8) {
    return pick([
      `Up early, ${name}? Respect for beating the sun.`,
      `Morning grind starts now, ${name}. Most people are still asleep.`,
      `${name}, you're ahead of most people already. Use this quiet.`,
      `Early bird mode detected, ${name}. The morning hours are yours.`,
      `Sun's barely up and you're here, ${name}. That discipline shows.`
    ]);
  }
  
  // Morning (8-12)
  if (hour < 12) {
    return pick([
      `Good morning, ${name}. Let's get moving while energy is fresh.`,
      `Fresh start today, ${name}. Yesterday is irrelevant now.`,
      `Morning focus suits you, ${name}. The day is still unwritten.`,
      `New day, new material, ${name}. Build something solid before noon.`,
      `${name}, mornings are when toppers separate themselves. You're in that group.`
    ]);
  }
  
  // Lunch/Afternoon (12-15)
  if (hour < 15) {
    return pick([
      `Afternoon push, ${name}. Don't let the post-lunch dip catch you.`,
      `Lunch break over? Back at it, ${name}. Consistency beats intensity.`,
      `Midday momentum, ${name}. Keep the rhythm steady and strong.`,
      `Keeping the rhythm, ${name}. Afternoon sessions build real endurance.`,
      `${name}, afternoon sessions separate serious students from casual ones.`
    ]);
  }
  
  // Late afternoon (15-18)
  if (hour < 18) {
    return pick([
      `Almost evening, ${name}. Stay with it through the final stretch.`,
      `Late afternoon grind, ${name}. Push through the energy slump.`,
      `Push through the slump, ${name}. This is where discipline proves itself.`,
      `${name}, this is where discipline shows. Most people quit around now.`,
      `Final stretch of the day, ${name}. Finish stronger than you started.`
    ]);
  }
  
  // Evening (18-22)
  if (hour < 22) {
    return pick([
      `Evening focus mode, ${name}. The distractions are fading away.`,
      `Night owl hours, ${name}. There's something special about evening study.`,
      `Quiet time for deep work, ${name}. The world is getting still.`,
      `${name}, evening clarity hits different. Thoughts settle and focus sharpens.`,
      `Dim the lights, lock in, ${name}. The night belongs to those who use it.`
    ]);
  }
  
  // Late night (22-5)
  return pick([
    `Late night again, ${name}? Dedication like this doesn't go unnoticed.`,
    `${name}, burning the midnight oil. Some concepts only make sense at this hour.`,
    `When others sleep, you study, ${name}. That sacrifice has a price and a reward.`,
    `Night sessions have their own magic, ${name}. Silence helps difficult ideas land.`,
    `2 AM clarity, ${name}? I get it. Sometimes the brain only cooperates when it's tired.`
  ]);
}

// ---- Extended Accuracy Commentary (Longer Sentences) ----
function accuracyObservation(percent){
  // Elite tier (90+)
  if (percent >= 90) {
    return pick([
      `Your ${percent}% is honestly impressive in a way that makes me pause. You're operating at a level most students never reach, and the consistency behind that number matters more than the number itself.`,
      `That ${percent}% isn't luck or coincidence. It's the result of precision becoming habit, and habits like that are what separate toppers from the rest when exam pressure hits.`,
      `${percent}% accuracy means your concepts aren't just understood, they're mastered. When you see a question, you don't guess, you know. That's a massive advantage in competitive exams.`,
      `You're in the top tier with ${percent}%, but what strikes me is how sustainable this looks. You're not burning out to hit these numbers, which means you can maintain them.`,
      `${percent}%? That's the kind of accuracy that makes examiners smile when they grade your paper. Clean, confident, correct. Keep this standard and ranks will follow.`
    ]);
  }
  
  // Strong tier (85-89)
  if (percent >= 85) {
    return pick([
      `Strong ${percent}%. You're in safe territory but I can see the gaps where polish would push you into elite territory. The foundation is rock solid, now it's about eliminating those last few errors.`,
      `${percent}% is competitive without being dominant. You're in the conversation for top ranks but not controlling it yet. Push for 90+ and the conversation changes.`,
      `Solid ground at ${percent}%. The mistakes you're making aren't conceptual, they're attention slips. Fixable with focus, but dangerous if ignored in exam conditions.`,
      `Your ${percent}% reflects good control under pressure. That's valuable. But good isn't the goal here, and you have room to be great with some targeted refinement.`,
      `${percent}% accuracy keeps you in the race without putting you ahead of it. Maintain this while finding those extra five points, and your position changes entirely.`
    ]);
  }
  
  // Good tier (75-84)
  if (percent >= 75) {
    return pick([
      `${percent}% is decent but inconsistent in a way that worries me slightly. Some answers show brilliance, others show haste. The gap between your best and worst attempts is too wide.`,
      `You're managing ${percent}% reliably, which is better than failing but not good enough for what you're capable of. There's more in you, and the data suggests you know it.`,
      `${percent}% shows understanding that hasn't fully converted to execution. You know the concepts, but under pressure, they're not coming out cleanly. Practice needs to be more exam-like.`,
      `Stable at ${percent}%. The foundation exists, which means building higher is possible. But possible and happening are different things, and the clock is moving.`,
      `Your ${percent}% is middle-ground in the most dangerous way. Not bad enough to trigger emergency response, not good enough to guarantee success. This is where motivation dies quietly.`
    ]);
  }
  
  // Borderline tier (70-74)
  if (percent >= 70) {
    return pick([
      `${percent}% is the danger zone disguised as safety. One bad day, one difficult paper, one section you skipped, and suddenly you're below the line. That's too tight a margin.`,
      `You're hovering at ${percent}%. In competitive exams, this is where the cut happens. You're on the right side of it today, but trends matter more than snapshots.`,
      `Borderline ${percent}%. This is where you fight for every mark or accept being filtered out. The choice is present every session, even if it doesn't feel urgent.`,
      `Your ${percent}% is a warning dressed as okay. It looks acceptable on paper until you realize how many students are clustered here, and how few seats exist above this line.`,
      `At ${percent}%, you're surviving but not thriving. The effort is there, the results are almost there, but almost is a painful place to sit when results come out.`
    ]);
  }
  
  // Struggling tier (60-69)
  if (percent >= 60) {
    return pick([
      `${percent}% means concepts are half-understood, half-remembered, and half-executed. That's too many halves. You need to return to source material and rebuild without ego.`,
      `You're at ${percent}%. Wrong answers are teaching you nothing because you're moving too fast to learn from them. Slow down. Quality over quantity becomes real here.`,
      `${percent}% suggests rushed reading or weak recall or both. The brain is taking shortcuts that feel efficient but create disasters in exam conditions.`,
      `This ${percent}% needs intervention, not encouragement. Nice words won't fix conceptual gaps. Honest assessment and fundamental review will.`,
      `Your ${percent}% is recoverable but recovery requires admitting the foundation is cracked. That's hard to do, but harder to ignore as exams approach.`
    ]);
  }
  
  // Weak tier (55-59)
  if (percent >= 55) {
    return pick([
      `${percent}% is risky territory where hope replaces strategy. Exam day pressure makes this worse, not better, because pressure reveals gaps rather than filling them.`,
      `You're scoring ${percent}%. That's failing in disguise, and the disguise is running out of time. Every session that ends at this number is a session that didn't move you forward.`,
      `${percent}% indicates fundamental gaps in understanding, not memory or speed. You can't patch this with tricks. You need to learn it properly, which takes time you may not have.`,
      `Critical ${percent}%. Every wrong answer is a lesson you're not learning because you're too busy moving to the next question. Stop. Review. Understand. Then proceed.`,
      `Your ${percent}% demands honesty about preparation quality. Not effort, not intention, but actual quality. Be brutal with this assessment, because the exam will be.`
    ]);
  }
  
  // Critical tier (45-54)
  if (percent >= 45) {
    return pick([
      `${percent}% is an emergency that doesn't feel like one because you're still showing up. But showing up isn't progress if the learning isn't sticking. Stop and rebuild.`,
      `You're at ${percent}%. This isn't working, and continuing the same way won't make it work. The approach is broken. The material isn't the problem, the method is.`,
      `${percent}% means the gap between where you are and where you need to be is widening, not closing. Urgent, fundamental change is required, not incremental adjustment.`,
      `Alarming ${percent}%. Foundation isn't missing, it's absent. You need to start over with basics, which is humbling but necessary. Pride at this stage is expensive.`,
      `Your ${percent}% requires a complete reset. No shame in that, but there is shame in pretending this is fine. Face it, fix it, or fail. Those are the options.`
    ]);
  }
  
  // Crisis tier (<45)
  return pick([
    `${percent}%? We need to have a serious conversation about whether this attempt is genuine or performative. Because genuine effort produces better than this, which means something is broken in the approach.`,
    `You're at ${percent}%. This is salvageable only if you treat it as a crisis, which it is. Not a crisis of ability, but of method, focus, or honesty about what you're actually doing in these sessions.`,
    `${percent}% isn't failure yet, but it's the last exit before failure. Take it. Change everything. What you've been doing hasn't worked, and more of it won't work either.`,
    `Critical situation at ${percent}%. Every session from now until the exam needs to be completely different from the sessions that produced this number. Total transformation required.`,
    `Your ${percent}% needs emergency attention, and I'm not using that word lightly. This is not about working harder, it's about working completely differently, starting today.`
  ]);
}

// ---- Extended Trend Commentary ----
function trendCommentary(direction){
  const map = {
    Improving: [
      "Your curve is climbing in a way that suggests real learning, not just lucky guesses. Whatever you changed recently, it's working, and you should understand what that change was so you can protect it.",
      "Upward momentum detected across multiple sessions now. You're not just having good days, you're having better days consistently, which means skill is actually building.",
      "Progress is visible and measurable from the data I'm seeing. The last few sessions prove that your effort is converting to results, which is the whole point of this exercise.",
      "You're trending better, and trends matter more than individual scores. A single high mark could be luck, but a rising pattern is skill, and you've got the pattern.",
      "Positive slope confirmed and sustained. Keep this trajectory and the exam becomes a confirmation of what you already know rather than a test of what you hope you know.",
      "Improvement is real and documented, not imagined. Don't break the pattern now by getting overconfident or changing methods. Consistency is what got you here.",
      "You're getting sharper session by session. The data doesn't lie about this, and neither do the questions you're getting right that you used to miss.",
      "Better than before, and that's all that matters right now. Not perfect, not final, just moving in the right direction with purpose and evidence.",
      "Upswing in progress, visible across time. Trust this process because it's producing results, even on days when it doesn't feel like it.",
      "You're on an upward path that could take you to competitive territory. Stay consistent, don't celebrate early, and keep the habits that created this climb."
    ],
    Stable: [
      "You're holding steady at a consistent level, which is comfortable but not growth. Safety is nice, but exams don't reward safety, they reward excellence.",
      "Flat line detected across recent sessions. Neither rising nor falling means you're not learning, just repeating. That's maintenance, not preparation.",
      "Consistency is good when the level is high. Stagnation is dangerous when the level is mid. You need to decide which side of that line you're on.",
      "You're maintaining, which takes effort, but maintenance doesn't win competitions. Time to challenge yourself with harder material or stricter conditions.",
      "Stable output that doesn't excite or worry me. That's the problem. You should be aiming to excite yourself with progress, not comfort yourself with safety.",
      "No major dips, which is positive, but no major jumps either, which is limiting. Safe harbor is for ships that aren't sailing anywhere.",
      "Holding ground without gaining it. Good defense is necessary but insufficient. You need to start playing offense against the material.",
      "You're predictable in a way that suggests control but not growth. Reliable is good, remarkable is better, and exams reward the remarkable.",
      "Steady state that needs breaking. Comfort with current performance is the enemy of breakthrough performance. Disrupt yourself before the exam does.",
      "Maintenance mode activated for too long. Switch to growth mode or accept that this is your ceiling, because the exam won't let you hide there."
    ],
    "Needs Focus": [
      "Slippage detected in recent sessions that isn't dramatic yet but is consistent. Attention wandered, and the scores followed. Catch this before it becomes a fall.",
      "Small decline visible if you look at the pattern rather than individual scores. Early intervention matters here, before the dip becomes a drop.",
      "Focus is leaking in ways that show up in silly mistakes and missed easy questions. Tighten up immediately, because these are expensive errors.",
      "You're drifting from the standards you set earlier. Anchor yourself back to basics, to fundamentals, to the discipline that produced better numbers.",
      "Downward pressure building that you might not feel yet because absolute scores still look okay. But direction matters more than position, and direction is wrong.",
      "Recent sessions show cracks in concentration that weren't there before. Address them now with rest or discipline, before they widen into gaps.",
      "Concentration thinning across time, visible in the error patterns. Deep work required, not more work. Quality of attention is the issue.",
      "You're slipping from your own standard, not from some external ideal. Not crashed yet, but sliding in a way that accelerates if ignored.",
      "Warning signs present in the trend line. Heed them early while they're still easy to fix, because later they'll require emergency measures.",
      "Minor regression that feels like a bad day but is actually a pattern. Fix the pattern, not the day. The day is a symptom, the pattern is the disease."
    ],
    Critical: [
      "This is a red flag situation that requires immediate and total attention. Not tomorrow, not after this chapter, now. Everything else pauses for this.",
      "Steep decline detected across multiple consecutive sessions. Damage control mode isn't optional anymore, it's mandatory. Stop the bleeding first, then heal.",
      "You're in freefall from a height you used to occupy. Stop and rebuild foundation before you hit bottom, because the ground is coming up fast.",
      "Critical deterioration that can't be explained by bad luck or hard questions. Something fundamental has shifted, and you need to find it immediately.",
      "Emergency status declared based on trajectory, not emotion. Current approach is failing visibly and consistently. Radical honesty and radical change required.",
      "Serious warning that this trajectory ends in exam failure, not just disappointment. The time for gentle adjustments is past. Surgery, not bandages.",
      "Collapse imminent based on trend extrapolation. Parachute needed now, not later. Emergency measures are justified because emergency conditions exist.",
      "You're crashing in slow motion, which feels safe until the final impact. Pause, breathe, restart smarter. Continuing this way is not an option.",
      "Critical condition that demands everything you have. Not panic, but close attention and total commitment to reversing direction immediately.",
      "This needs urgent care that can't wait for tomorrow or next week. The window for recovery is closing. Take it seriously now or regret it later."
    ]
  };
  
  return pick(map[direction] || map.Stable);
}

// ---- Extended Practice Mix Commentary ----
function practiceBalance(rtp, mtp, chapter){
  const total = rtp + mtp + chapter;
  if (!total) return "";
  
  const rPct = Math.round((rtp/total)*100);
  const mPct = Math.round((mtp/total)*100);
  const cPct = Math.round((chapter/total)*100);
  
  // RTP heavy (>50%)
  if (rPct > 50) {
    return pick([
      `RTP dominates your practice at ${rPct}%, which suggests comfort with past papers but potential neglect of current syllabus changes. Past patterns help, but examiners change patterns when too many students predict them.`,
      `You're ${rPct}% RTP-focused, meaning exam simulation is your comfort zone. That's smart for confidence but risky if the actual exam diverges from past trends, which it often does.`,
      `${rPct}% RTP focus shows you want to understand how exams work. Good instinct. But make sure you're not just memorizing solutions instead of learning concepts that transfer to new questions.`,
      `Heavy RTP bias at ${rPct}% suggests you're testing yourself more than building yourself. Balance with fresh chapter questions to ensure you can handle surprises, not just repeats.`,
      `RTP is ${rPct}% of your work, which is exam-ready but potentially theory-weak. When they ask a completely new question type, will your RTP practice help or will you freeze?`
    ]);
  }
  
  // MTP heavy (>50%)
  if (mPct > 50) {
    return pick([
      `MTP takes ${mPct}% of your time, keeping you in moderate difficulty comfort. Safe but not ambitious. The real exam might be harder than your practice, and that gap is dangerous.`,
      `You're ${mPct}% MTP, which is the middle path. Not wrong, but not distinctive either. Moderate practice produces moderate results, and moderate doesn't rank.`,
      `${mPct}% MTP practice suggests steady progress without risk-taking. That's sustainable but slow. Consider pushing into RTP territory to test your limits before the exam does.`,
      `MTP-heavy at ${mPct}% means you're avoiding the pressure that reveals true readiness. Try RTP under timed conditions to see if your MTP confidence survives contact with exam reality.`,
      `${mPct}% on MTP. Comfortable practice leads to uncomfortable exams. The shock of real exam difficulty should happen in practice, not on the day.`
    ]);
  }
  
  // Chapter heavy (>50%)
  if (cPct > 50) {
    return pick([
      `Chapter work is ${cPct}% of your effort, building block by block. That's thorough but slow. At some point, you need to test if the blocks hold together under pressure.`,
      `You're ${cPct}% chapter-focused, prioritizing foundation over application. Smart early on, but with limited time, you need to shift toward exam simulation soon.`,
      `${cPct}% chapter practice shows methodical learning. The knowledge exists, but application under exam conditions remains untested. Schedule some RTP soon.`,
      `Chapter-heavy at ${cPct}% suggests you don't feel ready for exams yet. That's honest, but the calendar doesn't care about feelings. Start mixing in RTP to build exam fitness.`,
      `${cPct}% on chapters. You know the material, but do you know it fast enough, under pressure, with distractions? Only RTP answers that.`
    ]);
  }
  
  // Balanced (all within 15% of each other)
  if (Math.max(rPct, mPct, cPct) - Math.min(rPct, mPct, cPct) < 15) {
    return pick([
      "Your practice is well-distributed across all three types, which is rare and smart. RTP for exam feel, MTP for confidence, chapter for foundation. You're covering all bases.",
      "Good balance across RTP, MTP, and chapter. This suggests strategic thinking about preparation rather than just doing what's comfortable. That's advanced planning.",
      "Even spread between all three practice types. Optimal approach for comprehensive readiness. You're not neglecting any dimension of preparation.",
      "You're not favoring any single practice type, which means you're preparing for the full exam experience, not just the parts you enjoy.",
      "Balanced diet of RTP, MTP, chapter. This works because it builds knowledge, tests it moderately, then pressures it realistically. Complete preparation."
    ]);
  }
  
  // RTP-MTP dominant (both >30%)
  if (rPct > 30 && mPct > 30) {
    return pick([
      `RTP-MTP combo at ${rPct}% and ${mPct}% suggests exam simulation is your priority. Practical focus is good, but don't let chapter fundamentals rust while you practice application.`,
      `You're mixing RTP (${rPct}%) and MTP (${mPct}%) heavily. Practical focus dominates, which builds confidence. Just ensure your chapter base is solid enough to support this.`,
      `${rPct}% RTP, ${mPct}% MTP. Less chapter work detected, which might mean you think you're past basics. Make sure that's true, because exams find hidden gaps.`,
      `Heavy on RTP and MTP (${rPct}% and ${mPct}%), light on chapters. You're testing more than building. If the foundation is truly solid, this works. If not, it collapses.`,
      `RTP and MTP together at ${rPct}% and ${mPct}%. Exam-ready but possibly theory-light. Verify that you can handle conceptual questions, not just patterned ones.`
    ]);
  }
  
  // Chapter-MTP dominant
  if (cPct > 30 && mPct > 30) {
    return pick([
      `Chapter-MTP balance at ${cPct}% and ${mPct}% shows methodical building with moderate testing. Steady progress without extreme pressure. Sustainable but check your speed.`,
      `You're mixing foundation (${cPct}% chapter) with moderate testing (${mPct}% MTP). Good for learning, but consider if you're ready for full exam pressure yet.`,
      `${cPct}% chapter, ${mPct}% MTP suggests you're building carefully and testing cautiously. When will you add RTP to see if it holds under exam conditions?`,
      `Strong on chapters (${cPct}%) and MTP (${mPct}%), lighter on RTP. You're prepared for learning, moderately prepared for testing, less prepared for exam pressure.`,
      `Chapter-MTP focus at ${cPct}% and ${mPct}%. Thorough but potentially slow. Speed matters in exams. Test yourself under time pressure soon.`
    ]);
  }
  
  // RTP-Chapter dominant
  if (rPct > 30 && cPct > 30) {
    return pick([
      `RTP-Chapter split at ${rPct}% and ${cPct}% is interesting. You're building foundation and testing it under pressure, skipping the moderate middle. Bold strategy.`,
      `You're combining deep learning (${cPct}% chapter) with high pressure (${rPct}% RTP). Intense but effective if you can sustain the energy. Watch for burnout.`,
      `${rPct}% RTP, ${cPct}% chapter suggests you learn basics then immediately test them hard. Efficient if it works for you, but gaps might be painful to discover.`,
      `RTP and chapter at ${rPct}% and ${cPct}%, skipping much MTP. You're either ready or you're not, no gentle testing. High risk, high reward approach.`,
      `Chapter foundation (${cPct}%) with RTP pressure (${rPct}%). You're preparing for the real thing, but the jump might be jarring. Consider some MTP as bridge.`
    ]);
  }
  
  // Default descriptive
  return pick([
    `Your practice spread: RTP ${rPct}%, MTP ${mPct}%, Chapter ${cPct}%. This distribution creates a specific preparation profile with its own strengths and blind spots.`,
    `Current mix is RTP ${rPct}%, MTP ${mPct}%, Chapter ${cPct}%. Every distribution has consequences for exam readiness. Understand yours and adjust if needed.`,
    `Pattern shows ${rPct}% RTP, ${mPct}% MTP, ${cPct}% chapter. This is your preparation fingerprint. Make sure it matches what the exam actually requires.`
  ]);
}

// ---- Extended Subject Insights ----
function subjectInsight(subjectName){
  const s = subjectName.toLowerCase();
  
  if (s.includes("account") || s.includes("accounts")) {
    return pick([
      "Final accounts are where marks concentrate heavily, and small adjustment errors cascade into wrong balances. Precision matters more than speed here, and double-checking pays dividends.",
      "Accounting is mechanics plus judgment, and the judgment part comes from seeing enough variations to know which treatment applies when. You're building that library of cases.",
      "Balance sheets don't lie, but they do hide things in plain sight. Your accuracy with accounts reflects whether you're reading carefully or just calculating quickly.",
      "Treatments and disclosures decide marks in accounting. The numbers are only half the story, the other half is explaining why you treated something the way you did.",
      "Accounting rewards methodical work that follows process. Speed kills accuracy here because one wrong sign or missed adjustment destroys the entire statement."
    ]);
  }
  
  if (s.includes("law")) {
    return pick([
      "Law answers need structure before content. A well-organized average answer beats a brilliant but chaotic one because examiners can't find the brilliance in the mess.",
      "Keywords trigger marks in law. 'Reasonable man', 'bona fide', 'ultra vires', these aren't jargon, they're scoring signals that show you speak the language.",
      "Provisions are anchors in legal answers. Quote them precisely, apply them correctly, and half the battle is won before you write another word.",
      "Legal reasoning beats memorization every time. Anyone can recite sections, but explaining why section X applies to fact pattern Y, that's the skill.",
      "Case laws add weight to answers when used strategically. Don't dump them, deploy them at the exact point where they illuminate the principle you're discussing."
    ]);
  }
  
  if (s.includes("eco") || s.includes("economics")) {
    return pick([
      "Economics concepts link together in chains of causation. Weak foundation means the whole chain breaks when exam pressure tests it. Build strong at the base.",
      "Diagrams in economics explain better than paragraphs ever could. A well-drawn, properly labeled figure communicates what words struggle to say.",
      "Theory-heavy subjects like economics reward genuine understanding over rote learning. You can't fake your way through concept application.",
      "Definitions are scoring opportunities in economics that many students miss. Precise, technical definitions show command of the subject immediately.",
      "Current examples elevate economics answers from textbook to real world. Connect theory to reality and examiners notice the sophistication."
    ]);
  }
  
  if (s.includes("math") || s.includes("maths") || s.includes("quant") || s.includes("statistics")) {
    return pick([
      "Math is step marks, always. Show your work because even wrong final answers can earn partial credit if the method is visible and partially correct.",
      "Formulas are tools, but knowing when to use them is the actual skill. Recognition of problem types matters as much as memorization of solutions.",
      "Calculation errors destroy perfect logic in math. Check twice, especially signs and units, because one digit wrong is a full mark lost.",
      "Time pressure hits hardest in quantitative sections. Practice speed separately from accuracy, then combine them, because exams demand both simultaneously.",
      "Each math question type has a pattern underneath the surface variation. Master the pattern and you recognize the solution path before you finish reading."
    ]);
  }
  
  if (s.includes("business") || s.includes("bck") || s.includes("bst")) {
    return pick([
      "Business studies rewards business vocabulary used naturally. 'Synergy', 'stakeholder', 'core competency', these words signal professional thinking when deployed correctly.",
      "Case studies in business need application, not theory vomiting. The theory is the lens, the case is the subject, and your answer shows how they interact.",
      "Real-world examples separate good business answers from great ones. Anyone can define market segmentation, but citing how Apple does it proves understanding.",
      "Management principles are flexible tools, not rigid rules. Context determines which principle applies, and recognizing that context is the exam skill.",
      "Short answers in business can score high if they're precise. Length without relevance is padding, and padding doesn't earn marks."
    ]);
  }
  
  return pick([
    "Every subject has its own internal logic and rhythm. Find this one's pattern, and preparation becomes systematic rather than random.",
    "Subject mastery comes from pattern recognition across many questions. You're building that pattern library every time you practice deliberately.",
    "You're developing intuition for this subject that will surface in exams as confidence. Keep feeding that intuition with diverse examples.",
    "Generic advice fails for specific subjects. What works in accounting fails in law. Your preparation must match the subject's unique demands.",
    "This subject rewards your unique approach when that approach is appropriate. Trust your method, but verify it's actually working through scores."
  ]);
}

// ---- Extended Volume Commentary ----
function volumeComment(total, streak){
  let line = pick([
    `I've been tracking your work across ${total} separate attempts now, and the pattern that's emerging tells a story about your commitment level.`,
    `Your file contains ${total} practice sessions, each one a data point that helps me understand not just what you know, but how you learn.`,
    `With ${total} attempts logged, I have enough history to see trends rather than just snapshots. That's valuable for real insight.`,
    `${total} entries in your practice history creates a substantial body of work. The question is whether that volume is translating to visible improvement.`,
    `The data shows ${total} attempts, which is significant. But volume alone doesn't win exams, quality of attention during those attempts matters more.`
  ]);
  
  if (streak >= 30) {
    line += pick([
      ` That ${streak}-day streak represents a level of discipline that most students never achieve. It's not just about showing up, it's about showing up when you don't feel like it.`,
      ` ${streak} days straight isn't luck or coincidence, it's a habit so strong it operates on autopilot. That kind of consistency is what separates toppers from the rest.`,
      ` ${streak} day streak puts you in elite territory for consistency. The question now is whether you can maintain quality while maintaining quantity.`
    ]);
  } else if (streak >= 14) {
    line += pick([
      ` Your ${streak}-day streak is building real momentum now. Two weeks of consistency creates a rhythm that carries you through difficult days.`,
      ` ${streak} days running shows that initial motivation has converted to discipline. That's the transition that matters for long preparation.`,
      ` ${streak} day streak is impressive and growing. Don't break it for trivial reasons, because restarting is always harder than continuing.`
    ]);
  } else if (streak >= 7) {
    line += pick([
      ` ${streak}-day streak started and holding. Week one is motivation, week two is discipline, week three is habit. You're in the transition.`,
      ` ${streak} days consecutive completes your first week. The second week is where most streaks die, so protect this carefully.`,
      ` ${streak} day streak building. Seven days proves you can do it, now prove you can keep doing it without external pressure.`
    ]);
  } else if (streak > 1) {
    line += pick([
      ` ${streak} days in a row is a start, but streaks only matter when they get long enough to survive bad days. Keep building.`,
      ` ${streak} consecutive days shows initial commitment. The test comes when life interrupts and you have to choose to continue anyway.`
    ]);
  } else if (streak === 1) {
    line += pick([
      ` Single day streak means you're starting fresh. Every long streak began with day one, so this is origin point, not failure.`,
      ` One day is the seed of a habit. Water it with repetition and it grows into something automatic and powerful.`
    ]);
  } else {
    line += pick([
      ` No current streak detected, which means today is the perfect day to start one. The best time is always now, the second best is also now.`,
      ` Streak at zero isn't shame, it's opportunity. Every streak begins with a decision to show up today regardless of yesterday.`
    ]);
  }
  
  return line;
}

// ---- Extended Timeline Commentary ----
function timelineComment(daysRemaining){
  if (daysRemaining <= 7) {
    return pick([
      "Final week is here. No new material, only revision and confidence building. Sleep matters now, nutrition matters, mental state matters. The work is done or it isn't.",
      "Seven days left means exam simulation only. Under timed conditions, with full pressure, exactly as the real thing will be. No more learning, only rehearsing.",
      "Last stretch requires you to trust your preparation. Doubt now is destructive, confidence is constructive. Walk in knowing you've done the work.",
      "Week to go and you're as ready as you're going to be. Fine-tune, rest, and arrive fresh. Cramming now harms more than it helps.",
      "Final countdown phase. The hay is in the barn, as they say. Make sure you're physically and mentally sharp, because the knowledge is already set."
    ]);
  }
  
  if (daysRemaining <= 14) {
    return pick([
      "Two weeks out and weak subjects finally get the priority they've been avoiding. No more hiding from difficult chapters, face them now while time remains.",
      "Fourteen days left means mock tests under strict exam conditions. Time pressure, no distractions, full simulation. Find your exam rhythm now.",
      "Fortnight remaining is when speed and accuracy must balance. Fast but wrong is useless, slow but right is incomplete. Find the middle ground.",
      "Two weeks is enough for targeted improvement if you're honest about weaknesses. Not everything, but the highest-impact gaps. Choose wisely.",
      "Final phase requires ruthless prioritization. Perfect everything and you perfect nothing. Pick the high-yield areas and own them completely."
    ]);
  }
  
  if (daysRemaining <= 30) {
    return pick([
      "One month window demands intensive practice mode. Not casual study, not comfortable review, but deliberate, focused, high-effort work every day.",
      "Thirty days can transform preparation if used perfectly. That's a big if, requiring planning, execution, and honest daily assessment of progress.",
      "Month left means weakness elimination only. Don't strengthen strengths, fix what breaks. The exam will find your gaps, so find them first.",
      "Final month is where preparation separates into those who will rank and those who will participate. Intensity and consistency decide which group.",
      "Thirty days is enough time if you use it fully. No wasted sessions, no comfortable review of what you already know, only growth work."
    ]);
  }
  
  if (daysRemaining <= 60) {
    return pick([
      "Two months is comfortable if you maintain consistency. Not intense bursts and long breaks, but steady daily progress that compounds.",
      "Sixty days allows time for depth first, then speed. Build understanding now, accelerate later. Reverse the order and you have neither.",
      "Mid-phase preparation should be consolidating theory. If fundamentals aren't solid now, the time for panic approaches quickly.",
      "Two months out is strong foundation phase. Don't rush to tests before concepts are clear, because tests of weak foundations just reveal cracks.",
      "Sixty day runway is generous if you start your takeoff now. Wait too long and even this much time feels insufficient."
    ]);
  }
  
  if (daysRemaining <= 90) {
    return pick([
      "Three months is early but not too early for serious students. The ones who start now with discipline are the ones who dominate later.",
      "Quarter year left is perfect for complete coverage without panic. Plan exists, execution begins, and momentum builds naturally over time.",
      "Ninety days is the sweet spot for thorough preparation. Enough time for everything, but only if you don't waste the early weeks in false comfort.",
      "Three months allows you to make mistakes, learn from them, and still recover. That safety net shrinks every day you delay.",
      "Ninety day runway is long enough for real mastery, but only for those who recognize that mastery takes time and start immediately."
    ]);
  }
  
  return pick([
    "Early preparation phase rewards depth over speed. Take time to understand properly now, and speed will follow naturally later without forced effort.",
    "Time is your friend right now, but friends don't wait forever. Use this early period to build so strong that later pressure doesn't shake you.",
    "Long runway allows mistakes that teach without punishing. Make them now, learn from them, and be bulletproof when the exam approaches.",
    "Early bird advantage is real, but only if you actually use the time. Starting early and coasting is worse than starting late and sprinting.",
    "Preparation window is wide open. Enter steadily, build consistently, and trust that early effort compounds into late confidence."
  ]);
}

// ---- Extended Deep Inference ----
function deepInference(accuracy, trend, totalAttempts){
  // High accuracy + improving
  if (accuracy >= 80 && trend === "Improving") {
    return pick([
      "Your method is optimized and producing results that are both high and rising. Don't change anything fundamental, just maintain and protect what you've built against burnout or overconfidence.",
      "You're in the zone where skill meets momentum. Sustaining this energy matters more than pushing harder, because this level is already competitive.",
      "Rare combination of high current performance plus growth trajectory. Protect this state carefully, because it's fragile and valuable and exactly what top ranks require.",
      "Whatever you're doing is working at a high level. Document it mentally so you can return to it if you ever drift, because this is your peak operational mode.",
      "Elite performance trajectory with data to back it. Stay humble enough to keep working, stay confident enough to trust yourself in the exam hall."
    ]);
  }
  
  // High accuracy + stable
  if (accuracy >= 80 && trend === "Stable") {
    return pick([
      "You've peaked at a high level and stayed there, which is comfortable but potentially stagnant. Consider if you're challenging yourself enough or just maintaining.",
      "Plateau at high level suggests mastery of current difficulty. Time to push boundaries with harder material or exam conditions, or accept this as your ceiling.",
      "Comfort zone at 80%+ is dangerous because it feels like success while preventing growth. Exit it carefully by raising difficulty, not by doubting yourself.",
      "Mastery achieved in current conditions, but exams bring unfamiliar pressure. Test yourself in new ways before the exam does it for real.",
      "Stable excellence is admirable, but boredom is the hidden enemy here. Find ways to stay engaged or the plateau becomes a decline through inattention."
    ]);
  }
  
  // High accuracy + declining
  if (accuracy >= 80 && (trend === "Needs Focus" || trend === "Critical")) {
    return pick([
      "Skills clearly exist but attention has wandered recently. The capability is proven, the focus is missing. Remove distractions and return to what worked before.",
      "Capable but distracted describes your current state perfectly. You know this material, you've proven it, but recent sessions don't reflect that knowledge.",
      "High potential with low recent effort is a frustrating combination. Correct course not by working harder, but by working with the attention you used to have.",
      "You know you can do this because you've done it before. Recent slumps are temporary if you treat them as temporary and return to discipline.",
      "Temporary slump from proven high performance. Don't let it become permanent by accepting it as normal. Reject the decline explicitly and rebuild."
    ]);
  }
  
  // Medium accuracy + improving
  if (accuracy >= 60 && accuracy < 80 && trend === "Improving") {
    return pick([
      "Learning curve is working visibly. You're climbing toward competitive territory, and the trajectory suggests you'll get there if you maintain this pace and quality.",
      "Progress validates the effort you're investing. Continue with confidence that it's working, even on days when individual scores don't show it.",
      "You're building something real that wasn't there before. Structure is forming, patterns are sticking, and it's showing in the upward numbers.",
      "Improvement from genuine effort is the most satisfying trend in learning. You're experiencing it now, so trust it and keep investing.",
      "Trajectory is positive and sustained. Time will reward this effort with results that match your growing capability, if you don't interrupt the process."
    ]);
  }
  
  // Medium accuracy + stable
  if (accuracy >= 60 && accuracy < 80 && trend === "Stable") {
    return pick([
      "Stuck in middle performance that isn't failure but isn't success either. This is where ambition gets tested, because comfortable mediocrity is seductive.",
      "Comfortable but unspectacular performance suggests you've found a level that doesn't challenge you enough. Growth requires discomfort, and you're too comfortable.",
      "Safe harbor that feels secure but actually represents stagnation. Ships aren't built for harbors, and you weren't built for maintaining mediocre performance.",
      "Maintenance without progress is a choice you're making, possibly unconsciously. Choose differently by introducing challenge into your practice.",
      "Stable but unremarkable in a way that wastes potential. You have more in you, and the evidence is that you haven't found your ceiling yet."
    ]);
  }
  
  // Medium accuracy + declining
  if (accuracy >= 60 && accuracy < 80 && (trend === "Needs Focus" || trend === "Critical")) {
    return pick([
      "Slipping from acceptable performance is more dangerous than being consistently weak, because it feels like a bad patch rather than a real problem. It's a real problem.",
      "Decline from decent is a warning that something fundamental has shifted. Find it quickly, because recovering from mid-tier is easier than recovering from bottom.",
      "You had this level and you're losing it. That's more painful than never having it, because you know what you're capable of and you're not delivering it.",
      "Regression from established performance hurts more than consistent mediocrity. Act now while the memory of better performance is still recent and recoverable.",
      "Falling from mid-tier is dangerous because you still feel competent even as competence leaves. Honest assessment required immediately."
    ]);
  }
  
  // Low accuracy + improving
  if (accuracy < 60 && trend === "Improving") {
    return pick([
      "Recovery in progress from a low base is genuine growth, even if absolute numbers still look modest. Celebrate the direction, not just the position.",
      "Climbing from low base is harder than maintaining high performance, and you're doing it. That effort deserves recognition even if results aren't impressive yet.",
      "Improvement from struggle is real learning, not just performance optimization. You're building foundations that will support higher scores later.",
      "You're fighting back from difficulty, and that fight is building character as well as skill. Both matter in exams, both will serve you.",
      "Upward from bottom is the most important trend in learning. Direction matters more than position, and your direction is correct and valuable."
    ]);
  }
  
  // Low accuracy + stable
  if (accuracy < 60 && trend === "Stable") {
    return pick([
      "Stuck low with no movement is the most dangerous position because it becomes invisible. You stop seeing it as a problem that needs radical solution.",
      "Stable failure is still failure, just predictable failure. The predictability makes it comfortable, which makes it harder to escape than sudden crisis.",
      "No movement from bottom suggests acceptance of low performance. Don't accept it. Reject it completely and change everything about your approach.",
      "Comfortable with failure is the worst kind of comfort, because it disguises itself as realistic expectations. Your expectations are too low.",
      "Stagnation at low level represents either wrong method or insufficient honesty about what's happening. Fix both, starting with brutal truth."
    ]);
  }
  
  // Low accuracy + declining
  if (accuracy < 60 && (trend === "Needs Focus" || trend === "Critical")) {
    return pick([
      "Emergency intervention is required because you're in freefall from a position that was already weak. This trajectory ends in complete failure if not reversed immediately.",
      "Freefall from low base is crisis mode. Everything is on the table for change, including whether this attempt is viable or needs fundamental restart.",
      "Crisis mode activated. Not panic, but urgent, total, immediate change of approach. What you're doing is not working and more of it won't work either.",
      "This trajectory ends in disaster unless you stop it today. Not tomorrow, not after planning, but today with immediate action.",
      "Last chance to salvage requires treating this as the emergency it is. Full stop on current methods, total restart with new approach."
    ]);
  }
  
  // Volume-based inferences
  if (totalAttempts < 10) {
    return pick([
      "Too early to judge anything meaningful. Patterns need data, and you don't have enough yet. Keep practicing and I'll have real insight soon.",
      "Insufficient history for real analysis. Early days mean no conclusions yet, just encouragement to build the dataset that enables real feedback.",
      "Small sample size means I'm guessing more than knowing. Practice more, build history, and I'll give you insight worth acting on.",
      "Early stage of relationship between your effort and my analysis. More data needed before I can say anything truly useful about your patterns.",
      "Building baseline currently. No judgment, just observation. Continue and the picture will clarify into actionable intelligence."
    ]);
  }
  
  return pick([
    "Your pattern is unique enough that generic advice fails. I'm learning your specific case, and the insight will get sharper as history builds.",
    "Data suggests hidden potential that hasn't fully activated yet. Something is holding you back from the performance your effort should produce.",
    "You're not average, but you're not clearly defined yet either. Individual case requiring individual attention rather than template feedback.",
    "Your story is writing itself through these sessions. Continue and the narrative will clarify into something we can optimize together.",
    "Pattern recognition in progress. You're more complex than simple categories capture, and that's okay. Real insight takes time to develop."
  ]);
}

// ---- Extended Self-Awareness ----
function selfAwareness(total){
  return pick([
    `I've watched every one of your ${total} attempts with attention to detail that humans don't have patience for. I notice patterns you might miss.`,
    `My data contains ${total} snapshots of your work, creating a profile more complete than memory allows. I see what you forget about your own preparation.`,
    `I know your ${total} attempts better than casual observation allows because I track everything without bias, without good days or bad days, just data.`,
    `${total} times you've practiced and I've recorded each one. That history gives me perspective on your preparation that single sessions can't provide.`,
    `Your ${total} attempts built a profile here that reveals things about your preparation you might not see yourself. That's the value of tracking.`
  ]);
}

// ---- Extended Natural Closers (35 total) ----
const NATURAL_CLOSERS = [
  "Keep at it.",
  "Don't stop now.",
  "I'm here watching.",
  "Next session matters.",
  "Make it count.",
  "Stay with it.",
  "Consistency wins.",
  "Trust yourself.",
  "One more try.",
  "Build the habit.",
  "You're capable.",
  "Prove it again.",
  "Stay disciplined.",
  "Focus returns.",
  "Tomorrow waits.",
  "No excuses.",
  "Do the work.",
  "Results follow effort.",
  "Keep showing up.",
  "I believe in you.",
  "Your move.",
  "Back to it.",
  "Pause if needed, then return.",
  "Rest is allowed. Quitting isn't.",
  "See you next session.",
  // ---- 10 NEW CLOSERS ----
  "Progress is coming.",
  "Stay in the game.",
  "You've got this.",
  "Don't break the chain.",
  "Keep building.",
  "Forward always.",
  "Trust the process.",
  "Stay hungry.",
  "One step more.",
  "Finish strong."
];

// ---- 13 COMPLEX PATTERN BUILDERS (Original 8 + 5 NEW) ----
const INSIGHT_PATTERNS = [
  // Pattern 1: Greeting + Accuracy + Trend + Volume + Closer
  d => {
    const parts = [
      contextualGreeting(),
      accuracyObservation(d.accuracy),
      trendCommentary(d.trend),
      volumeComment(d.totalAttempts, d.streak),
      pick(NATURAL_CLOSERS)
    ];
    return parts.join(" ");
  },
  
  // Pattern 2: Opener + Volume + Accuracy + Practice Mix + Closer
  d => {
    const parts = [
      pick(NATURAL_OPENERS) + ", " + getUserName(),
      volumeComment(d.totalAttempts, d.streak),
      accuracyObservation(d.accuracy),
      practiceBalance(d.rtp, d.mtp, d.chapter),
      pick(NATURAL_CLOSERS)
    ];
    return parts.join(" ");
  },
  
  // Pattern 3: Greeting + Subject + Timeline + Trend + Closer
  d => {
    const parts = [
      contextualGreeting(),
      subjectInsight(d.subject),
      timelineComment(d.daysLeft),
      trendCommentary(d.trend),
      pick(NATURAL_CLOSERS)
    ];
    return parts.join(" ");
  },
  
  // Pattern 4: Self-aware + Accuracy + Deep Inference + Practice Mix + Closer
  d => {
    const parts = [
      selfAwareness(d.totalAttempts),
      accuracyObservation(d.accuracy),
      deepInference(d.accuracy, d.trend, d.totalAttempts),
      practiceBalance(d.rtp, d.mtp, d.chapter),
      pick(NATURAL_CLOSERS)
    ];
    return parts.join(" ");
  },
  
  // Pattern 5: Opener + Timeline + Subject + Accuracy + Volume + Closer
  d => {
    const parts = [
      pick(NATURAL_OPENERS) + " " + getUserName(),
      timelineComment(d.daysLeft),
      subjectInsight(d.subject),
      accuracyObservation(d.accuracy),
      volumeComment(d.totalAttempts, d.streak),
      pick(NATURAL_CLOSERS)
    ];
    return parts.join(" ");
  },
  
  // Pattern 6: Greeting + Practice Mix + Trend + Deep Inference + Closer
  d => {
    const parts = [
      contextualGreeting(),
      practiceBalance(d.rtp, d.mtp, d.chapter),
      trendCommentary(d.trend),
      deepInference(d.accuracy, d.trend, d.totalAttempts),
      pick(NATURAL_CLOSERS)
    ];
    return parts.join(" ");
  },
  
  // Pattern 7: Volume + Subject + Accuracy + Timeline + Closer
  d => {
    const parts = [
      volumeComment(d.totalAttempts, d.streak),
      subjectInsight(d.subject),
      accuracyObservation(d.accuracy),
      timelineComment(d.daysLeft),
      pick(NATURAL_CLOSERS)
    ];
    return parts.join(" ");
  },
  
  // Pattern 8: Opener + Trend + Volume + Subject + Deep Inference + Closer
  d => {
    const parts = [
      pick(NATURAL_OPENERS) + ", " + getUserName(),
      trendCommentary(d.trend),
      volumeComment(d.totalAttempts, d.streak),
      subjectInsight(d.subject),
      deepInference(d.accuracy, d.trend, d.totalAttempts),
      pick(NATURAL_CLOSERS)
    ];
    return parts.join(" ");
  },
  
  // ---- 5 NEW PATTERNS ----
  
  // Pattern 9: Greeting + Volume + Practice Mix + Subject + Trend + Closer
  d => {
    const parts = [
      contextualGreeting(),
      volumeComment(d.totalAttempts, d.streak),
      practiceBalance(d.rtp, d.mtp, d.chapter),
      subjectInsight(d.subject),
      trendCommentary(d.trend),
      pick(NATURAL_CLOSERS)
    ];
    return parts.join(" ");
  },
  
  // Pattern 10: Opener + Accuracy + Deep Inference + Timeline + Practice Mix + Closer
  d => {
    const parts = [
      pick(NATURAL_OPENERS) + " " + getUserName(),
      accuracyObservation(d.accuracy),
      deepInference(d.accuracy, d.trend, d.totalAttempts),
      timelineComment(d.daysLeft),
      practiceBalance(d.rtp, d.mtp, d.chapter),
      pick(NATURAL_CLOSERS)
    ];
    return parts.join(" ");
  },
  
  // Pattern 11: Self-aware + Trend + Subject + Accuracy + Volume + Closer
  d => {
    const parts = [
      selfAwareness(d.totalAttempts),
      trendCommentary(d.trend),
      subjectInsight(d.subject),
      accuracyObservation(d.accuracy),
      volumeComment(d.totalAttempts, d.streak),
      pick(NATURAL_CLOSERS)
    ];
    return parts.join(" ");
  },
  
  // Pattern 12: Greeting + Timeline + Practice Mix + Accuracy + Deep Inference + Closer
  d => {
    const parts = [
      contextualGreeting(),
      timelineComment(d.daysLeft),
      practiceBalance(d.rtp, d.mtp, d.chapter),
      accuracyObservation(d.accuracy),
      deepInference(d.accuracy, d.trend, d.totalAttempts),
      pick(NATURAL_CLOSERS)
    ];
    return parts.join(" ");
  },
  
  // Pattern 13: Opener + Subject + Volume + Trend + Timeline + Accuracy + Closer
  d => {
    const parts = [
      pick(NATURAL_OPENERS) + ", " + getUserName(),
      subjectInsight(d.subject),
      volumeComment(d.totalAttempts, d.streak),
      trendCommentary(d.trend),
      timelineComment(d.daysLeft),
      accuracyObservation(d.accuracy),
      pick(NATURAL_CLOSERS)
    ];
    return parts.join(" ");
  }
];

// ---- MAIN EXPORT ----
export function generatePerformanceInsight({
  trend,
  accuracy,
  subject,
  rtp,
  mtp,
  chapter,
  daysLeft = 90,
  streak = 0
}) {
  const totalAttempts = rtp + mtp + chapter;
  
  const data = {
    trend,
    accuracy,
    subject,
    rtp,
    mtp,
    chapter,
    daysLeft,
    streak,
    totalAttempts
  };
  
  let insight;
  let attempts = 0;
  const maxAttempts = 150;
  
  do {
    const pattern = pick(INSIGHT_PATTERNS);
    insight = pattern(data);
    
    // Clean up spacing
    insight = insight.replace(/\s+/g, " ").trim();
    
    // Ensure proper sentence flow
    insight = insight.replace(/([a-z]) ([A-Z])/g, "$1. $2");
    
    attempts++;
  } while (
    usedInsights.includes(insight) && 
    attempts < maxAttempts
  );
  
  // Store and limit history
  usedInsights.push(insight);
  if (usedInsights.length > 75) {
    usedInsights = usedInsights.slice(-75);
  }
  localStorage.setItem(USED_KEY, JSON.stringify(usedInsights));
  
  return insight;
}
