document.addEventListener("DOMContentLoaded", () => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const STORAGE = {
    reaction: "funhub_best_reaction",
    guess: "funhub_best_guess",
    memory: "funhub_best_memory",
    daily: "funhub_daily_completed"
  };
  const getNum = (key) => {
    const v = Number(localStorage.getItem(key));
    return Number.isFinite(v) && v > 0 ? v : null;
  };
  const setNum = (key, value) => localStorage.setItem(key, String(value));
  const formatBest = (key, type) => {
    const v = getNum(key);
    if (v === null) return "—";
    if (type === "ms") return `${v} ms`;
    if (type === "guesses") return `${v} ${v === 1 ? "guess" : "guesses"}`;
    return `Level ${v}`;
  };

  // Mobile navigation
  const menuBtn = $(".menu-btn"), nav = $(".nav");
  if (menuBtn && nav) menuBtn.addEventListener("click", () => nav.classList.toggle("open"));

  // Daily challenge rotates predictably by calendar day.
  const challenges = [
    { key: "reaction", title: "Beat your reaction time", description: "Try the Reaction Test and beat your personal best.", href: "games.html#reaction", label: "Take the reaction challenge →" },
    { key: "guess", title: "Guess it in 7 or fewer", description: "Find today's hidden number from 1–100 in as few guesses as possible.", href: "games.html#guess", label: "Take the guessing challenge →" },
    { key: "memory", title: "Remember the sequence", description: "Complete as many memory levels as you can without making a mistake.", href: "games.html#memory", label: "Take the memory challenge →" }
  ];
  const dayIndex = Math.floor(Date.now() / 86400000) % challenges.length;
  const today = new Date();
  const dayKey = `${today.getUTCFullYear()}-${today.getUTCMonth()+1}-${today.getUTCDate()}`;
  const challenge = challenges[dayIndex];
  const dailyTitle = $("#daily-title"), dailyDesc = $("#daily-description"), dailyBtn = $("#daily-btn"), dailyStatus = $("#daily-status"), dailyBadge = $("#daily-badge");
  if (dailyTitle) {
    dailyTitle.textContent = challenge.title;
    dailyDesc.textContent = challenge.description;
    dailyBtn.href = challenge.href + `?challenge=${challenge.key}`;
    dailyBtn.textContent = challenge.label;
    dailyBadge.textContent = String(dayIndex + 1).padStart(2, "0");
    if (localStorage.getItem(STORAGE.daily) === dayKey) {
      dailyStatus.textContent = "✓ Today's challenge completed. Come back tomorrow for a new one.";
      dailyStatus.classList.add("challenge-complete");
    }
  }

  // Games page: show personal records.
  const scoreReaction = $("#score-reaction"), scoreGuess = $("#score-guess"), scoreMemory = $("#score-memory");
  if (scoreReaction) scoreReaction.textContent = formatBest(STORAGE.reaction, "ms");
  if (scoreGuess) scoreGuess.textContent = formatBest(STORAGE.guess, "guesses");
  if (scoreMemory) scoreMemory.textContent = formatBest(STORAGE.memory, "level");

  const markDailyIfNeeded = (key) => {
    if (key === challenge.key) {
      localStorage.setItem(STORAGE.daily, dayKey);
      if (dailyStatus) {
        dailyStatus.textContent = "✓ Today's challenge completed!";
        dailyStatus.classList.add("challenge-complete");
      }
    }
  };

  // Highlight the selected daily challenge when arriving from the homepage.
  if ($( "#daily-game-note")) {
    const params = new URLSearchParams(location.search);
    const requested = params.get("challenge");
    if (requested && challenges.some(c => c.key === requested)) {
      const c = challenges.find(x => x.key === requested);
      const note = $("#daily-game-note");
      note.innerHTML = `<strong>🎯 Today's challenge:</strong> ${c.title}. Your result will update your personal record when applicable.`;
      note.classList.remove("hidden");
      const card = document.getElementById(requested);
      if (card) setTimeout(() => card.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
    }
  }

  // Reaction Test
  const rBox = $("#reaction-box"), rBtn = $("#reaction-btn"), rResult = $("#reaction-result");
  let rActive = false, rTimer = null, rStart = 0;
  const startReaction = () => {
    if (!rBox || !rBtn) return;
    rBox.className = "reaction-box wait"; rBox.textContent = "Wait..."; rBtn.textContent = "Waiting...";
    clearTimeout(rTimer);
    rTimer = setTimeout(() => {
      rActive = true; rStart = performance.now(); rBox.className = "reaction-box go"; rBox.textContent = "CLICK!"; rBtn.textContent = "Click!";
    }, 900 + Math.random() * 2500);
  };
  if (rBtn) rBtn.addEventListener("click", () => {
    if (rActive) {
      const ms = Math.round(performance.now() - rStart);
      rActive = false; rBox.className = "reaction-box ready"; rBox.textContent = "Nice!";
      const old = getNum(STORAGE.reaction);
      const isBest = old === null || ms < old;
      if (isBest) setNum(STORAGE.reaction, ms);
      rResult.textContent = isBest ? `🏆 New personal best: ${ms} ms!` : `${ms} ms reaction time. Best: ${old} ms`;
      rResult.classList.toggle("new-best", isBest);
      rBtn.textContent = "Try again";
      if (scoreReaction) scoreReaction.textContent = formatBest(STORAGE.reaction, "ms");
      markDailyIfNeeded("reaction");
    } else if (rBox.classList.contains("wait")) {
      clearTimeout(rTimer); rBox.className = "reaction-box ready"; rBox.textContent = "Too early!"; rResult.textContent = "Wait until the screen changes."; rBtn.textContent = "Start again";
    } else startReaction();
  });

  // Number Guessing
  const gInput = $("#guess-input"), gBtn = $("#guess-btn"), gResult = $("#guess-result"), gReset = $("#guess-reset");
  let target = Math.floor(Math.random() * 100) + 1, attempts = 0;
  const resetGuess = () => { target = Math.floor(Math.random()*100)+1; attempts = 0; if(gInput) gInput.value=""; if(gResult) gResult.textContent="New number ready."; };
  const submitGuess = () => {
    if (!gInput || !gResult) return;
    const n = Number(gInput.value);
    if (!n || n < 1 || n > 100) { gResult.textContent = "Enter a number from 1 to 100."; return; }
    attempts++;
    if (n === target) {
      const old = getNum(STORAGE.guess);
      const isBest = old === null || attempts < old;
      if (isBest) setNum(STORAGE.guess, attempts);
      gResult.textContent = isBest ? `🏆 New personal best: ${attempts} ${attempts===1?"guess":"guesses"}!` : `Correct! You got it in ${attempts} ${attempts===1?"guess":"guesses"}. Best: ${old} ${old===1?"guess":"guesses"}.`;
      gResult.classList.toggle("new-best", isBest);
      if (scoreGuess) scoreGuess.textContent = formatBest(STORAGE.guess, "guesses");
      markDailyIfNeeded("guess");
    } else gResult.textContent = n < target ? "Too low — try again." : "Too high — try again.";
  };
  if (gBtn) gBtn.addEventListener("click", submitGuess);
  if (gInput) gInput.addEventListener("keydown", e => { if (e.key === "Enter") submitGuess(); });
  if (gReset) gReset.addEventListener("click", resetGuess);

  // Memory Challenge — one stateful click handler, so answers are actually checked.
  const mDisplay=$("#memory-sequence"), mBtn=$("#memory-btn"), mInput=$("#memory-input"), mResult=$("#memory-result");
  let memoryLevel=0, memorySequence="", memoryAwaitingAnswer=false, memoryTimer=null;
  const startMemoryRound = () => {
    if (!mDisplay || !mBtn || !mInput) return;
    memoryLevel++;
    memorySequence="";
    for(let i=0;i<memoryLevel+2;i++) memorySequence += Math.floor(Math.random()*10);
    memoryAwaitingAnswer=false;
    mInput.value=""; mInput.classList.add("hidden"); mDisplay.textContent=memorySequence;
    mBtn.disabled=true; mBtn.textContent="Memorize..."; if(mResult) mResult.textContent="";
    clearTimeout(memoryTimer);
    memoryTimer=setTimeout(()=>{ mDisplay.textContent="???"; mInput.classList.remove("hidden"); mInput.focus(); mBtn.disabled=false; mBtn.textContent="Check answer"; memoryAwaitingAnswer=true; }, Math.max(1500,1500+memoryLevel*250));
  };
  const checkMemoryAnswer = () => {
    if (!memoryAwaitingAnswer || !mInput || !mBtn) return;
    const answer=mInput.value.trim();
    if (answer === memorySequence) {
      const old=getNum(STORAGE.memory);
      const isBest=old===null || memoryLevel>old;
      if(isBest) setNum(STORAGE.memory,memoryLevel);
      if(mResult) { mResult.textContent=isBest ? `🏆 Correct! New personal best: Level ${memoryLevel}!` : `Correct! Level ${memoryLevel} complete. 🧠`; mResult.classList.toggle("new-best",isBest); }
      if(scoreMemory) scoreMemory.textContent=formatBest(STORAGE.memory,"level");
      markDailyIfNeeded("memory");
      mInput.value=""; mInput.classList.add("hidden"); mDisplay.textContent="Ready for the next level?"; mBtn.textContent="Next level"; memoryAwaitingAnswer=false;
    } else {
      if(mResult) mResult.textContent=`Not quite. The sequence was ${memorySequence}. Your run ended at Level ${memoryLevel}.`;
      memoryLevel=0; memoryAwaitingAnswer=false; mInput.value=""; mInput.classList.add("hidden"); mDisplay.textContent="Try again"; mBtn.textContent="Start challenge";
    }
  };
  if(mBtn) mBtn.addEventListener("click", () => memoryAwaitingAnswer ? checkMemoryAnswer() : startMemoryRound());
  if(mInput) mInput.addEventListener("keydown", e => { if(e.key === "Enter") checkMemoryAnswer(); });

  const copyItem = (text) => navigator.clipboard?.writeText(text);
  const makeItems = (el, items) => { if(!el) return; el.innerHTML=""; items.forEach(item=>{ const row=document.createElement("div"); row.className="output-item"; row.innerHTML=`<span>${item}</span><button class="copy-btn" type="button">Copy</button>`; row.querySelector("button").addEventListener("click",()=>copyItem(item)); el.appendChild(row); }); };
  const uBtn=$("#username-btn"), uOut=$("#username-output"), uVibe=$("#username-vibe");
  if(uBtn) uBtn.addEventListener("click",()=>{ const first=["Nova","Shadow","Pixel","Lunar","Echo","Vortex","Frost","Neon","Orbit","Rogue","Zen","Drift"]; const second={cool:["X","Wave","Mode","Rush","Core"],gaming:["GG","Quest","Boss","Byte","XP"],minimal:["One","Zero","Line","Void","Mono"],fun:["Noodle","Bubbles","Pickle","Mango","Waffles"]}[uVibe.value]; const arr=[...Array(8)].map(()=>first[Math.floor(Math.random()*first.length)]+second[Math.floor(Math.random()*second.length)]+(Math.random()<.5?"":Math.floor(Math.random()*99))); makeItems(uOut,[...new Set(arr)].slice(0,8)); });
  const nBtn=$("#nickname-btn"), nOut=$("#nickname-output"), nInput=$("#nickname-input");
  if(nBtn) nBtn.addEventListener("click",()=>{ const name=nInput.value.trim(); if(!name){nOut.innerHTML='<div class="output-item">Enter a name first.</div>';return;} const base=name.charAt(0).toUpperCase()+name.slice(1); makeItems(nOut,[base+"y",base.slice(0,Math.min(4,base.length))+"o","Lil "+base,base+"ster",base+"u","Captain "+base,base+"zilla","The "+base]); });
  const bBtn=$("#bio-btn"), bOut=$("#bio-output"), bVibe=$("#bio-vibe");
  const bios={chill:["Taking it easy, one day at a time.","Good vibes. Quiet mind. Big dreams.","Offline sometimes. Living always."],funny:["Professional overthinker. Part-time legend.","Powered by snacks and questionable decisions.","I came. I saw. I forgot why I came."],ambitious:["Building quietly. Letting results speak.","Small steps. Big vision.","Learning today. Building tomorrow."],mysterious:["You know my name, not my story.","Some things are better left unsaid.","Observe more. Explain less."]};
  if(bBtn) bBtn.addEventListener("click",()=>makeItems(bOut,bios[bVibe.value]));
  const ageBtn=$("#age-btn"), ageResult=$("#age-result"), dob=$("#dob"); if(ageBtn) ageBtn.addEventListener("click",()=>{if(!dob.value){ageResult.textContent="Choose your date of birth.";return;} const birth=new Date(dob.value+"T00:00:00"),now=new Date();let years=now.getFullYear()-birth.getFullYear(),months=now.getMonth()-birth.getMonth(),days=now.getDate()-birth.getDate();if(days<0){months--;const prev=new Date(now.getFullYear(),now.getMonth(),0);days+=prev.getDate();}if(months<0){years--;months+=12;}ageResult.textContent=`You are ${years} years, ${months} months and ${days} days old.`;});
  const pBtn=$("#percent-btn"), pRes=$("#percent-result"); if(pBtn) pBtn.addEventListener("click",()=>{const part=Number($("#percent-part").value),total=Number($("#percent-total").value);if(!total){pRes.textContent="Enter a non-zero total.";return;}pRes.textContent=`${((part/total)*100).toFixed(2)}%`;});
  const dBtn=$("#date-btn"), dRes=$("#date-result"); if(dBtn) dBtn.addEventListener("click",()=>{const a=new Date($("#date-one").value),b=new Date($("#date-two").value);if(isNaN(a)||isNaN(b)){dRes.textContent="Choose both dates.";return;}dRes.textContent=`${Math.round(Math.abs(b-a)/86400000).toLocaleString()} days`;});
});
