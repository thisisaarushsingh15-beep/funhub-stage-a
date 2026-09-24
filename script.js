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


  // Stage B — Precision Target
  const tArena = $("#target-arena"), tDot = $("#target-dot"), tBtn = $("#target-btn"), tTime = $("#target-time"), tScore = $("#target-score"), tHits = $("#target-hits"), tResult = $("#target-result");
  const PRECISION_KEY="funhub_best_precision";
  let targetRunning=false, targetScore=0, targetHits=0, targetEnd=0, targetTimer=null;
  const placeTarget=()=>{
    if(!tArena || !tDot) return;
    const rect=tArena.getBoundingClientRect(), size=Math.max(28, Math.min(54, 46-targetHits));
    tDot.style.width=size+"px"; tDot.style.height=size+"px";
    const maxX=Math.max(0, rect.width-size-8), maxY=Math.max(0, rect.height-size-8);
    tDot.style.left=(8+Math.random()*maxX)+"px"; tDot.style.top=(8+Math.random()*maxY)+"px";
    tDot.hidden=false;
  };
  const endPrecision=()=>{
    targetRunning=false; clearInterval(targetTimer); if(tDot) tDot.hidden=true; if(tBtn) tBtn.disabled=false;
    const old=getNum(PRECISION_KEY); const best=old===null||targetScore>old; if(best) setNum(PRECISION_KEY,targetScore);
    if(tResult) tResult.textContent=best?`🏆 New personal best: ${targetScore} points!`:`Run complete: ${targetScore} points. Best: ${old} points.`;
    const sb=$("#score-precision"); if(sb) sb.textContent=String(getNum(PRECISION_KEY)||targetScore);
  };
  if(tDot) tDot.addEventListener("click",e=>{ e.stopPropagation(); if(!targetRunning)return; const size=parseFloat(tDot.style.width)||42; const points=Math.max(10,Math.round(110-size*1.2)); targetScore+=points; targetHits++; if(tScore)tScore.textContent=targetScore; if(tHits)tHits.textContent=targetHits; placeTarget(); });
  if(tBtn) tBtn.addEventListener("click",()=>{
    if(targetRunning) return; targetRunning=true; targetScore=0; targetHits=0; targetEnd=Date.now()+30000; tScore.textContent="0"; tHits.textContent="0"; tTime.textContent="30s"; tResult.textContent="Hit as many targets as you can!"; tBtn.disabled=true; placeTarget();
    targetTimer=setInterval(()=>{ const left=Math.max(0,targetEnd-Date.now()); if(tTime)tTime.textContent=(left/1000).toFixed(1)+"s"; if(left<=0)endPrecision(); },100);
  });

  // Stage B — World Conquest Lite
  const cGrid=$("#territory-grid"), cPlayer=$("#conquest-player"), cAi=$("#conquest-ai"), cTurn=$("#conquest-turn"), cResult=$("#conquest-result"), cBtn=$("#conquest-btn"), CONQUEST_KEY="funhub_best_conquest";
  let territories=[], conquestTurn=0, conquestActive=false;
  const initConquest=()=>{ territories=Array.from({length:20},(_,i)=>({id:i,owner:i<3?"p":i<6?"a":"n",power:1+Math.floor(Math.random()*3)})); conquestTurn=1; conquestActive=true; renderConquest(); cResult.textContent="Your purple territories are ready. Attack a highlighted neighbour."; };
  const renderConquest=()=>{
    if(!cGrid)return; cGrid.innerHTML=""; const playerCount=territories.filter(x=>x.owner==="p").length, aiCount=territories.filter(x=>x.owner==="a").length;
    territories.forEach((t,i)=>{const b=document.createElement("button"); b.type="button"; b.className="territory "+(t.owner==="p"?"player":t.owner==="a"?"ai":"neutral"); b.textContent=t.owner==="p"?"YOU":t.owner==="a"?"AI":"·"; b.title=`Territory ${i+1} • Power ${t.power}`;
      const row=Math.floor(i/5),col=i%5; const adjacent=territories.some(x=>x.owner==="p"&&Math.abs(Math.floor(x.id/5)-row)+Math.abs(x.id%5-col)===1); if(conquestActive&&t.owner!=="p"&&adjacent)b.classList.add("attackable");
      b.addEventListener("click",()=>playerAttack(t.id)); cGrid.appendChild(b); });
    if(cPlayer)cPlayer.textContent=playerCount; if(cAi)cAi.textContent=aiCount; if(cTurn)cTurn.textContent=`${Math.min(conquestTurn,12)}/12`;
  };
  const playerAttack=(id)=>{ if(!conquestActive)return; const t=territories[id], row=Math.floor(id/5),col=id%5; const adjacent=territories.some(x=>x.owner==="p"&&Math.abs(Math.floor(x.id/5)-row)+Math.abs(x.id%5-col)===1); if(t.owner==="p"||!adjacent){cResult.textContent="Choose an adjacent highlighted territory.";return;} const roll=1+Math.floor(Math.random()*6); const defense=t.power+Math.floor(Math.random()*3); if(roll>=defense){t.owner="p";cResult.textContent=`You captured Territory ${id+1}!`; } else cResult.textContent=`Attack failed on Territory ${id+1}.`;
    aiTurn(); conquestTurn++; if(territories.filter(x=>x.owner==="a").length===0||territories.filter(x=>x.owner==="p").length>=12||conquestTurn>12) finishConquest(); else renderConquest(); };
  const aiTurn=()=>{ const ai=territories.filter(x=>x.owner==="a"); const targets=territories.filter(t=>t.owner!=="a"); if(!ai.length||!targets.length)return; const t=targets[Math.floor(Math.random()*targets.length)]; const roll=1+Math.floor(Math.random()*6), defense=t.power+1; if(roll>=defense)t.owner="a"; };
  const finishConquest=()=>{ conquestActive=false; const p=territories.filter(x=>x.owner==="p").length, a=territories.filter(x=>x.owner==="a").length; const score=p*100-a*25+Math.max(0,13-conquestTurn)*10; const old=getNum(CONQUEST_KEY),best=old===null||score>old;if(best)setNum(CONQUEST_KEY,score); cResult.textContent=p>a?`🏆 Campaign complete — ${p} territories. Score: ${score}.`:`Campaign complete — ${p} territories. Score: ${score}.`; const sb=$("#score-conquest");if(sb)sb.textContent=String(getNum(CONQUEST_KEY)||score); renderConquest(); };
  if(cBtn)cBtn.addEventListener("click",initConquest); if(cGrid)renderConquest();

  // Stage B — Pirate Empire
  const pGold=$("#pirate-gold"),pCrew=$("#pirate-crew"),pCargo=$("#pirate-cargo"),pFleet=$("#pirate-fleet"),pResult=$("#pirate-result"),pReset=$("#pirate-reset"),PIRATE_KEY="funhub_best_pirate";
  let pirate={gold:120,crew:10,cargo:0,fleet:1,capacity:20,won:false};
  const renderPirate=()=>{if(pGold)pGold.textContent=pirate.gold;if(pCrew)pCrew.textContent=pirate.crew;if(pCargo)pCargo.textContent=`${pirate.cargo}/${pirate.capacity}`;if(pFleet)pFleet.textContent=pirate.fleet;};
  const pirateAction=(action)=>{ if(pirate.won)return; let msg="";
    if(action==="explore"){if(pirate.cargo>=pirate.capacity){msg="Your cargo hold is full. Trade it first.";}else{const gain=4+Math.floor(Math.random()*12);pirate.cargo=Math.min(pirate.capacity,pirate.cargo+gain);if(Math.random()<.22){pirate.gold=Math.max(0,pirate.gold-10);msg=`Storm! You recovered ${gain} cargo but lost 10 gold.`;}else msg=`You found ${gain} cargo while exploring.`;}}
    if(action==="trade"){const value=pirate.cargo*9;pirate.gold+=value;pirate.cargo=0;msg=value?`Sold your cargo for ${value} gold.`:"Your hold is empty.";}
    if(action==="upgrade"){const cost=90+pirate.fleet*60;if(pirate.gold<cost)msg=`You need ${cost} gold for the next ship upgrade.`;else{pirate.gold-=cost;pirate.fleet++;pirate.capacity+=10;msg=`Fleet upgraded! Cargo capacity is now ${pirate.capacity}.`;}}
    if(action==="recruit"){const cost=35+pirate.crew*2;if(pirate.gold<cost)msg=`You need ${cost} gold to recruit.`;else{pirate.gold-=cost;pirate.crew+=3;msg="Three crew members joined your voyage.";}}
    if(pirate.gold>=500){pirate.won=true;const old=getNum(PIRATE_KEY),best=old===null||pirate.gold>old;if(best)setNum(PIRATE_KEY,pirate.gold);msg+=` 🏆 Empire goal reached with ${pirate.gold} gold!`;const sb=$("#score-pirate");if(sb)sb.textContent=String(getNum(PIRATE_KEY)||pirate.gold);}
    renderPirate();if(pResult)pResult.textContent=msg;
  };
  $$("[data-pirate]").forEach(b=>b.addEventListener("click",()=>pirateAction(b.dataset.pirate))); if(pReset)pReset.addEventListener("click",()=>{pirate={gold:120,crew:10,cargo:0,fleet:1,capacity:20,won:false};renderPirate();pResult.textContent="Voyage restarted. Reach 500 gold to build your first empire.";}); renderPirate();

  // Stage B — Survival: 30 Minutes (accelerated waves; a full run can last up to 30 real minutes).
  const sHp=$("#survival-hp"),sWave=$("#survival-wave"),sEnergy=$("#survival-energy"),sTime=$("#survival-time"),sUp=$("#survival-upgrades"),sBtn=$("#survival-btn"),sResult=$("#survival-result"),SURVIVAL_KEY="funhub_best_survival";
  let survival={hp:100,wave:0,energy:0,started:0,damage:0,speed:0,armor:0,active:false,interval:null,timer:null};
  const renderSurvival=()=>{if(sHp)sHp.style.width=Math.max(0,survival.hp)+"%";if(sWave)sWave.textContent=survival.wave;if(sEnergy)sEnergy.textContent=survival.energy;if(sTime){const sec=survival.started?Math.floor((Date.now()-survival.started)/1000):0;sTime.textContent=`${Math.floor(sec/60)}:${String(sec%60).padStart(2,"0")}`;}};
  const showUpgrades=()=>{if(!sUp)return;const opts=[{n:"Reinforced armor",d:"Reduce damage by 2.",k:"armor"},{n:"Energy core",d:"Gain +2 energy each wave.",k:"energy"},{n:"Agility",d:"Reduce incoming damage by 20%.",k:"speed"}];sUp.innerHTML="";sUp.classList.remove("hidden");opts.forEach(o=>{const div=document.createElement("div");div.className="upgrade-card";div.innerHTML=`<strong>${o.n}</strong><p class="muted">${o.d}</p><button type="button" class="btn" data-upgrade="${o.k}">Choose</button>`;div.querySelector("button").addEventListener("click",()=>{survival[o.k]++;sUp.classList.add("hidden");nextSurvivalWave();});sUp.appendChild(div);});};
  const finishSurvival=()=>{survival.active=false;clearInterval(survival.interval);clearInterval(survival.timer);if(sUp)sUp.classList.add("hidden");if(sBtn)sBtn.disabled=false;const score=survival.wave*100+survival.energy*5;const old=getNum(SURVIVAL_KEY),best=old===null||score>old;if(best)setNum(SURVIVAL_KEY,score);if(sResult)sResult.textContent=best?`🏆 New personal best: ${score} points — Wave ${survival.wave}.`:`Run ended at Wave ${survival.wave} — ${score} points.`;const sb=$("#score-survival");if(sb)sb.textContent=String(getNum(SURVIVAL_KEY)||score);renderSurvival();};
  const nextSurvivalWave=()=>{if(!survival.active)return;survival.wave++;const incoming=Math.max(4,10+survival.wave*2-survival.armor*2);const reduced=survival.speed?Math.ceil(incoming*.8):incoming;survival.hp-=Math.max(1,reduced);survival.energy+=3+survival.speed+(survival.wave%3===0?2:0);renderSurvival();if(sResult)sResult.textContent=`Wave ${survival.wave}: you took ${Math.max(1,reduced)} damage. Choose an upgrade.`;if(survival.hp<=0){finishSurvival();return;}showUpgrades();};
  if(sBtn)sBtn.addEventListener("click",()=>{if(survival.active)return;survival={hp:100,wave:0,energy:0,started:Date.now(),damage:0,speed:0,armor:0,active:true,interval:null,timer:null};sBtn.disabled=true;sResult.textContent="Survive the incoming waves.";renderSurvival();nextSurvivalWave();survival.timer=setInterval(renderSurvival,1000);survival.interval=setInterval(()=>{if(survival.active&&!sUp.classList.contains("hidden")){}},8000);});
  // Personal records for Stage B.
  const loadBests=()=>{const map=[["#score-precision",PRECISION_KEY],["#score-conquest",CONQUEST_KEY],["#score-pirate",PIRATE_KEY],["#score-survival",SURVIVAL_KEY]];map.forEach(([sel,key])=>{const el=$(sel),v=getNum(key);if(el&&v!==null)el.textContent=String(v);});}; loadBests();

});
