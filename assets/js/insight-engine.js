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
  "Hey", "Listen", "Guess what", "Okay", "Hmm", "I noticed", "Alright"
];

const ASTRA_MOODS = [
  "gentle", "playful", "serious", "motivating", "caring"
];

function personaPrefix(){
  const name = getUserName();
  const opener = pick(ASTRA_OPENERS);
  return `${opener}, ${name} -`;
}

// ---- Time greeting ----
function timeGreeting(){
  const h = new Date().getHours();
  const name = getUserName();

  if(h < 12) return pick([
    `Good morning ${name}, let’s make today count.`,
    `${name}, fresh morning energy detected.`,
    `Rise and shine ${name}, I’m here.`
  ]);

  if(h < 18) return pick([
    `Good afternoon ${name}, stay steady.`,
    `${name}, mid-day progress check.`,
    `Hey ${name}, keep the rhythm going.`
  ]);

  return pick([
    `Good evening ${name}, night focus mode.`,
    `${name}, quiet hours are powerful.`,
    `Late study again ${name}? I like that.`
  ]);
}

// ---- Accuracy ----
function accuracyLine(acc){
  if(acc >= 85) return pick([
    `${acc}% accuracy - elite level.`,
    `Whoa ${acc}%… genius alert.`,
    `${acc}% - flawless execution.`
  ]);

  if(acc >= 70) return pick([
    `${acc}% accuracy - strong and stable.`,
    `${acc}% - you're in the safe zone.`,
    `Nice ${acc}%… reliable performance.`
  ]);

  if(acc >= 55) return pick([
    `${acc}% - almost there.`,
    `${acc}%… one push away from safety.`,
    `Borderline ${acc}%, don’t stop now.`
  ]);

  if(acc >= 45) return pick([
    `${acc}%… risky territory.`,
    `${acc}% - I’m holding your hand.`,
    `Low ${acc}% - we fix this together.`
  ]);

  return pick([
    `${acc}% - emergency revision needed.`,
    `${acc}%… don’t panic, I’ve got you.`,
    `Critical ${acc}% - we rebuild.`
  ]);
}

// ---- Trend ----
function trendLine(trend){
  const map = {
    Improving: [
      "Your curve is rising nicely.",
      "Progress confirmed - good sign.",
      "Momentum is building."
    ],
    Stable: [
      "You're steady.",
      "Holding ground well.",
      "Consistency detected."
    ],
    "Needs Focus": [
      "Focus slipped a little.",
      "Attention needed here.",
      "We tighten this up."
    ],
    Critical: [
      "This needs urgent care.",
      "We’re in danger zone.",
      "Immediate correction required."
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

// ---- Closers ----
const CLOSERS = [
  "Keep going.",
  "Don’t stop here.",
  "I’m with you.",
  "Next update will be better.",
  "Make me proud."
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