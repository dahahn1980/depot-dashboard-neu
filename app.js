
const COLORS={coral:"#ff6b57",violet:"#7b61ff",cyan:"#00a9b7",amber:"#e3a520",lime:"#7dbf19",blue:"#2d5bff",rose:"#d95f76",navy:"#17233f"};
const eur=v=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(v);
const pct=v=>new Intl.NumberFormat("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2}).format(v)+" %";
const latest=D.depot.at(-1),start=D.depot[0],high=Math.max(...D.depot),low=Math.min(...D.depot);
const allSeries={...D.core,...D.savings};

function rangeSlice(range){
  const n=range==="1m"?4:range==="3m"?10:D.depot.length;
  return {labels:D.dates.slice(-n),values:D.depot.slice(-n),offset:D.depot.length-Math.min(n,D.depot.length)};
}
function lineChart(id,labels,values,onPoint){
  const svg=document.getElementById(id),W=1200,H=520,p={l:70,r:20,t:30,b:48};
  const lo=Math.min(...values),hi=Math.max(...values),pad=(hi-lo)*.12||1;
  const min=lo-pad,max=hi+pad,x=i=>p.l+i*(W-p.l-p.r)/Math.max(1,labels.length-1),y=v=>p.t+(max-v)*(H-p.t-p.b)/(max-min);
  let out="";
  for(let i=0;i<5;i++){const val=min+i*(max-min)/4,yy=y(val);out+=`<line x1="${p.l}" y1="${yy}" x2="${W-p.r}" y2="${yy}" stroke="#d8d3c8"/><text x="${p.l-10}" y="${yy+4}" text-anchor="end" font-size="11" fill="#67645f">${Math.round(val/1000)}k</text>`}
  labels.forEach((d,i)=>{if(i===0||i===labels.length-1||i%3===0)out+=`<text x="${x(i)}" y="${H-16}" text-anchor="middle" font-size="11" fill="#67645f">${d}</text>`});
  const pts=values.map((v,i)=>`${x(i)},${y(v)}`).join(" ");
  out+=`<polyline points="${pts}" fill="none" stroke="#101010" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
  values.forEach((v,i)=>{out+=`<circle class="hit" data-i="${i}" cx="${x(i)}" cy="${y(v)}" r="12" fill="transparent"/><circle cx="${x(i)}" cy="${y(v)}" r="4" fill="#c9ff3b" stroke="#101010" stroke-width="2"/>`});
  svg.innerHTML=out;
  svg.querySelectorAll(".hit").forEach(el=>el.onclick=()=>onPoint(+el.dataset.i));
}
function spark(values,color){
  const W=300,H=86,p=4,lo=Math.min(...values),hi=Math.max(...values),x=i=>p+i*(W-2*p)/Math.max(1,values.length-1),y=v=>p+(hi-v)*(H-2*p)/((hi-lo)||1);
  return `<svg class="spark" viewBox="0 0 ${W} ${H}"><polyline points="${values.map((v,i)=>`${x(i)},${y(v)}`).join(" ")}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

document.getElementById("heroValue").textContent=eur(latest);
const totalDelta=latest-start,totalPct=(latest/start-1)*100;
const heroDelta=document.getElementById("heroDelta");
heroDelta.textContent=`${totalDelta>=0?"+":""}${eur(totalDelta)} · ${totalPct>=0?"+":""}${pct(totalPct)}`;
heroDelta.classList.add(totalDelta>=0?"pos":"neg");
document.getElementById("heroDate").textContent=D.meta.lastUpdate;
document.getElementById("heroPoints").textContent=D.depot.length;

let range="all";
function drawHero(){
  const r=rangeSlice(range);
  lineChart("heroChart",r.labels,r.values,(i)=>{
    const gi=r.offset+i,v=r.values[i],prev=gi>0?D.depot[gi-1]:null;
    const readout=document.getElementById("chartReadout");
    const values=[D.fullDates[gi],eur(v),prev===null?"–":eur(v-prev),pct((v/start-1)*100)];
    [...readout.children].forEach((el,idx)=>el.querySelector("strong").textContent=values[idx]);
  });
}
drawHero();
document.querySelectorAll("#periodSwitch button").forEach(b=>b.onclick=()=>{
  range=b.dataset.range;
  b.parentElement.querySelectorAll("button").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
  drawHero();
});

const lastDelta=latest-D.depot.at(-2);
document.getElementById("metricRibbon").innerHTML=[
  ["Seit Start",eur(totalDelta),pct(totalPct)],
  ["Letzte Veränderung",eur(lastDelta),pct((latest/D.depot.at(-2)-1)*100)],
  ["Abstand zum Hoch",eur(latest-high),pct((latest/high-1)*100)],
  ["Erholung seit Tief",eur(latest-low),pct((latest/low-1)*100)]
].map(x=>`<div class="ribbon-item"><span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></div>`).join("");

const catTotal=D.categories.reduce((a,b)=>a+b.value,0);
document.getElementById("allocationBars").innerHTML=D.categories.map((c,i)=>{
  const share=c.value/catTotal*100;
  const colors=["#17233f","#7b61ff","#2d5bff","#ff6b57"];
  return `<div class="allocation-row"><div class="name">${c.name}</div><div class="allocation-track"><div class="allocation-fill" style="width:${share}%;background:${colors[i]}"></div></div><div class="value">${pct(share)}</div></div>`;
}).join("");

const weekly=Object.entries(allSeries).map(([name,arr])=>({name,change:arr.at(-1)-arr.at(-2)})).sort((a,b)=>b.change-a.change);
document.getElementById("weeklyPulse").innerHTML=[...weekly.slice(0,2),...weekly.slice(-2)].map((r,i)=>{
  const pos=r.change>=0,color=pos?`rgba(16,126,76,${.55+i*.1})`:`rgba(183,45,52,${.55+i*.1})`;
  return `<div class="pulse-card" style="background:${color}" data-name="${r.name}"><strong>${r.name}</strong><span>${r.change>=0?"+":""}${eur(r.change)}</span></div>`;
}).join("");
document.querySelectorAll(".pulse-card").forEach(el=>el.onclick=()=>openDetail(el.dataset.name));

document.getElementById("holdingGrid").innerHTML=D.positions.map((p,i)=>{
  const arr=allSeries[p.name],color=COLORS[p.tone];
  return `<article class="holding-card" data-name="${p.name}">
    <div>
      <div class="holding-top"><div><h3>${p.name}</h3><div class="sub">${p.label} · ${p.wkn}</div></div><div class="holding-index" style="background:${color};color:white">${String(i+1).padStart(2,"0")}</div></div>
      ${spark(arr,color)}
    </div>
    <div>
      <div class="holding-value">${eur(p.value)}</div>
      <div class="holding-footer"><span>${p.cat}</span><strong class="${p.perf>=0?"pos":"neg"}">${p.perf>=0?"+":""}${pct(p.perf)}</strong></div>
    </div>
  </article>`;
}).join("");
document.querySelectorAll(".holding-card").forEach(el=>el.onclick=()=>openDetail(el.dataset.name));

function openDetail(name){
  const p=D.positions.find(x=>x.name===name),arr=allSeries[name],peak=Math.max(...arr),trough=Math.min(...arr),weekly=arr.at(-1)-arr.at(-2),month=arr.at(-1)-arr[Math.max(0,arr.length-4)];
  const detail=document.getElementById("detailContent");
  const stats=[
    ["Aktueller Wert",eur(p.value)],["Investiert",eur(p.invested)],["Gewinn / Verlust",eur(p.pl)],["Performance",pct(p.perf)],
    ["Letzte Veränderung",eur(weekly)],["Ca. 1 Monat",eur(month)],["Abstand zum Hoch",pct((p.value/peak-1)*100)],["Bisheriges Tief",eur(trough)]
  ];
  if(p.quantity)stats.push(["Stückzahl",String(p.quantity)]);
  if(p.buyPrice)stats.push(["Kaufkurs",eur(p.buyPrice)]);
  detail.innerHTML=`<div class="kicker" style="color:#c9ff3b">${p.label}</div><h2>${p.name}</h2><div class="detail-grid">${stats.map(x=>`<div class="detail-stat"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join("")}</div><svg id="detailChart" class="detail-chart" viewBox="0 0 680 320"></svg>`;
  document.getElementById("detailPanel").classList.add("show");
  document.getElementById("detailPanel").setAttribute("aria-hidden","false");
  const svg=document.getElementById("detailChart"),W=680,H=320,pad=20,lo=Math.min(...arr),hi=Math.max(...arr),x=i=>pad+i*(W-2*pad)/(arr.length-1),y=v=>pad+(hi-v)*(H-2*pad)/((hi-lo)||1);
  svg.innerHTML=`<polyline points="${arr.map((v,i)=>`${x(i)},${y(v)}`).join(" ")}" fill="none" stroke="#c9ff3b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
}
document.getElementById("detailClose").onclick=()=>{document.getElementById("detailPanel").classList.remove("show");document.getElementById("detailPanel").setAttribute("aria-hidden","true")};

document.getElementById("storyRail").innerHTML=D.fullDates.slice().reverse().map((d,ri)=>{
  const i=D.fullDates.length-1-ri,prev=i>0?D.depot[i-1]:null,change=prev===null?null:D.depot[i]-prev;
  return `<article class="story-item"><div class="story-date">${d}</div><div><div class="story-value">${eur(D.depot[i])}</div><div class="${change===null?"":change>=0?"pos":"neg"}">${change===null?"Startpunkt":`${change>=0?"+":""}${eur(change)}`}</div></div><div class="story-note">${D.notes[d]||"Messpunkt aus dem regelmäßigen Depot-Screenshot."}</div></article>`;
}).join("");

const best=[...D.positions].sort((a,b)=>b.perf-a.perf)[0];
const worst=[...D.positions].sort((a,b)=>a.perf-b.perf)[0];
const largest=[...D.positions].sort((a,b)=>b.value-a.value)[0];
document.getElementById("insightCards").innerHTML=[
  [`${best.perf>=0?"+":""}${pct(best.perf)}`,`${best.name} ist aktuell die stärkste Position im Depot.`],
  [`${pct((latest/start-1)*100)}`,`So stark hat sich das Gesamtdepot seit dem ersten dokumentierten Messpunkt entwickelt.`],
  [`${pct(largest.value/latest*100)}`,`${largest.name} ist die größte Einzelposition und prägt die Gesamtentwicklung entsprechend stark.`],
  [`${worst.perf>=0?"+":""}${pct(worst.perf)}`,`${worst.name} ist derzeit die schwächste Position und belastet die Gesamtperformance am stärksten.`]
].map(x=>`<article class="insight-card"><div class="big">${x[0]}</div><p>${x[1]}</p></article>`).join("");

document.getElementById("sparplanVisual").innerHTML=[
  ["Artificial Intelligence","50 €","#7b61ff"],["Security Equity","50 €","#00a9b7"],["Smart Industrial","50 €","#e3a520"]
].map(x=>`<div class="spar-pill" style="border-top:12px solid ${x[2]}"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join("");

document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
  document.getElementById("view-"+b.dataset.view).classList.add("active");
  window.scrollTo({top:0,behavior:"smooth"});
});

const menu=document.getElementById("exportMenu");
document.getElementById("exportBtn").onclick=()=>menu.classList.toggle("show");
function download(name,text,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
document.getElementById("exportJson").onclick=()=>download("portfolio-os-2026.json",JSON.stringify(D,null,2),"application/json");
document.getElementById("exportCsv").onclick=()=>download("portfolio-verlauf.csv",[["Datum","Depotwert"],...D.fullDates.map((d,i)=>[d,D.depot[i]])].map(r=>r.join(";")).join("\n"),"text/csv");
document.getElementById("printPdf").onclick=()=>window.print();

if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js");
