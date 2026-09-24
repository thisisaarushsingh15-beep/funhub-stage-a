(()=>{
  'use strict';
  const keys={reaction:'funhub_best_reaction',guess:'funhub_best_guess',memory:'funhub_best_memory',precision:'funhub_best_precision',conquest:'funhub_best_conquest',pirate:'funhub_best_pirate',survival:'funhub_best_survival'};
  const dailyGames=['reaction','guess','memory'];
  const $=id=>document.getElementById(id);
  const safeGet=k=>{try{return localStorage.getItem(k)}catch{return null}};
  const safeSet=(k,v)=>{try{localStorage.setItem(k,String(v))}catch{}};
  const todayKey=()=>new Date().toISOString().slice(0,10);
  const dayIndex=()=>{const s=todayKey().replace(/-/g,'');return Number(s)%dailyGames.length};
  const dailyGame=()=>dailyGames[dayIndex()];
  const send=(name,params={})=>{if(typeof window.gtag==='function'){window.gtag('event',name,params)}};
  const countPlays=()=>Number(safeGet('funhub_games_played')||0);
  const markPlay=(game)=>{safeSet('funhub_games_played',countPlays()+1);safeSet('funhub_last_game',game);send('funhub_game_start',{game});const e=$('games-played-count');if(e)e.textContent=countPlays()};
  const recordDaily=(game)=>{if(game===dailyGame())safeSet('funhub_daily_completed',todayKey())};
  const updateDailyUI=()=>{
    const game=dailyGame();const names={reaction:'Reaction Test',guess:'Number Guessing',memory:'Memory Challenge'};const desc={reaction:'Beat the clock and set your fastest reaction.',guess:'Find today\'s hidden number in as few guesses as possible.',memory:'Remember the sequence and reach the highest level you can.'};
    const title=$('daily-title'),d=$('daily-description'),b=$('daily-btn'),s=$('daily-status');
    if(title)title.textContent=names[game];if(d)d.textContent=desc[game];if(b)b.href=`games.html#${game}`;
    if(s)s.textContent=safeGet('funhub_daily_completed')===todayKey()?'✓ Completed today — come back tomorrow for a new challenge.':'A new challenge rotates every day.';
    const note=$('daily-game-note');if(note){note.innerHTML=`<div><span class="eyebrow">TODAY'S CHALLENGE</span><strong>${names[game]}</strong><span>${desc[game]}</span></div><a class="btn secondary" href="#${game}">Play today →</a>`}
  };

  // Mobile navigation
  const menu=$('.menu-btn'),nav=document.querySelector('.nav');
  if(menu&&nav){menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open))})}

  // Scores dashboard
  const scoreValue=(id)=>safeGet(keys[id])||'—';
  for(const id of Object.keys(keys)){const e=$('score-'+id),card=$(`${id}-card-best`);if(e)e.textContent=scoreValue(id);if(card)card.textContent=scoreValue(id)}
  const plays=$('games-played-count');if(plays)plays.textContent=countPlays();
  const reset=$('reset-scores');if(reset)reset.addEventListener('click',()=>{if(confirm('Reset all FunHub personal records on this device?')){Object.values(keys).forEach(k=>{try{localStorage.removeItem(k)}catch{}});location.reload()}});
  updateDailyUI();

  // Game filtering/search
  const cards=[...document.querySelectorAll('[data-game-card]')], search=$('game-search'), filters=[...document.querySelectorAll('.filter-btn')];let activeFilter='all';
  const filterGames=()=>{const q=(search?.value||'').trim().toLowerCase();let visible=0;cards.forEach(c=>{const okFilter=activeFilter==='all'||c.dataset.type===activeFilter;const okSearch=!q||c.textContent.toLowerCase().includes(q);const show=okFilter&&okSearch;c.style.display=show?'':'none';if(show)visible++});const empty=$('no-games');if(empty)empty.classList.toggle('hidden',visible!==0)};
  filters.forEach(f=>f.addEventListener('click',()=>{filters.forEach(x=>x.classList.remove('active'));f.classList.add('active');activeFilter=f.dataset.filter;filterGames();send('funhub_game_filter',{filter:activeFilter})}));
  if(search)search.addEventListener('input',filterGames);
  document.querySelectorAll('[data-game-link]').forEach(a=>a.addEventListener('click',()=>{markPlay(a.dataset.gameLink)}));

  // Reaction Test
  const rb=$('reaction-btn'),box=$('reaction-box'),rr=$('reaction-result');
  if(rb&&box){let state='idle',start=0,timer=0;const reset=()=>{state='idle';box.textContent='Press Start';box.className='reaction-box ready';rb.textContent='Start'};const finish=()=>{const ms=Date.now()-start;rr.textContent=`${ms} ms`;const old=Number(safeGet(keys.reaction)||99999);if(ms<old){safeSet(keys.reaction,ms);send('funhub_new_record',{game:'reaction',score:ms});}recordDaily('reaction');const e=$('score-reaction'),c=$('reaction-card-best');if(e)e.textContent=Math.min(ms,old);if(c)c.textContent=Math.min(ms,old);reset()};rb.addEventListener('click',()=>{if(state==='waiting'){clearTimeout(timer);state='idle';box.textContent='Too soon!';box.className='reaction-box fail';rb.textContent='Try again';send('funhub_game_action',{game:'reaction',action:'too_soon'});return}if(state==='ready'){finish();return}state='waiting';box.textContent='Wait…';box.className='reaction-box waiting';rb.textContent='Wait…';markPlay('reaction');timer=setTimeout(()=>{state='ready';start=Date.now();box.textContent='TAP NOW';box.className='reaction-box go';rb.textContent='TAP!'},800+Math.random()*1800)});box.addEventListener('click',()=>rb.click())}

  // Number Guessing
  const gi=$('guess-input'),gb=$('guess-btn'),gr=$('guess-result'),gn=$('guess-reset');
  if(gi&&gb){let n=Math.floor(Math.random()*100)+1,tries=0,started=false;const resetGuess=()=>{n=Math.floor(Math.random()*100)+1;tries=0;started=false;gr.textContent='Start guessing.';gi.value=''};const check=()=>{const v=Number(gi.value);if(!Number.isInteger(v)||v<1||v>100){gr.textContent='Enter a whole number from 1 to 100.';return}if(!started){started=true;markPlay('guess')}tries++;if(v===n){gr.textContent=`Correct in ${tries} ${tries===1?'guess':'guesses'}!`;const old=Number(safeGet(keys.guess)||999);if(tries<old){safeSet(keys.guess,tries);send('funhub_new_record',{game:'guess',score:tries})}recordDaily('guess');const e=$('score-guess'),c=$('guess-card-best');if(e)e.textContent=Math.min(tries,old);if(c)c.textContent=Math.min(tries,old)}else gr.textContent=v<n?'Too low.':'Too high.'};gb.addEventListener('click',check);gi.addEventListener('keydown',e=>{if(e.key==='Enter')check()});if(gn)gn.addEventListener('click',resetGuess)}

  // Memory Challenge
  const mb=$('memory-btn'),md=$('memory-sequence'),mi=$('memory-input'),mr=$('memory-result');
  if(mb&&md&&mi){let sequence='',level=0,accept=false;const startMemory=()=>{level=1;sequence='';accept=false;mi.value='';mi.classList.add('hidden');mr.textContent='Watch carefully…';mb.textContent='Check answer';markPlay('memory');nextRound()};const nextRound=()=>{sequence+=Math.floor(Math.random()*10);accept=false;md.textContent=sequence;setTimeout(()=>{md.textContent='•••••';mi.classList.remove('hidden');mi.focus();accept=true},Math.max(850,650+sequence.length*120))};mb.addEventListener('click',()=>{if(!accept&&level===0)startMemory();else if(!accept){return}else{const answer=mi.value.replace(/\s+/g,'');if(answer===sequence){level++;mr.textContent=`Correct! Level ${level-1}.`;recordDaily('memory');mb.textContent='Check answer';setTimeout(nextRound,450)}else{const best=Math.max(0,level-1),old=Number(safeGet(keys.memory)||0);if(best>old){safeSet(keys.memory,best);send('funhub_new_record',{game:'memory',score:best})}const e=$('score-memory'),c=$('memory-card-best');if(e)e.textContent=Math.max(best,old);if(c)c.textContent=Math.max(best,old);mr.textContent=`Game over. You reached level ${best}.`;accept=false;mi.classList.add('hidden');level=0;md.textContent='Ready?';mb.textContent='Start challenge'}}});}

  // Generators
  const pick=(arr,n)=>{const copy=[...arr],out=[];while(copy.length&&out.length<n)out.push(copy.splice(Math.floor(Math.random()*copy.length),1)[0]);return out};
  const showOutputs=(el,items,type)=>{if(!el)return;el.innerHTML=items.map((x,i)=>`<div class="output-item"><span>${x.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span><button class="copy-btn" data-copy="${encodeURIComponent(x)}">Copy</button></div>`).join('');el.querySelectorAll('.copy-btn').forEach(b=>b.addEventListener('click',async()=>{const text=decodeURIComponent(b.dataset.copy);try{await navigator.clipboard.writeText(text);b.textContent='Copied!';setTimeout(()=>b.textContent='Copy',900)}catch{b.textContent='Select manually'}send('funhub_generator_copy',{generator:type})}));send('funhub_generator_result',{generator:type,count:items.length})};
  const usernameSets={cool:['Nova','Shadow','Orbit','Vortex','Echo','Lunar','Frost','Pixel'],gaming:['Byte','Rogue','Turbo','Clutch','Respawn','Quest','Aim','Loot'],minimal:['mono','north','plain','void','nox','moss','arc','zen'],fun:['Bouncy','Waffle','Noodle','Banana','Giggle','Mango','Panda','Jelly'],aesthetic:['Velvet','Bloom','Aurora','Sage','Opal','Solace','Muse','Dusk']};
  const userBtn=$('username-btn');if(userBtn)userBtn.addEventListener('click',()=>{const vibe=$('username-vibe').value,w=usernameSets[vibe],nums=['7','17','21','404','99','24','08',''];const out=pick(Array.from({length:12},(_,i)=>w[i%w.length]+(i%3===0?'':nums[i%nums.length])+(i%4===0?'_':'')),5);showOutputs($('username-output'),out,'username')});
  const nickBtn=$('nickname-btn');if(nickBtn)nickBtn.addEventListener('click',()=>{const raw=($('nickname-input').value||'').trim().replace(/[^a-zA-Z0-9]/g,'');if(!raw){showOutputs($('nickname-output'),['Enter a name first.'],'nickname');return}const n=raw[0].toUpperCase()+raw.slice(1).toLowerCase(),variants=[n.slice(0,4),n.slice(0,3)+'y',n+'o',n+'ster','The'+n];showOutputs($('nickname-output'),[...new Set(variants)].slice(0,5),'nickname')});
  const bioSets={chill:['Taking it easy, one day at a time. 🌿','Good energy. Quiet goals.','Here for the moments that matter.','Low pressure, high vibes.','Just enjoying the ride.'],funny:['Professional snack finder.','Running on vibes and questionable ideas.','Currently buffering…','I came, I saw, I forgot why.','Part-time human, full-time legend.'],ambitious:['Building quietly. Growing daily.','Small steps. Big plans.','Discipline over excuses.','Learning today, creating tomorrow.','Focused on the next level.'],mysterious:['More to the story.','Offline, but never ordinary.','You know the surface.','Some things stay unexplained.','Read between the lines.'],creator:['Ideas in. Things out.','Creating more than consuming.','Making, learning, repeating.','One project at a time.','Building things for the internet.']};
  const bioBtn=$('bio-btn');if(bioBtn)bioBtn.addEventListener('click',()=>showOutputs($('bio-output'),pick(bioSets[$('bio-vibe').value],5),'bio'));

  // Generic interaction analytics. Do not send field values.
  document.querySelectorAll('a.btn,button.btn').forEach(el=>el.addEventListener('click',()=>{const label=(el.textContent||'').trim().slice(0,40);send('funhub_navigation',{label})}));
  document.querySelectorAll('input,select').forEach(el=>el.addEventListener('change',()=>{send('funhub_tool_action',{tool:el.id||'input',action:'change'})}));

  // Calculator actions (values are intentionally not sent to analytics)
  const ageBtn=$('age-btn');if(ageBtn)ageBtn.addEventListener('click',()=>{const dob=$('dob').value,r=$('age-result');if(!dob){r.textContent='Choose your date of birth.';return}const birth=new Date(dob+'T00:00:00'),now=new Date();if(birth>now){r.textContent='Date of birth cannot be in the future.';return}let y=now.getFullYear()-birth.getFullYear(),m=now.getMonth()-birth.getMonth(),d=now.getDate()-birth.getDate();if(d<0){m--;d+=new Date(now.getFullYear(),now.getMonth(),0).getDate()}if(m<0){y--;m+=12}r.textContent=`You are ${y} years, ${m} months and ${d} days old.`;send('funhub_tool_action',{tool:'age_calculator',action:'calculate'})});
  const percentBtn=$('percent-btn');if(percentBtn)percentBtn.addEventListener('click',()=>{const a=Number($('percent-part').value),b=Number($('percent-total').value),r=$('percent-result');if(!Number.isFinite(a)||!Number.isFinite(b)||b===0){r.textContent='Enter valid numbers and make sure Total is not zero.';return}r.textContent=`${(a/b*100).toFixed(2)}%`;send('funhub_tool_action',{tool:'percentage_calculator',action:'calculate'})});
  const dateBtn=$('date-btn');if(dateBtn)dateBtn.addEventListener('click',()=>{const a=$('date-one').value,b=$('date-two').value,r=$('date-result');if(!a||!b){r.textContent='Choose both dates.';return}const days=Math.round(Math.abs(new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/86400000);r.textContent=`${days} day${days===1?'':'s'} between the dates.`;send('funhub_tool_action',{tool:'date_calculator',action:'calculate'})});
})();
