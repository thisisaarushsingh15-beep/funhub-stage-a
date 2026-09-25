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
  // Challenge + sharing system. Challenge data lives only in the URL; no account or server is required.
  const challengeGameNames={reaction:'Reaction Test',guess:'Number Guessing',memory:'Memory Challenge',precision:'Precision AI Range',conquest:'World Conquest',pirate:'Pirate Empire',survival:'Survival Outpost'};
  const challengeMetric={reaction:'ms',guess:'guesses',memory:'level',precision:'points',conquest:'territories',pirate:'score',survival:'waves'};
  const challengeBetter={reaction:'lower',guess:'lower',memory:'higher',precision:'higher',conquest:'higher',pirate:'higher',survival:'higher'};
  const challengeParam=()=>{try{const p=new URLSearchParams(location.search);if(!p.get('challengeGame')||!p.get('challengeScore'))return null;const game=p.get('challengeGame');const score=Number(p.get('challengeScore'));if(!challengeGameNames[game]||!Number.isFinite(score))return null;return {game,score}}catch{return null}};
  const makeChallengeUrl=(game,score)=>{const u=new URL('games.html',location.href);u.searchParams.set('challengeGame',game);u.searchParams.set('challengeScore',String(Math.round(score)));return u.href};
  const shareText=(game,score)=>{const metric=challengeMetric[game]||'score';return `I got ${Math.round(score)} ${metric} on ${challengeGameNames[game]} at FunHub. Can you beat me?`};
  const shareChallenge=async(game,score)=>{const url=makeChallengeUrl(game,score);const text=shareText(game,score);send('funhub_share_result',{game,method:navigator.share?'native':'copy'});try{if(navigator.share){await navigator.share({title:`FunHub ${challengeGameNames[game]} Challenge`,text,url});return true}}catch(e){if(e&&e.name==='AbortError')return false}try{await navigator.clipboard.writeText(`${text}
${url}`);alert('Challenge link copied! Send it to your friend.');return true}catch{prompt('Copy this challenge link:',url);return false}};
  const makeShareButton=(game,score,container)=>{if(!container||!Number.isFinite(Number(score)))return;let b=container.querySelector('[data-share-result]');if(!b){b=document.createElement('button');b.className='btn share-btn';b.type='button';b.setAttribute('data-share-result','');container.appendChild(b)}b.textContent='↗ Challenge a Friend';b.onclick=()=>shareChallenge(game,Number(score))};
  const renderChallengeBanner=()=>{const c=challengeParam();if(!c)return;const target=document.querySelector('main')||document.body;const old=document.getElementById('challenge-banner');if(old)old.remove();const el=document.createElement('section');el.id='challenge-banner';el.className='challenge-banner';const metric=challengeMetric[c.game]||'score';el.innerHTML=`<div><span class="eyebrow">FRIEND CHALLENGE</span><strong>Can you beat ${challengeGameNames[c.game]}?</strong><span>Your friend scored <b>${Math.round(c.score)} ${metric}</b>. ${challengeBetter[c.game]==='lower'?'Lower is better.':'Higher is better.'}</span></div><button class="btn primary" id="dismiss-challenge">Got it — play!</button>`;target.prepend(el);document.getElementById('dismiss-challenge')?.addEventListener('click',()=>el.remove());send('funhub_challenge_open',{game:c.game})};
  const challengeResult=(game,score)=>{const c=challengeParam();if(!c||c.game!==game)return '';const beat=challengeBetter[game]==='lower'?score<c.score:score>c.score;send('funhub_challenge_result',{game,score,beat});return beat?' 🎉 You beat the challenge!':score===c.score?' 🤝 You matched it!':' Keep going — try to beat your friend!'};
  const countPlays=()=>Number(safeGet('funhub_games_played')||0);
  const markPlay=(game)=>{safeSet('funhub_games_played',countPlays()+1);safeSet('funhub_last_game',game);send('funhub_game_start',{game});const e=$('games-played-count');if(e)e.textContent=countPlays()};
  const dateShift=(dateString,delta)=>{const d=new Date(dateString+'T00:00:00');d.setDate(d.getDate()+delta);return d.toISOString().slice(0,10)};
  const recordDaily=(game)=>{
    if(game!==dailyGame())return;
    const today=todayKey();
    if(safeGet('funhub_daily_completed')===today)return;
    const previous=safeGet('funhub_daily_completed');
    let streak=Number(safeGet('funhub_daily_streak')||0);
    if(previous===dateShift(today,-1)) streak+=1; else streak=1;
    const best=Math.max(streak,Number(safeGet('funhub_best_streak')||0));
    safeSet('funhub_daily_completed',today);
    safeSet('funhub_daily_streak',streak);
    safeSet('funhub_best_streak',best);
    send('funhub_daily_completed',{game,streak});
    updateStreakUI();
  };
  const updateStreakUI=()=>{
    const streak=Number(safeGet('funhub_daily_streak')||0),best=Number(safeGet('funhub_best_streak')||0),completed=safeGet('funhub_daily_completed')===todayKey();
    document.querySelectorAll('[data-streak-current]').forEach(e=>e.textContent=streak);
    document.querySelectorAll('[data-streak-best]').forEach(e=>e.textContent=best);
    document.querySelectorAll('[data-streak-status]').forEach(e=>e.textContent=completed?'✓ Today completed — streak protected.':'Complete today’s challenge to keep your streak alive.');
  };
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
  renderChallengeBanner();

  // Scores dashboard
  const scoreValue=(id)=>safeGet(keys[id])||'—';
  for(const id of Object.keys(keys)){const e=$('score-'+id),card=$(`${id}-card-best`);if(e)e.textContent=scoreValue(id);if(card)card.textContent=scoreValue(id)}
  const plays=$('games-played-count');if(plays)plays.textContent=countPlays();
  const reset=$('reset-scores');if(reset)reset.addEventListener('click',()=>{if(confirm('Reset all FunHub personal records on this device?')){Object.values(keys).forEach(k=>{try{localStorage.removeItem(k)}catch{}});location.reload()}});
  updateDailyUI();
  updateStreakUI();

  // Game filtering/search
  const cards=[...document.querySelectorAll('[data-game-card]')], search=$('game-search'), filters=[...document.querySelectorAll('.filter-btn')];let activeFilter='all';
  const filterGames=()=>{const q=(search?.value||'').trim().toLowerCase();let visible=0;cards.forEach(c=>{const okFilter=activeFilter==='all'||c.dataset.type===activeFilter;const okSearch=!q||c.textContent.toLowerCase().includes(q);const show=okFilter&&okSearch;c.style.display=show?'':'none';if(show)visible++});const empty=$('no-games');if(empty)empty.classList.toggle('hidden',visible!==0)};
  filters.forEach(f=>f.addEventListener('click',()=>{filters.forEach(x=>x.classList.remove('active'));f.classList.add('active');activeFilter=f.dataset.filter;filterGames();send('funhub_game_filter',{filter:activeFilter})}));
  if(search)search.addEventListener('input',filterGames);
  document.querySelectorAll('[data-game-link]').forEach(a=>a.addEventListener('click',()=>{markPlay(a.dataset.gameLink)}));

  // Reaction Test
  const rb=$('reaction-btn'),box=$('reaction-box'),rr=$('reaction-result');
  if(rb&&box){let state='idle',start=0,timer=0;const reset=()=>{state='idle';box.textContent='Press Start';box.className='reaction-box ready';rb.textContent='Start'};const finish=()=>{const ms=Date.now()-start;rr.textContent=`${ms} ms`+challengeResult('reaction',ms);const old=Number(safeGet(keys.reaction)||99999);makeShareButton('reaction',ms,rr.parentElement);if(ms<old){safeSet(keys.reaction,ms);send('funhub_new_record',{game:'reaction',score:ms});}recordDaily('reaction');const e=$('score-reaction'),c=$('reaction-card-best');if(e)e.textContent=Math.min(ms,old);if(c)c.textContent=Math.min(ms,old);reset()};rb.addEventListener('click',()=>{if(state==='waiting'){clearTimeout(timer);state='idle';box.textContent='Too soon!';box.className='reaction-box fail';rb.textContent='Try again';send('funhub_game_action',{game:'reaction',action:'too_soon'});return}if(state==='ready'){finish();return}state='waiting';box.textContent='Wait…';box.className='reaction-box waiting';rb.textContent='Wait…';markPlay('reaction');timer=setTimeout(()=>{state='ready';start=Date.now();box.textContent='TAP NOW';box.className='reaction-box go';rb.textContent='TAP!'},800+Math.random()*1800)});box.addEventListener('click',()=>rb.click())}

  // Number Guessing
  const gi=$('guess-input'),gb=$('guess-btn'),gr=$('guess-result'),gn=$('guess-reset');
  if(gi&&gb){let n=Math.floor(Math.random()*100)+1,tries=0,started=false;const resetGuess=()=>{n=Math.floor(Math.random()*100)+1;tries=0;started=false;gr.textContent='Start guessing.';gi.value=''};const check=()=>{const v=Number(gi.value);if(!Number.isInteger(v)||v<1||v>100){gr.textContent='Enter a whole number from 1 to 100.';return}if(!started){started=true;markPlay('guess')}tries++;if(v===n){gr.textContent=`Correct in ${tries} ${tries===1?'guess':'guesses'}!`+challengeResult('guess',tries);const old=Number(safeGet(keys.guess)||999);makeShareButton('guess',tries,gr.parentElement);if(tries<old){safeSet(keys.guess,tries);send('funhub_new_record',{game:'guess',score:tries})}recordDaily('guess');const e=$('score-guess'),c=$('guess-card-best');if(e)e.textContent=Math.min(tries,old);if(c)c.textContent=Math.min(tries,old)}else gr.textContent=v<n?'Too low.':'Too high.'};gb.addEventListener('click',check);gi.addEventListener('keydown',e=>{if(e.key==='Enter')check()});if(gn)gn.addEventListener('click',resetGuess)}

  // Memory Challenge
  const mb=$('memory-btn'),md=$('memory-sequence'),mi=$('memory-input'),mr=$('memory-result');
  if(mb&&md&&mi){
    let sequence='',level=0,accept=false,showTimer=null;
    const clearMemoryTimer=()=>{if(showTimer){clearTimeout(showTimer);showTimer=null}};
    const startMemory=()=>{clearMemoryTimer();level=1;sequence='';accept=false;mi.value='';mi.classList.add('hidden');mr.textContent='Watch the digits one by one…';mb.textContent='Check answer';markPlay('memory');nextRound()};
    const nextRound=()=>{
      clearMemoryTimer();
      sequence='';
      const length=level+2; // starts at 3 digits, then grows by one each level
      for(let i=0;i<length;i++) sequence+=Math.floor(Math.random()*10);
      accept=false;mi.value='';mi.classList.add('hidden');
      let i=0;
      const revealNext=()=>{
        if(i<sequence.length){
          md.textContent=sequence[i];
          i++;
          showTimer=setTimeout(revealNext,520);
        }else{
          md.textContent='••••••';
          showTimer=setTimeout(()=>{mi.classList.remove('hidden');mi.focus();accept=true;mr.textContent=`Enter the ${sequence.length}-digit sequence.`},650);
        }
      };
      revealNext();
    };
    mb.addEventListener('click',()=>{
      if(!accept&&level===0) startMemory();
      else if(!accept) return;
      else{
        const answer=mi.value.replace(/\s+/g,'');
        if(answer===sequence){
          const completed=level;
          level++;
          mr.textContent=`Correct! Level ${completed}. Next round: ${level+2} digits.`;
          recordDaily('memory');
          mb.textContent='Check answer';
          setTimeout(nextRound,650);
        }else{
          const best=Math.max(0,level-1),old=Number(safeGet(keys.memory)||0);
          if(best>old){safeSet(keys.memory,best);send('funhub_new_record',{game:'memory',score:best})}
          const e=$('score-memory'),c=$('memory-card-best');if(e)e.textContent=Math.max(best,old);if(c)c.textContent=Math.max(best,old);
          mr.textContent=`Game over. You reached level ${best}. The sequence was ${sequence}.`+challengeResult('memory',best);makeShareButton('memory',best,mr.parentElement);
          accept=false;clearMemoryTimer();mi.classList.add('hidden');level=0;md.textContent='Ready?';mb.textContent='Start challenge';
        }
      }
    });
  }

  const standaloneGame={
    'precision.html':{game:'precision',scoreId:'score'},
    'conquest.html':{game:'conquest',scoreId:null},
    'pirate.html':{game:'pirate',scoreId:null},
    'survival.html':{game:'survival',scoreId:'wave'}
  };
  const fileName=location.pathname.split('/').pop()||'index.html';
  const sg=standaloneGame[fileName];
  if(sg){
    const bar=document.querySelector('.game-topbar');
    if(bar){const b=document.createElement('button');b.className='icon-btn share-game-top';b.type='button';b.title='Share a challenge';b.textContent='↗';bar.insertBefore(b,bar.lastElementChild);b.addEventListener('click',()=>{
      let score=0;
      if(sg.scoreId){score=Number($(sg.scoreId)?.textContent||0)}
      else if(sg.game==='conquest'){score=Number((safeGet(keys.conquest)||0))}
      else if(sg.game==='pirate'){score=Number((safeGet(keys.pirate)||0))}
      if(!score){alert('Play a little first to create a score to share.');return}
      shareChallenge(sg.game,score);
    });}
  }

  // Generators
  const pick=(arr,n)=>{const copy=[...arr],out=[];while(copy.length&&out.length<n)out.push(copy.splice(Math.floor(Math.random()*copy.length),1)[0]);return out};
  const showOutputs=(el,items,type)=>{if(!el)return;el.innerHTML=items.map((x,i)=>`<div class="output-item"><span>${x.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span><button class="copy-btn" data-copy="${encodeURIComponent(x)}">Copy</button></div>`).join('');el.querySelectorAll('.copy-btn').forEach(b=>b.addEventListener('click',async()=>{const text=decodeURIComponent(b.dataset.copy);try{await navigator.clipboard.writeText(text);b.textContent='Copied!';setTimeout(()=>b.textContent='Copy',900)}catch{b.textContent='Select manually'}send('funhub_generator_copy',{generator:type})}));send('funhub_generator_result',{generator:type,count:items.length})};
  const usernameSets={cool:['Nova','Shadow','Orbit','Vortex','Echo','Lunar','Frost','Pixel'],gaming:['Byte','Rogue','Turbo','Clutch','Respawn','Quest','Aim','Loot'],minimal:['mono','north','plain','void','nox','moss','arc','zen'],fun:['Bouncy','Waffle','Noodle','Banana','Giggle','Mango','Panda','Jelly'],aesthetic:['Velvet','Bloom','Aurora','Sage','Opal','Solace','Muse','Dusk']};
  const userBtn=$('username-btn');if(userBtn)userBtn.addEventListener('click',()=>{const vibe=$('username-vibe').value,w=usernameSets[vibe],nums=['7','17','21','404','99','24','08',''];const out=pick(Array.from({length:12},(_,i)=>w[i%w.length]+(i%3===0?'':nums[i%nums.length])+(i%4===0?'_':'')),5);showOutputs($('username-output'),out,'username')});
  const nickBtn=$('nickname-btn');if(nickBtn)nickBtn.addEventListener('click',()=>{
    const raw=($('nickname-input').value||'').trim().replace(/[^a-zA-Z0-9]/g,'');
    if(!raw){showOutputs($('nickname-output'),['Enter a name first.'],'nickname');return}
    const n=raw[0].toUpperCase()+raw.slice(1).toLowerCase();
    const prefixes=['Lil','Big','Its','Hey','The','Mr','Captain','Crazy','Real','ItsJust'];
    const suffixes=['y','o','z','zy','ster','ito','bear','boss','boy','girl','king','queen','fox','spark','wave','vibe','pro','go','x','xo'];
    const patterns=[
      ()=>n.slice(0,Math.max(2,Math.ceil(n.length*0.55))),
      ()=>n.slice(0,Math.max(3,Math.ceil(n.length*0.7)))+'y',
      ()=>n.slice(0,Math.max(2,Math.ceil(n.length*0.5)))+'o',
      ()=>n+suffixes[Math.floor(Math.random()*suffixes.length)],
      ()=>suffixes[Math.floor(Math.random()*suffixes.length)]+n,
      ()=>prefixes[Math.floor(Math.random()*prefixes.length)]+n,
      ()=>n+Math.floor(10+Math.random()*90),
      ()=>n.slice(0,Math.max(2,Math.ceil(n.length*0.6)))+suffixes[Math.floor(Math.random()*suffixes.length)]
    ];
    const results=new Set();let attempts=0;
    while(results.size<5&&attempts<100){const value=patterns[Math.floor(Math.random()*patterns.length)]().replace(/\s+/g,'');results.add(value);attempts++}
    showOutputs($('nickname-output'),Array.from(results).slice(0,5),'nickname');
  });
  const bioSets={chill:['Taking it easy, one day at a time. 🌿','Good energy. Quiet goals.','Here for the moments that matter.','Low pressure, high vibes.','Just enjoying the ride.'],funny:['Professional snack finder.','Running on vibes and questionable ideas.','Currently buffering…','I came, I saw, I forgot why.','Part-time human, full-time legend.'],ambitious:['Building quietly. Growing daily.','Small steps. Big plans.','Discipline over excuses.','Learning today, creating tomorrow.','Focused on the next level.'],mysterious:['More to the story.','Offline, but never ordinary.','You know the surface.','Some things stay unexplained.','Read between the lines.'],creator:['Ideas in. Things out.','Creating more than consuming.','Making, learning, repeating.','One project at a time.','Building things for the internet.']};
  const bioBtn=$('bio-btn');if(bioBtn)bioBtn.addEventListener('click',()=>showOutputs($('bio-output'),pick(bioSets[$('bio-vibe').value],5),'bio'));

  // Personal dashboard (local device data only). Site-wide visitor data remains in GA4/Search Console.
  const dashPlays=$('dash-games-played');
  if(dashPlays)dashPlays.textContent=countPlays();
  const dashLast=$('dash-last-game');
  if(dashLast){const map={reaction:'Reaction Test',guess:'Number Guessing',memory:'Memory Challenge',precision:'Precision AI Range',conquest:'World Conquest',pirate:'Pirate Empire',survival:'Survival Outpost'};dashLast.textContent=map[safeGet('funhub_last_game')]||'—'}
  const dashStreak=$('dash-streak');if(dashStreak)dashStreak.textContent=Number(safeGet('funhub_daily_streak')||0);
  const dashBestStreak=$('dash-best-streak');if(dashBestStreak)dashBestStreak.textContent=Number(safeGet('funhub_best_streak')||0);
  const dashDaily=$('dash-daily-status');if(dashDaily)dashDaily.textContent=safeGet('funhub_daily_completed')===todayKey()?'Completed today':'Not completed today';
  const clearLocal=$('clear-local-stats');
  if(clearLocal)clearLocal.addEventListener('click',()=>{if(confirm('Clear FunHub stats saved on this device?')){['funhub_games_played','funhub_last_game','funhub_daily_completed','funhub_daily_streak','funhub_best_streak'].forEach(k=>{try{localStorage.removeItem(k)}catch{}});Object.values(keys).forEach(k=>{try{localStorage.removeItem(k)}catch{}});location.reload()}});

  // Generic interaction analytics. Do not send field values.
  document.querySelectorAll('a.btn,button.btn').forEach(el=>el.addEventListener('click',()=>{const label=(el.textContent||'').trim().slice(0,40);send('funhub_navigation',{label})}));
  document.querySelectorAll('input,select').forEach(el=>el.addEventListener('change',()=>{send('funhub_tool_action',{tool:el.id||'input',action:'change'})}));

  // Calculator actions (values are intentionally not sent to analytics)
  const ageBtn=$('age-btn');if(ageBtn)ageBtn.addEventListener('click',()=>{const dob=$('dob').value,r=$('age-result');if(!dob){r.textContent='Choose your date of birth.';return}const birth=new Date(dob+'T00:00:00'),now=new Date();if(birth>now){r.textContent='Date of birth cannot be in the future.';return}let y=now.getFullYear()-birth.getFullYear(),m=now.getMonth()-birth.getMonth(),d=now.getDate()-birth.getDate();if(d<0){m--;d+=new Date(now.getFullYear(),now.getMonth(),0).getDate()}if(m<0){y--;m+=12}r.textContent=`You are ${y} years, ${m} months and ${d} days old.`;send('funhub_tool_action',{tool:'age_calculator',action:'calculate'})});
  const percentBtn=$('percent-btn');if(percentBtn)percentBtn.addEventListener('click',()=>{const a=Number($('percent-part').value),b=Number($('percent-total').value),r=$('percent-result');if(!Number.isFinite(a)||!Number.isFinite(b)||b===0){r.textContent='Enter valid numbers and make sure Total is not zero.';return}r.textContent=`${(a/b*100).toFixed(2)}%`;send('funhub_tool_action',{tool:'percentage_calculator',action:'calculate'})});
  const dateBtn=$('date-btn');if(dateBtn)dateBtn.addEventListener('click',()=>{const a=$('date-one').value,b=$('date-two').value,r=$('date-result');if(!a||!b){r.textContent='Choose both dates.';return}const days=Math.round(Math.abs(new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/86400000);r.textContent=`${days} day${days===1?'':'s'} between the dates.`;send('funhub_tool_action',{tool:'date_calculator',action:'calculate'})});
})();
