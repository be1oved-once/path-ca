function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

// ---- Memory Keys ----
const USED_KEY = "uniqueAstraInsights_v3";
const NAME_KEY = "cachedUsername";

let usedInsights = JSON.parse(localStorage.getItem(USED_KEY) || "[]");

// ---- Username helper ----
function getUserName(){
  return localStorage.getItem(NAME_KEY) || "you";
}

export function cacheUsername(name){
  if(name) localStorage.setItem(NAME_KEY, name);
}

// ---- Persona Core ----
const ASTRA_OPENERS = [
  "Hey", "Listen", "Guess what", "Okay", "Hmm", "I noticed", "Alright",
  "So", "Well", "Look", "Interesting", "Wait", "Hold on",
  "Quick thought", "Just saying", "Noticed something",
  "Here’s the thing"
];

const ASTRA_MOODS = [
  "gentle", "playful", "serious", "motivating", "caring",
  "focused", "direct", "calm", "strategic", "supportive",
  "analytical", "observant", "steady", "disciplined", "patient"
];

function personaPrefix(){
  const name = getUserName();
  const opener = pick(ASTRA_OPENERS);
  return `${opener}, ${name} -`;
}

function timeGreeting(){
  const h = new Date().getHours();
  const name = getUserName();

  if(h < 12) return pick([
    `Good morning ${name}, let’s make today count.`,
    `${name}, fresh morning energy detected.`,
    `Rise and shine ${name}, I’m here.`,
    `Morning focus suits you, ${name}.`,
    `New day, new gains ${name}.`,
    `${name}, mornings build toppers.`,
    `Early effort pays off, ${name}.`,
    `Sharp start today, ${name}.`,
    `Morning discipline noticed, ${name}.`,
    `${name}, let’s lock in early.`
  ]);

  if(h < 18) return pick([
    `Good afternoon ${name}, stay steady.`,
    `${name}, mid-day progress check.`,
    `Hey ${name}, keep the rhythm going.`,
    `Afternoon grind detected, ${name}.`,
    `${name}, consistency matters now.`,
    `Midday focus is underrated, ${name}.`,
    `Holding pace well, ${name}.`,
    `This is where ranks are built, ${name}.`,
    `No slowing down, ${name}.`,
    `Solid daytime effort, ${name}.`
  ]);

  return pick([
    `Good evening ${name}, night focus mode.`,
    `${name}, quiet hours are powerful.`,
    `Late study again ${name}? I like that.`,
    `Night sessions build confidence, ${name}.`,
    `Silence helps thinking, ${name}.`,
    `Serious hours now, ${name}.`,
    `Evening clarity is strong, ${name}.`,
    `This focus window matters, ${name}.`,
    `Night grind noted, ${name}.`,
    `You work when others rest, ${name}.`
  ]);
}

function accuracyLine(acc){
  if(acc >= 85) return pick([
    `${acc}% accuracy - elite level.`,
    `Whoa ${acc}%… genius alert.`,
    `${acc}% - flawless execution.`,
    `Top-tier accuracy at ${acc}%.`,
    `You’re operating at ${acc}% precision.`,
    `${acc}% shows mastery.`,
    `Examiner-friendly performance.`,
    `This accuracy scares competition.`,
    `${acc}% - rank material.`,
    `Sharp and clean at ${acc}%.`
  ]);

  if(acc >= 70) return pick([
    `${acc}% accuracy - strong and stable.`,
    `${acc}% - you're in the safe zone.`,
    `Nice ${acc}%… reliable performance.`,
    `Controlled accuracy at ${acc}%.`,
    `You’re managing well at ${acc}%.`,
    `${acc}% keeps you competitive.`,
    `Strong base confirmed.`,
    `Good exam safety margin.`,
    `${acc}% reflects discipline.`,
    `Solid work here.`
  ]);

  if(acc >= 55) return pick([
    `${acc}% - almost there.`,
    `${acc}%… one push away from safety.`,
    `Borderline ${acc}%, don’t stop now.`,
    `Close call at ${acc}%.`,
    `Accuracy needs polishing.`,
    `This can flip upward fast.`,
    `Small gaps remain.`,
    `You’re not far off.`,
    `Momentum decides now.`,
    `One correction cycle needed.`
  ]);

  if(acc >= 45) return pick([
    `${acc}%… risky territory.`,
    `${acc}% - I’m holding your hand.`,
    `Low ${acc}% - we fix this together.`,
    `This needs tightening.`,
    `Accuracy slipping.`,
    `Too many avoidable errors.`,
    `Concept clarity needed.`,
    `Marks leakage detected.`,
    `We intervene here.`,
    `This phase is recoverable.`
  ]);

  return pick([
    `${acc}% - emergency revision needed.`,
    `${acc}%… don’t panic, I’ve got you.`,
    `Critical ${acc}% - we rebuild.`,
    `This needs reset.`,
    `Foundational gaps visible.`,
    `We restart basics.`,
    `Accuracy collapse detected.`,
    `This is a warning stage.`,
    `Relearning required.`,
    `We slow down now.`
  ]);
}

function trendLine(trend){
  const map = {
    Improving: [
      "Your curve is rising nicely.",
      "Progress confirmed - good sign.",
      "Momentum is building.",
      "Upward correction visible.",
      "Recent work is paying off.",
      "Learning speed increased.",
      "Positive slope detected.",
      "You fixed something right.",
      "Growth phase active.",
      "Consistency improving."
    ],
    Stable: [
      "You're steady.",
      "Holding ground well.",
      "Consistency detected.",
      "Plateau phase.",
      "Maintaining form.",
      "No major dips.",
      "Performance predictable.",
      "Stable output.",
      "Needs push to rise.",
      "Control maintained."
    ],
    "Needs Focus": [
      "Focus slipped a little.",
      "Attention needed here.",
      "We tighten this up.",
      "Concentration leaking.",
      "Execution gaps present.",
      "Revision required.",
      "Pattern inconsistency.",
      "Errors repeating.",
      "Mind wandering detected.",
      "Discipline correction needed."
    ],
    Critical: [
      "This needs urgent care.",
      "We’re in danger zone.",
      "Immediate correction required.",
      "Performance alarm triggered.",
      "Immediate reset advised.",
      "Damage control mode.",
      "Major weaknesses present.",
      "High risk phase.",
      "Serious intervention needed.",
      "Do not ignore this."
    ]
  };
  return pick(map[trend] || map.Stable);
}

// ---- Practice mix ----
function mixLine(rtp, mtp, chapter){
  const total = rtp + mtp + chapter;
  if(!total) return "";

  const r = Math.round((rtp/total)*100);
  const m = Math.round((mtp/total)*100);
  const c = Math.round((chapter/total)*100);

  if(r>60) return `RTP dominates (${r}%).`;
  if(m>60) return `MTP focus (${m}%).`;
  if(c>60) return `Chapter practice heavy (${c}%).`;

  return "Balanced practice style.";
}

// ---- Subject ----
function subjectLine(subject){
  const s = subject.toLowerCase();

  if(s.includes("account")) return pick([
    "Final accounts decide marks.",
    "Adjustments make difference.",
    "Precision matters here."
  ]);

  if(s.includes("law")) return pick([
    "Keywords win answers.",
    "Structure brings scores.",
    "Provisions first."
  ]);

  if(s.includes("eco")) return pick([
    "Concept clarity shines.",
    "Definitions secure marks.",
    "Theory handled well."
  ]);

  if(s.includes("math")) return pick([
    "Step solving is key.",
    "Formulas are allies.",
    "Mistakes must drop."
  ]);

  return pick([
    "Revision sharpens you.",
    "Consistency is strength.",
    "Discipline pays."
  ]);
}

// ---- Attempts + streak ----
function attemptLine(total, streak){
  let line = pick([
    `I tracked ${total} attempts.`,
    `${total} drills recorded.`,
    `Practice logged (${total}).`
  ]);

  if(streak >= 7) line += ` ${streak}-day streak - proud of you.`;
  if(streak >= 14) line += ` ${streak}-day streak - impressive discipline.`;

  return line;
}

// ---- Phase ----
function phaseLine(daysLeft){
  if(daysLeft <= 30) return pick([
    "Final lap started.",
    "No room for laziness now.",
    "Finish strong."
  ]);

  if(daysLeft <= 60) return pick([
    "Mid preparation stage.",
    "Refinement time.",
    "Polish weak spots."
  ]);

  return pick([
    "Foundation phase.",
    "Build strong basics.",
    "Slow growth, strong finish."
  ]);
}

// ---- Inference ----
function inferenceLine(acc, trend){
  if(acc>=70 && trend==="Improving")
    return "Your method is clicking.";

  if(acc<55 && trend!=="Improving")
    return "Concept depth needs work.";

  if(acc>=65 && trend==="Stable")
    return "Consistency decides final result.";

  return "Hidden potential detected.";
}

// ---- Self aware ----
function selfAwareLine(total){
  return pick([
    `I watched all ${total} attempts.`,
    `Nothing escaped my notice - ${total}.`,
    `Your effort is recorded.`
  ]);
}

const CLOSERS = [
  "Keep going.",
  "Don’t stop here.",
  "I’m with you.",
  "Next update will be better.",
  "Make me proud.",
  "Stay disciplined.",
  "Trust the process.",
  "One step at a time.",
  "Momentum matters.",
  "You’re capable of more.",
  "Stay consistent.",
  "Focus wins exams.",
  "We continue.",
  "No shortcuts now.",
  "Finish clean."
];

// ---- Patterns ----
const PATTERNS = [
  d => `${accuracyLine(d.accuracy)} ${trendLine(d.trend)}`,
  d => `${attemptLine(d.totalAttempts,d.streak)} ${mixLine(d.rtp,d.mtp,d.chapter)}`,
  d => `${subjectLine(d.subject)} ${phaseLine(d.daysLeft)}`,
  d => `${selfAwareLine(d.totalAttempts)} ${inferenceLine(d.accuracy,d.trend)}`,
  d => `${mixLine(d.rtp,d.mtp,d.chapter)} ${accuracyLine(d.accuracy)}`
];

// ---- MAIN ----
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
    trend, accuracy, subject,
    rtp, mtp, chapter,
    daysLeft, streak, totalAttempts
  };

  let insight;
  let tries = 0;

  do {
    const lines = [
      timeGreeting(),
      personaPrefix(),
      pick(PATTERNS)(data),
      pick(PATTERNS)(data),
      pick(CLOSERS)
    ];

    insight = lines.join(" ").replace(/\s+/g," ").trim();
    tries++;
  } while(usedInsights.includes(insight) && tries < 80);

  usedInsights.push(insight);
  localStorage.setItem(USED_KEY, JSON.stringify(usedInsights));

  return insight;
}