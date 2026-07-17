(() => {
const qFallback={"BNP SX7E":250,"AGIF Artificial Intelligence":0.8645,"UBS Security Equity":1.5794,"DWS Smart Industrial":1.0371,"DWS ESG Akkumula":8,"DWS Top Dividende":120,"DWS ESG Stiftungsfonds":480,"DWS STR-DB Balanced":400};
D.positions.forEach(p=>{if(!Number.isFinite(p.quantity))p.quantity=qFallback[p.name]||0});
const fixedCore=D.positions.filter(p=>!Object.prototype.hasOwnProperty.call(D.savings,p.name)).reduce((a,p)=>a+p.invested,0);
const investedHistory=D.contrib.map(v=>fixedCore+v*Object.keys(D.savings).length);
const profitHistory=D.depot.map((v,i)=>v-investedHistory[i]);
const currentInvested=investedHistory.at(-1),currentProfit=D.depot.at(-1)-currentInvested;
const allHigh=Math.max(...D.depot),highI=D.depot.indexOf(allHigh),beI=profitHistory.findIndex(v=>v>=0);
const allPositionSeries={...D.core,...D.savings};

function prepareLayout(){
  const firstSplit=document.getElementById("depotChart")?.closest("section.grid");
  const allocationCard=document.getElementById("donut")?.closest("article");
  if(firstSplit){firstSplit.className="grid full-width-section";firstSplit.querySelector("article")?.classList.add("hero-chart-card");if(allocationCard)allocationCard.remove()}
  const holdingsSection=document.getElementById("holdingsRows")?.closest("section.grid");
  if(holdingsSection){
    holdingsSection.className="grid split-even position-analysis-section";
    holdingsSection.innerHTML=`<article class="card position-analysis-card"><div class="card-head"><div><h2>Positionen im Zeitverlauf</h2><span>Über das Diagramm wischen oder tippen, um Messpunkte abzurufen</span></div><button class="explain-btn" data-explain="positions">ⓘ</button></div><div id="positionHistoryTabs" class="tabs position-history-tabs"></div><svg id="positionHistoryChart" class="chart tall interactive-chart" viewBox="0 0 1100 390"></svg><div id="positionHistoryFacts" class="fact-grid holding-facts"></div><div class="gesture-hint">↔ Im Diagramm wischen: Datum und Wert werden dynamisch im Chart Insight angezeigt.</div><div class="learn-box" data-learning="positions"></div></article>`;
    if(allocationCard)holdingsSection.appendChild(allocationCard);
  }
}
prepareLayout();

function setInsightSafe(type,title,html){if(typeof setInsight==="function")setInsight(type,title,html)}
function dateLabel(i){return D.fullDates?.[i]||D.dates[i]}
function posForName(name){return D.positions.find(p=>p.name===name)}
function holdingHtml(p){
 const q=p?.quantity||0,course=q?p.value/q:0,buy=q?p.invested/q:(p?.buyPrice||0);
 return `<div class="insight-section"><div class="insight-label">Aktueller Bestand</div><div class="insight-grid"><div class="insight-stat"><span>Anteile / Stück</span><strong>${nfmt(q)}</strong></div><div class="insight-stat"><span>Aktueller Kurs</span><strong>${eur(course)}</strong></div><div class="insight-stat"><span>Ø Einstand</span><strong>${eur(buy)}</strong></div><div class="insight-stat"><span>Positionswert</span><strong>${eur(p?.value||0)}</strong></div></div></div>`
}
function showDepotPoint(i){
 const v=D.depot[i],prev=i?D.depot[i-1]:null,profit=profitHistory[i],peak=Math.max(...D.depot.slice(0,i+1));
 setInsightSafe("Chart Insight",`Gesamtdepot · ${dateLabel(i)}`,`<div class="insight-section"><div class="insight-label">Depotwert am Messpunkt</div><div class="insight-value">${eur(v)}</div><div class="${prev===null?"":v-prev>=0?"pos":"neg"}">${prev===null?"Erster Messpunkt":`${v-prev>=0?"+":""}${eur(v-prev)} zum vorherigen Messpunkt`}</div></div><div class="insight-section"><div class="insight-grid"><div class="insight-stat"><span>Break-even</span><strong>${eur(investedHistory[i])}</strong></div><div class="insight-stat"><span>Buchgewinn</span><strong>${eur(profit)}</strong></div><div class="insight-stat"><span>Bisheriges Hoch</span><strong>${eur(peak)}</strong></div><div class="insight-stat"><span>Abstand zum Hoch</span><strong>${pct((v/peak-1)*100)}</strong></div></div></div>`)
}
function showPositionPoint(name,i){
 const values=allPositionSeries[name],p=posForName(name),v=values[i],prev=i?values[i-1]:null,peak=Math.max(...values.slice(0,i+1));
 setInsightSafe("Chart Insight",`${name} · ${dateLabel(i)}`,`<div class="insight-section"><div class="insight-label">Positionswert am Messpunkt</div><div class="insight-value">${eur(v)}</div><div class="${prev===null?"":v-prev>=0?"pos":"neg"}">${prev===null?"Erster Messpunkt":`${v-prev>=0?"+":""}${eur(v-prev)} zum vorherigen Messpunkt`}</div><div class="insight-grid"><div class="insight-stat"><span>Seit Start</span><strong>${pct((v/values[0]-1)*100)}</strong></div><div class="insight-stat"><span>Abstand damaliges Hoch</span><strong>${pct((v/peak-1)*100)}</strong></div></div></div>${holdingHtml(p)}`)
}
function nearestIndex(evt,svg,count,pad){
 const r=svg.getBoundingClientRect();const clientX=evt.touches?.[0]?.clientX??evt.clientX;const local=(clientX-r.left)/r.width*svg.viewBox.baseVal.width;return Math.max(0,Math.min(count-1,Math.round((local-pad.l)/(svg.viewBox.baseVal.width-pad.l-pad.r)*(count-1))))
}
function bindScrubber(svg,config){
 let active=false;
 const update=e=>{if(!active&&e.type!=="pointermove")return;const i=nearestIndex(e,svg,config.count,config.pad);config.renderCursor(i);config.onChange(i);if(e.cancelable)e.preventDefault()};
 svg.addEventListener("pointerdown",e=>{active=true;svg.setPointerCapture?.(e.pointerId);update(e)});
 svg.addEventListener("pointermove",e=>{if(e.pointerType==="mouse"||active)update(e)});
 svg.addEventListener("pointerup",()=>active=false);svg.addEventListener("pointercancel",()=>active=false);
 svg.addEventListener("touchstart",e=>{active=true;update(e)},{passive:false});svg.addEventListener("touchmove",update,{passive:false});svg.addEventListener("touchend",()=>active=false);
}
function drawBreakEven(selected=D.depot.length-1){
 const svg=document.getElementById("depotChart"),W=1100,H=390,p={l:72,r:24,t:34,b:48};svg.setAttribute("viewBox",`0 0 ${W} ${H}`);svg.classList.add("interactive-chart");
 const vals=[...D.depot,...investedHistory],lo=Math.min(...vals)*.995,hi=Math.max(...vals)*1.005,x=i=>p.l+i*(W-p.l-p.r)/(D.dates.length-1),y=v=>p.t+(hi-v)*(H-p.t-p.b)/(hi-lo);
 let out=`<defs><linearGradient id="gainFill54" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16a34a" stop-opacity=".28"/><stop offset="1" stop-color="#16a34a" stop-opacity=".03"/></linearGradient><linearGradient id="lossFill54" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dc2626" stop-opacity=".22"/><stop offset="1" stop-color="#dc2626" stop-opacity=".03"/></linearGradient></defs>`;
 for(let i=0;i<5;i++){const v=lo+i*(hi-lo)/4,yy=y(v);out+=`<line x1="${p.l}" y1="${yy}" x2="${W-p.r}" y2="${yy}" stroke="var(--line)"/><text x="${p.l-8}" y="${yy+4}" text-anchor="end" fill="var(--muted)" font-size="10">${Math.round(v/1000)}k</text>`}
 for(let i=0;i<D.depot.length-1;i++){const fill=(profitHistory[i]+profitHistory[i+1])/2>=0?"url(#gainFill54)":"url(#lossFill54)";out+=`<polygon points="${x(i)},${y(D.depot[i])} ${x(i+1)},${y(D.depot[i+1])} ${x(i+1)},${y(investedHistory[i+1])} ${x(i)},${y(investedHistory[i])}" fill="${fill}"/>`}
 out+=`<polyline points="${investedHistory.map((v,i)=>`${x(i)},${y(v)}`).join(" ")}" fill="none" stroke="#b45309" stroke-width="2.5" stroke-dasharray="7 6"/><polyline points="${D.depot.map((v,i)=>`${x(i)},${y(v)}`).join(" ")}" fill="none" stroke="#2563eb" stroke-width="3.5"/>`;
 D.depot.forEach((v,i)=>out+=`<circle class="depot-hit" data-i="${i}" cx="${x(i)}" cy="${y(v)}" r="11" fill="transparent"/><circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="#2563eb" stroke="white"/>`);
 out+=`<circle cx="${x(highI)}" cy="${y(D.depot[highI])}" r="6" fill="#7c3aed" stroke="white" stroke-width="2"/><text x="${x(highI)}" y="${y(D.depot[highI])-12}" text-anchor="middle" fill="#7c3aed" font-size="11" font-weight="800">Allzeithoch</text>`;
 if(beI>=0)out+=`<line x1="${x(beI)}" y1="${p.t}" x2="${x(beI)}" y2="${H-p.b}" stroke="#15803d" stroke-dasharray="3 4"/><text x="${x(beI)+5}" y="${p.t+12}" fill="#15803d" font-size="10" font-weight="800">Break-even</text>`;
 D.dates.forEach((d,i)=>{if(i===0||i===D.dates.length-1||i%3===0)out+=`<text x="${x(i)}" y="${H-15}" text-anchor="middle" fill="var(--muted)" font-size="10">${d}</text>`});
 out+=`<g transform="translate(${p.l},12)"><line x1="0" y1="0" x2="24" y2="0" stroke="#2563eb" stroke-width="3"/><text x="30" y="4" fill="var(--muted)" font-size="11">Depotwert</text><line x1="105" y1="0" x2="129" y2="0" stroke="#b45309" stroke-width="2.5" stroke-dasharray="7 5"/><text x="135" y="4" fill="var(--muted)" font-size="11">Break-even / investiert</text></g>`;
 out+=`<g class="scrub-cursor"><line x1="${x(selected)}" y1="${p.t}" x2="${x(selected)}" y2="${H-p.b}" stroke="#0f172a" stroke-width="1.5" stroke-dasharray="3 3"/><circle cx="${x(selected)}" cy="${y(D.depot[selected])}" r="7" fill="#fff" stroke="#2563eb" stroke-width="3"/><rect x="${Math.min(W-165,Math.max(p.l,x(selected)-70))}" y="${p.t+8}" width="140" height="34" rx="9" fill="var(--ink)"/><text x="${Math.min(W-95,Math.max(p.l+70,x(selected)))}" y="${p.t+30}" text-anchor="middle" fill="var(--card)" font-size="12" font-weight="800">${D.dates[selected]} · ${eur(D.depot[selected])}</text></g>`;
 svg.innerHTML=out;svg.querySelectorAll(".depot-hit").forEach(c=>c.addEventListener("click",()=>{const i=+c.dataset.i;drawBreakEven(i);showDepotPoint(i)}));
 return {svg,p,renderCursor:i=>drawBreakEven(i)}
}
let depotBinding=drawBreakEven();bindScrubber(depotBinding.svg,{count:D.depot.length,pad:depotBinding.p,renderCursor:i=>drawBreakEven(i),onChange:showDepotPoint});

const breakFacts=document.getElementById("breakEvenFacts");if(breakFacts)breakFacts.innerHTML=[["Investiertes Kapital",eur(currentInvested)],["Aktueller Buchgewinn",eur(currentProfit)],["Break-even erreicht",beI>=0?D.fullDates[beI]:"Noch nicht"],["Allzeithoch",`${eur(allHigh)} · ${D.fullDates[highI]}`]].map(x=>`<div class="fact"><div class="label">${x[0]}</div><div class="value">${x[1]}</div></div>`).join("");
const thresholds=[0,1000,2500,5000,7500,10000],mg=document.getElementById("milestoneGrid");if(mg)mg.innerHTML=thresholds.map(t=>{const i=profitHistory.findIndex(v=>v>=t),done=i>=0;return `<div class="milestone ${done?"done":"open"}"><div class="milestone-icon">${done?"✓":"○"}</div><div><strong>${t===0?"Break-even":eur(t)+" Gewinn"}</strong><span>${done?`erreicht am ${D.fullDates[i]}`:`noch ${eur(Math.max(0,t-currentProfit))}`}</span></div></div>`}).join("")+`<div class="milestone done"><div class="milestone-icon">★</div><div><strong>Allzeithoch ${eur(allHigh)}</strong><span>${D.fullDates[highI]}</span></div></div>`;
const gap=D.depot.at(-1)-allHigh,hf=document.getElementById("highWaterFacts");if(hf)hf.innerHTML=[["Höchster Depotwert",eur(allHigh)],["Datum",D.fullDates[highI]],["Aktueller Abstand",eur(gap)],["Gewinn über Break-even",eur(currentProfit)]].map(x=>`<div class="fact"><div class="label">${x[0]}</div><div class="value ${x[0]==="Aktueller Abstand"&&gap<0?"neg":""}">${x[1]}</div></div>`).join("");
const hwm=document.getElementById("highWaterMessage");if(hwm)hwm.innerHTML=gap>=0?`<strong>Neues Allzeithoch</strong><p>Der aktuelle Depotwert markiert einen neuen Rekordstand.</p>`:`<strong>${eur(Math.abs(gap))} bis zum Allzeithoch</strong><p>Das Depot liegt ${pct(Math.abs(gap/allHigh*100))} unter dem bisherigen Höchststand.</p>`;

let selectedPosition=D.positions[0].name;
const tabs=document.getElementById("positionHistoryTabs");if(tabs)tabs.innerHTML=D.positions.map((p,i)=>`<button class="${i===0?"active":""}" data-name="${p.name}">${p.name}</button>`).join("");
function drawPositionHistory(name,selected=allPositionSeries[name].length-1){
 const svg=document.getElementById("positionHistoryChart"),values=allPositionSeries[name],W=1100,H=390,pad={l:72,r:24,t:28,b:48},lo=Math.min(...values)*.985,hi=Math.max(...values)*1.015,x=i=>pad.l+i*(W-pad.l-pad.r)/(values.length-1),y=v=>pad.t+(hi-v)*(H-pad.t-pad.b)/((hi-lo)||1);let out="";
 for(let i=0;i<5;i++){const v=lo+i*(hi-lo)/4,yy=y(v);out+=`<line x1="${pad.l}" y1="${yy}" x2="${W-pad.r}" y2="${yy}" stroke="var(--line)"/><text x="${pad.l-8}" y="${yy+4}" text-anchor="end" fill="var(--muted)" font-size="10">${Math.round(v)} €</text>`}
 out+=`<polyline points="${values.map((v,i)=>`${x(i)},${y(v)}`).join(" ")}" fill="none" stroke="#2563eb" stroke-width="3.5"/>`;
 values.forEach((v,i)=>out+=`<circle data-i="${i}" class="position-point-hit" cx="${x(i)}" cy="${y(v)}" r="12" fill="transparent"/><circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="#2563eb" stroke="white"/>`);
 D.dates.forEach((d,i)=>{if(i===0||i===D.dates.length-1||i%3===0)out+=`<text x="${x(i)}" y="${H-15}" text-anchor="middle" fill="var(--muted)" font-size="10">${d}</text>`});
 out+=`<line x1="${x(selected)}" y1="${pad.t}" x2="${x(selected)}" y2="${H-pad.b}" stroke="#0f172a" stroke-dasharray="3 3"/><circle cx="${x(selected)}" cy="${y(values[selected])}" r="7" fill="#fff" stroke="#2563eb" stroke-width="3"/><rect x="${Math.min(W-165,Math.max(pad.l,x(selected)-70))}" y="${pad.t+8}" width="140" height="34" rx="9" fill="var(--ink)"/><text x="${Math.min(W-95,Math.max(pad.l+70,x(selected)))}" y="${pad.t+30}" text-anchor="middle" fill="var(--card)" font-size="12" font-weight="800">${D.dates[selected]} · ${eur(values[selected])}</text>`;
 svg.innerHTML=out;svg.querySelectorAll(".position-point-hit").forEach(c=>c.onclick=()=>{const i=+c.dataset.i;drawPositionHistory(name,i);showPositionPoint(name,i)});
 const p=posForName(name),q=p.quantity||0,course=q?p.value/q:0,buy=q?p.invested/q:(p.buyPrice||0),facts=document.getElementById("positionHistoryFacts");facts.innerHTML=[["Anteile / Stück",nfmt(q)],["Aktueller Kurs",eur(course)],["Ø Einstand",eur(buy)],["Positionswert",eur(p.value)],["Gewinn / Verlust",`${eur(p.pl)} · ${pct(p.perf)}`],["Kategorie",p.cat]].map(x=>`<div class="fact"><div class="label">${x[0]}</div><div class="value">${x[1]}</div></div>`).join("");
 return {svg,pad,renderCursor:i=>drawPositionHistory(name,i)}
}
let ph=drawPositionHistory(selectedPosition);bindScrubber(ph.svg,{count:D.dates.length,pad:ph.pad,renderCursor:i=>drawPositionHistory(selectedPosition,i),onChange:i=>showPositionPoint(selectedPosition,i)});
tabs?.querySelectorAll("button").forEach(b=>b.onclick=()=>{tabs.querySelectorAll("button").forEach(x=>x.classList.remove("active"));b.classList.add("active");selectedPosition=b.dataset.name;drawPositionHistory(selectedPosition);showPositionPoint(selectedPosition,D.dates.length-1)});

const wbc=document.getElementById("wealthBuildChart");if(wbc){lineChart("wealthBuildChart",D.dates,[{name:"Depotwert",values:D.depot,bold:true},{name:"Investiertes Kapital",values:investedHistory},{name:"Buchgewinn",values:profitHistory}],{zero:true});document.getElementById("wealthBuildFacts").innerHTML=[["Einzahlungen/Einstand",eur(currentInvested)],["Depotwert",eur(D.depot.at(-1))],["Buchgewinn",eur(currentProfit)],["Gewinnquote",pct(currentProfit/currentInvested*100)]].map(x=>`<div class="fact"><div class="label">${x[0]}</div><div class="value">${x[1]}</div></div>`).join("")}
const ah={"Aktien Europa":D.core["BNP SX7E"],"Aktien Themen":D.dates.map((_,i)=>Object.values(D.savings).reduce((a,s)=>a+s[i],0)),"Aktien übergreifend":D.dates.map((_,i)=>D.core["DWS ESG Akkumula"][i]+D.core["DWS Top Dividende"][i]),"Multi Asset":D.dates.map((_,i)=>D.core["DWS ESG Stiftungsfonds"][i]+D.core["DWS STR-DB Balanced"][i])};
if(document.getElementById("allocationHistoryChart")){lineChart("allocationHistoryChart",D.dates,Object.entries(ah).map(([name,values])=>({name,values})));document.getElementById("allocationHistoryLegend").innerHTML=Object.keys(ah).map((n,i)=>`<span><i style="background:${C[i]}"></i>${n}</span>`).join("")}
})();