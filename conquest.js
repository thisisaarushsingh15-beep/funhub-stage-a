(() => {
const c=document.getElementById('worldMap'),ctx=c.getContext('2d');
const names=['Alaska','Canada','USA','Mexico','Brazil','Argentina','Greenland','UK','France','Germany','Spain','Italy','Scandinavia','Russia','North Africa','Egypt','West Africa','East Africa','South Africa','India','China','Japan','Siberia','SE Asia','Australia','New Zealand','Persia','Arabia','Turkey','Central Asia'];
const pos=[[100,120],[180,165],[180,255],[145,340],[245,405],[225,495],[290,75],[455,150],[480,235],[555,210],[450,320],[555,330],[585,105],[710,145],[425,400],[555,400],[350,455],[530,470],[540,535],[675,380],[785,330],[900,270],[820,150],[850,400],[865,505],[950,540],[680,420],[650,475],[610,275],[700,250]];
const adj=[[1,2,6],[0,2,6],[0,1,3,4,7],[2,4,10,14],[2,3,5,14,16],[4,18],[0,1,7,12],[6,8,9,10,12],[7,9,10,14],[7,8,10,13,28,29],[3,4,7,8,9,14],[9,13,14,27,28],[6,7,13],[9,11,12,22,28,29],[3,4,10,11,15,16],[11,14,17,19,27],[4,14,17,18],[15,16,18,19,27],[5,16,17,19,24,25],[15,17,18,20,26,27],[19,22,23,29,26],[20,22,23],[13,20,21,23,29],[20,21,22,24],[18,23,25],[18,24],[19,20,27,28],[11,15,19,26,28,29],[9,13,27,29],[13,20,27,28]];
let owner,army,gold,inf,turn,selected=null,gameOver=false;
function reset(){owner=Array(30).fill('neutral');army=Array(30).fill(12);[2,8,19].forEach(i=>owner[i]='player');army[2]=22;army[8]=16;army[19]=14;[13,20,21,22,28,29].forEach(i=>owner[i]='ai');army[13]=24;army[20]=28;army[21]=18;army[22]=20;army[28]=16;army[29]=15;gold=180;inf=50;turn=1;selected=null;gameOver=false;feed('Campaign started. Secure your region and expand carefully.');render();}
function feed(s){const el=document.getElementById('feed');el.innerHTML=`<div>${s}</div>`+el.innerHTML;el.innerHTML=el.innerHTML.split('</div>').slice(0,6).join('</div>')+(el.innerHTML.includes('</div>')?'':'');}
function render(){document.getElementById('turn').textContent=`${turn} / 30`;document.getElementById('territories').textContent=owner.filter(x=>x==='player').length;document.getElementById('army').textContent=army.filter((_,i)=>owner[i]==='player').reduce((a,b)=>a+b,0);document.getElementById('gold').textContent=gold;document.getElementById('influence').textContent=inf;draw();updateInfo();}
function draw(){
  const sx=c.width/1000, sy=c.height/560;
  ctx.clearRect(0,0,c.width,c.height);
  ctx.save(); ctx.scale(sx,sy);
  ctx.fillStyle='#08111c'; ctx.fillRect(0,0,1000,560);
  // Ocean grid
  ctx.strokeStyle='rgba(160,190,220,.055)'; ctx.lineWidth=1;
  for(let x=0;x<1000;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,560);ctx.stroke()}
  for(let y=0;y<560;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1000,y);ctx.stroke()}
  // Stylized continents: deliberately simplified for gameplay, not geographic data.
  const continents=[
    [[70,105],[115,72],[205,75],[255,120],[245,185],[205,205],[185,270],[145,300],[105,270],[90,215],[55,185]],
    [[175,300],[245,315],[285,370],[300,445],[265,505],[215,480],[195,425],[155,380]],
    [[405,95],[475,62],[565,68],[625,105],[655,165],[620,220],[560,235],[520,205],[465,220],[420,180]],
    [[445,230],[515,245],[550,300],[525,365],[470,405],[415,375],[395,315]],
    [[570,250],[645,230],[730,245],[785,300],[770,360],[710,380],[650,350],[605,315]],
    [[675,380],[760,365],[850,390],[915,440],[900,505],[820,520],[750,485],[705,445]],
    [[840,120],[920,135],[970,180],[950,250],[885,270],[830,220]],
    [[760,485],[820,490],[855,530],[800,550],[750,525]]
  ];
  continents.forEach(poly=>{ctx.beginPath();ctx.moveTo(poly[0][0],poly[0][1]);poly.slice(1).forEach(p=>ctx.lineTo(p[0],p[1]));ctx.closePath();ctx.fillStyle='rgba(71,112,76,.34)';ctx.fill();ctx.strokeStyle='rgba(137,180,120,.18)';ctx.lineWidth=2;ctx.stroke();});
  // Territory connections
  adj.forEach((list,i)=>list.forEach(j=>{if(j>i){ctx.strokeStyle='rgba(220,230,240,.13)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(pos[i][0],pos[i][1]);ctx.lineTo(pos[j][0],pos[j][1]);ctx.stroke()}}));
  // Territories
  for(let i=0;i<30;i++){
    const [x,y]=pos[i], r=owner[i]==='player'?24:owner[i]==='ai'?22:20;
    const attackable=selected!==null && owner[i]!=='player' && adj[selected]?.includes(i) && owner[selected]==='player';
    if(attackable){ctx.beginPath();ctx.arc(x,y,r+8,0,Math.PI*2);ctx.fillStyle='rgba(255,190,80,.18)';ctx.fill();ctx.strokeStyle='#ffc86b';ctx.lineWidth=2;ctx.stroke();}
    ctx.beginPath();ctx.fillStyle=owner[i]==='player'?'#7657d9':owner[i]==='ai'?'#a44f63':'#536071';ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    if(selected===i){ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.stroke();}
    ctx.fillStyle='#fff';ctx.font='11px Inter, sans-serif';ctx.textAlign='center';ctx.fillText(names[i],x,y+r+14);ctx.font='bold 11px Inter, sans-serif';ctx.fillText(army[i],x,y+4);
  }
  ctx.fillStyle='rgba(255,255,255,.55)';ctx.font='11px Inter, sans-serif';ctx.textAlign='left';ctx.fillText('YOU',24,28);ctx.fillStyle='#7657d9';ctx.fillRect(50,19,10,10);ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillText('AI',78,28);ctx.fillStyle='#a44f63';ctx.fillRect(96,19,10,10);ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillText('NEUTRAL',124,28);ctx.fillStyle='#536071';ctx.fillRect(178,19,10,10);
  ctx.restore();
}
function updateInfo(){const info=document.getElementById('selectedInfo'),a=document.getElementById('attackBtn'),r=document.getElementById('reinforceBtn');if(selected===null){info.innerHTML='Select a territory to inspect it.';a.disabled=r.disabled=true;return}info.innerHTML=`<strong>${names[selected]}</strong><br>Owner: ${owner[selected]}<br>Army: ${army[selected]}<br>Neighbours: ${adj[selected].length}`;a.disabled=!(owner[selected]==='neutral'||owner[selected]==='ai')||!canAttack();r.disabled=owner[selected]!=='player';}
function canAttack(){return selected!==null&&adj[selected].some(i=>owner[i]==='player')&&army[selected]>0;}
function attack(){if(!canAttack()||gold<15)return feed('Need an adjacent friendly territory and 15 gold to launch an attack.');const targets=adj[selected].filter(i=>owner[i]==='player');const src=targets[Math.floor(Math.random()*targets.length)];const power=army[src]+Math.floor(Math.random()*16)+inf/10;const defense=army[selected]+Math.floor(Math.random()*20);gold-=15;if(power>defense){owner[selected]='player';army[selected]=Math.max(6,Math.floor(army[src]*.45));army[src]=Math.max(6,army[src]-Math.floor(army[selected]*.25));inf=Math.min(100,inf+4);feed(`You captured ${names[selected]} from ${names[src]}.`);}else{army[src]=Math.max(3,army[src]-8);inf=Math.max(0,inf-2);feed(`The attack on ${names[selected]} failed. Your forces fell back.`);}render();checkEnd();}
function reinforce(){if(selected===null||owner[selected]!=='player')return;if(gold<20)return feed('You need 20 gold to reinforce.');gold-=20;army[selected]+=10;feed(`${names[selected]} received 10 reinforcements.`);render();}
function diplomacy(){if(gold<30)return feed('You need 30 gold for a diplomatic mission.');gold-=30;inf=Math.min(100,inf+8);const n=adj.findIndex((list,i)=>owner[i]==='neutral'&&list.some(j=>owner[j]==='player'));if(n>=0){owner[n]='player';army[n]=8;feed(`Diplomacy brought ${names[n]} into your sphere.`);}else feed('Diplomatic mission increased your influence.');render();checkEnd();}
function aiTurn(){for(let k=0;k<2;k++){const ai=owner.map((x,i)=>x==='ai'?i:-1).filter(i=>i>=0);if(!ai.length)break;const src=ai[Math.floor(Math.random()*ai.length)];const targets=adj[src].filter(i=>owner[i]!=='ai');if(!targets.length)continue;const t=targets[Math.floor(Math.random()*targets.length)];const power=army[src]+Math.random()*15,def=army[t]+Math.random()*18;if(power>def&&Math.random()<.55){owner[t]='ai';army[t]=Math.max(5,Math.floor(army[src]*.35));feed(`Enemy forces captured ${names[t]}.`);}else army[src]=Math.max(4,army[src]-4);}}
function endTurn(){if(gameOver)return;gold+=owner.filter(x=>x==='player').length*12;inf=Math.max(0,inf-1);aiTurn();turn++;if(turn>30){gameOver=true;feed('Campaign complete. Start a new campaign to play again.');document.getElementById('endTurnBtn').disabled=true;}checkEnd();render();}
function checkEnd(){if(owner.every(x=>x==='player')){gameOver=true;feed('You unified the world. Campaign victory!');}else if(owner.filter(x=>x==='player').length===0){gameOver=true;feed('Your empire has fallen. Start a new campaign.');}document.getElementById('endTurnBtn').disabled=gameOver;}
c.addEventListener('click',e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)*1000/r.width,y=(e.clientY-r.top)*560/r.height;let hit=null;pos.forEach((p,i)=>{if(Math.hypot(x-p[0],y-p[1])<30)hit=i});if(hit!==null){selected=hit;render();}});
document.getElementById('newGame').onclick=reset;document.getElementById('attackBtn').onclick=attack;document.getElementById('reinforceBtn').onclick=reinforce;document.getElementById('diplomacyBtn').onclick=diplomacy;document.getElementById('endTurnBtn').onclick=endTurn;reset();
})();
