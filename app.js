
window.addEventListener("error", e => {
  const box = document.createElement("div");
  box.style.cssText = "position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;background:#fee2e2;color:#991b1b;border:1px solid #fecaca;border-radius:12px;padding:12px;font:14px system-ui";
  box.textContent = "Dashboard-Fehler: " + (e.message || "Unbekannter Fehler") + ". Bitte data.js und app.js gemeinsam aktualisieren.";
  document.body.appendChild(box);
});

if (!window.D) {
  document.body.innerHTML = '<div style="padding:30px;font-family:system-ui">data.js wurde nicht geladen.</div>';
  throw new Error("data.js fehlt oder wurde nicht geladen");
}

D.monthly = Array.isArray(D.monthly) ? D.monthly : [];
D.weeklyChanges = Array.isArray(D.weeklyChanges) ? D.weeklyChanges : [];
D.quality = Array.isArray(D.quality) ? D.quality : [];


const C=["#2563eb","#7c3aed","#0891b2","#16a34a","#ea580c","#dc2626","#4f46e5","#0f766e"];
const eur=v=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(v);
const pct=v=>new Intl.NumberFormat("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2}).format(v)+" %";
const latest=D.depot.at(-1),start=D.depot[0],low=Math.min(...D.depot),high=Math.max(...D.depot);
const lastDelta=latest-D.depot.at(-2);

document.getElementById("rangeLabel").textContent=D.dates[0]+"–"+D.meta.lastUpdate;
document.getElementById("lastUpdate").textContent="Stand "+D.meta.lastUpdate;
document.getElementById("kpis").innerHTML=[
 ["Aktueller Depotwert",eur(latest),"Stand "+D.meta.lastUpdate],
 ["Seit Start",eur(latest-start),pct((latest/start-1)*100)],
 ["Seit letztem Screenshot",eur(lastDelta),pct((latest/D.depot.at(-2)-1)*100)],
 ["Erholung seit Tief",eur(latest-low),pct((latest/low-1)*100)]
].map((x,i)=>`<article class="card kpi"><div class="label">${x[0]}</div><div class="value ${x[1].startsWith("-")?"neg":(i>0?"pos":"")}">${x[1]}</div><div class="hint">${x[2]}</div></article>`).join("");

function lineChart(id,labels,series,{percent=false,zero=false}={}){
 const svg=document.getElementById(id),W=+svg.viewBox.baseVal.width,H=+svg.viewBox.baseVal.height,p={l:64,r:18,t:18,b:42};
 let vals=series.flatMap(s=>s.values),lo=Math.min(...vals),hi=Math.max(...vals);if(zero){lo=Math.min(lo,0);hi=Math.max(hi,0)}
 const pad=(hi-lo)*.1||1;lo-=pad;hi+=pad;
 const x=i=>p.l+i*(W-p.l-p.r)/(labels.length-1),y=v=>p.t+(hi-v)*(H-p.t-p.b)/(hi-lo);
 let out="";
 for(let i=0;i<5;i++){const v=lo+i*(hi-lo)/4,yy=y(v);out+=`<line x1="${p.l}" y1="${yy}" x2="${W-p.r}" y2="${yy}" stroke="var(--line)"/><text x="${p.l-8}" y="${yy+4}" text-anchor="end" fill="var(--muted)" font-size="10">${percent?pct(v):Math.round(v/1000)+"k"}</text>`}
 labels.forEach((d,i)=>{if(i===0||i===labels.length-1||i%3===0)out+=`<text x="${x(i)}" y="${H-14}" text-anchor="middle" fill="var(--muted)" font-size="10">${d}</text>`})
 series.forEach((s,si)=>{const points=s.values.map((v,i)=>`${x(i)},${y(v)}`).join(" ");out+=`<polyline points="${points}" fill="none" stroke="${C[si%C.length]}" stroke-width="${s.bold?3.4:2.4}"/>`;s.values.forEach((v,i)=>out+=`<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="${C[si%C.length]}" stroke="white"><title>${s.name} · ${labels[i]} · ${percent?pct(v):eur(v)}</title></circle>`)});
 svg.innerHTML=out;
}
function hbars(id,rows,key,fmt,signed=false){
 const svg=document.getElementById(id),W=+svg.viewBox.baseVal.width,H=+svg.viewBox.baseVal.height,p={l:195,r:80,t:12,b:16},max=Math.max(...rows.map(r=>Math.abs(r[key]))),rh=(H-p.t-p.b)/rows.length;
 let out="";
 rows.forEach((r,i)=>{const y=p.t+i*rh+rh*.23,h=rh*.5,w=Math.abs(r[key])/max*(W-p.l-p.r),x=signed?(r[key]>=0?p.l:p.l-w):p.l,col=signed?(r[key]>=0?"#15803d":"#b91c1c"):"#2563eb";out+=`<text x="${p.l-8}" y="${y+h*.72}" text-anchor="end" fill="var(--ink)" font-size="11">${r.name}</text><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${col}"/><text x="${signed?(r[key]>=0?x+w+6:x-6):x+w+6}" y="${y+h*.72}" text-anchor="${signed&&r[key]<0?"end":"start"}" fill="var(--ink)" font-size="11">${fmt(r[key])}</text>`});
 if(signed)out+=`<line x1="${p.l}" y1="${p.t}" x2="${p.l}" y2="${H-p.b}" stroke="var(--muted)"/>`;
 svg.innerHTML=out;
}
function sparkline(values){
 const W=220,H=54,p=3,lo=Math.min(...values),hi=Math.max(...values),x=i=>p+i*(W-2*p)/(values.length-1),y=v=>p+(hi-v)*(H-2*p)/((hi-lo)||1);
 return `<svg class="spark" viewBox="0 0 ${W} ${H}"><polyline points="${values.map((v,i)=>`${x(i)},${y(v)}`).join(" ")}" fill="none" stroke="#2563eb" stroke-width="2.4"/></svg>`;
}

lineChart("depotChart",D.dates,[{name:"Depotwert",values:D.depot,bold:true}]);

document.getElementById("weeklyKpis").innerHTML=[
 ["Depotveränderung",eur(lastDelta)],
 ["Monatsveränderung",D.monthly.length?eur(latest-D.monthly.at(-1).start):"–"],
 ["Bester Wert",D.weeklyChanges.length?D.weeklyChanges[0].name:"–"],
 ["Schwächster Wert",D.weeklyChanges.length?D.weeklyChanges.at(-1).name:"–"]
].map(x=>`<div class="mini-card"><div class="label">${x[0]}</div><div class="value">${x[1]}</div></div>`).join("");

document.getElementById("ranking").innerHTML = D.weeklyChanges.length
 ? `<div class="rank-list">${D.weeklyChanges.slice(0,3).map((r,i)=>`<div class="rank-item"><span>${i+1}. ${r.name}</span><strong class="${r.change>=0?"pos":"neg"}">${eur(r.change)}</strong></div>`).join("")}
 <div style="height:8px"></div>
 ${D.weeklyChanges.slice(-3).reverse().map((r,i)=>`<div class="rank-item"><span>${i+1}. ${r.name}</span><strong class="${r.change>=0?"pos":"neg"}">${eur(r.change)}</strong></div>`).join("")}</div>`
 : '<p style="color:var(--muted)">Keine Wochenvergleichsdaten vorhanden.</p>';

const normalized={};Object.entries(D.core).forEach(([k,v])=>normalized[k]=v.map(x=>x/v[0]*100));
const names=Object.keys(normalized);
document.getElementById("coreTabs").innerHTML='<button class="active" data-mode="all">Alle</button>'+names.map((n,i)=>`<button data-mode="${i}">${n}</button>`).join("");
function drawCore(mode="all"){const s=mode==="all"?names.map(n=>({name:n,values:normalized[n]})):[{name:names[+mode],values:normalized[names[+mode]],bold:true}];lineChart("coreChart",D.dates,s);document.getElementById("coreLegend").innerHTML=s.map((x,i)=>`<span><i style="background:${C[i]}"></i>${x.name}</span>`).join("")}
drawCore();document.querySelectorAll("#coreTabs button").forEach(b=>b.onclick=()=>{document.querySelectorAll("#coreTabs button").forEach(x=>x.classList.remove("active"));b.classList.add("active");drawCore(b.dataset.mode)});

const allSeries={...D.core,...D.savings};
document.getElementById("positionCards").innerHTML=D.positions.map(p=>{const arr=allSeries[p.name]||[];const peak=Math.max(...arr);const dist=(p.value/peak-1)*100;const weekly=arr.length>1?arr.at(-1)-arr.at(-2):0;return `<div class="position-card"><h3>${p.name}</h3>${sparkline(arr)}<div class="row"><span>Aktueller Wert</span><strong>${eur(p.value)}</strong></div><div class="row"><span>Seit letzter Woche</span><strong class="${weekly>=0?"pos":"neg"}">${eur(weekly)}</strong></div><div class="row"><span>Abstand zum Hoch</span><strong class="${dist>=0?"pos":"neg"}">${pct(dist)}</strong></div></div>`}).join("");

let runningMax=-Infinity,maxDD=0,maxDDIndex=0,peakIndex=0;
const dd=D.depot.map((v,i)=>{if(v>runningMax){runningMax=v;peakIndex=i}const d=(v/runningMax-1)*100;if(d<maxDD){maxDD=d;maxDDIndex=i}return d});
lineChart("drawdownChart",D.dates,[{name:"Drawdown",values:dd,bold:true}],{percent:true,zero:true});
const recoveryIndex=D.depot.findIndex((v,i)=>i>maxDDIndex&&v>=D.depot[peakIndex]);
document.getElementById("drawdownFacts").innerHTML=[
 ["Größter Rückgang",pct(maxDD)],
 ["Tiefpunkt",D.dates[maxDDIndex]],
 ["Aktueller Abstand zum Hoch",pct((latest/high-1)*100)],
 ["Erholung",recoveryIndex>=0?D.dates[recoveryIndex]:"noch nicht vollständig"]
].map(x=>`<div class="fact"><div class="label">${x[0]}</div><div class="value">${x[1]}</div></div>`).join("");

const sn=Object.keys(D.savings);
document.getElementById("savingTabs").innerHTML=sn.map((n,i)=>`<button class="${i===0?"active":""}" data-i="${i}">${n}</button>`).join("");
function drawSaving(i=0){const n=sn[i],v=D.savings[n],invested=D.contrib.at(-1),current=v.at(-1),gain=current-invested;lineChart("savingsChart",D.dates,[{name:n,values:v,bold:true},{name:"Einzahlungen",values:D.contrib}]);document.getElementById("savingFacts").innerHTML=[["Eingezahlt",eur(invested)],["Aktueller Wert",eur(current)],["Kursgewinn/-verlust",eur(gain)],["Rendite",pct(gain/invested*100)]].map(x=>`<div class="fact"><div class="label">${x[0]}</div><div class="value">${x[1]}</div></div>`).join("")}
drawSaving();document.querySelectorAll("#savingTabs button").forEach(b=>b.onclick=()=>{document.querySelectorAll("#savingTabs button").forEach(x=>x.classList.remove("active"));b.classList.add("active");drawSaving(+b.dataset.i)});

if(D.monthly.length){hbars("monthlyChart",D.monthly.map(m=>({name:m.month.slice(5)+"/"+m.month.slice(2,4),value:m.change})),"value",eur,true)}else{document.getElementById("monthlyChart").outerHTML="<p style=\"color:var(--muted)\">Keine Monatsdaten vorhanden.</p>"}
hbars("perfChart",D.positions,"perf",pct,true);
hbars("plChart",D.positions,"pl",eur,true);

function donut(){const svg=document.getElementById("donut"),cx=210,cy=155,r=100,sw=48,total=D.categories.reduce((a,b)=>a+b.value,0);let acc=0,out="";D.categories.forEach((c,i)=>{const f=c.value/total,len=2*Math.PI*r*f,off=-2*Math.PI*r*acc;out+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C[i]}" stroke-width="${sw}" stroke-dasharray="${len} ${2*Math.PI*r-len}" stroke-dashoffset="${off}" transform="rotate(-90 ${cx} ${cy})"><title>${c.name} · ${eur(c.value)} · ${pct(f*100)}</title></circle>`;acc+=f});out+=`<text x="${cx}" y="${cy-4}" text-anchor="middle" fill="var(--muted)" font-size="13">Depotwert</text><text x="${cx}" y="${cy+24}" text-anchor="middle" fill="var(--ink)" font-size="21" font-weight="800">${Math.round(total/1000)} Tsd. €</text>`;svg.innerHTML=out;document.getElementById("catLegend").innerHTML=D.categories.map((c,i)=>`<span><i style="background:${C[i]}"></i>${c.name} · ${pct(c.value/total*100)}</span>`).join("")}
donut();

const qCounts={direct:0,summed:0,history:0};D.quality.forEach(q=>{if(qCounts[q.status]!==undefined)qCounts[q.status]++});
document.getElementById("qualitySummary").innerHTML=[
 ["Direkte Screenshots",qCounts.direct],
 ["Summierte Werte",qCounts.summed],
 ["Historienwerte",qCounts.history],
 ["Messpunkte gesamt",D.quality.length]
].map(x=>`<div class="mini-card"><div class="label">${x[0]}</div><div class="value">${x[1]}</div></div>`).join("");
document.getElementById("qualityRows").innerHTML=D.quality.slice().reverse().map(q=>`<tr><td>${q.date}</td><td><span class="badge ${q.status}">${q.status}</span></td><td>${q.label}</td></tr>`).join("");

const total=D.positions.reduce((a,b)=>a+b.value,0);
document.getElementById("positionRows").innerHTML=D.positions.map(p=>`<tr><td><strong>${p.name}</strong></td><td>${p.cat}</td><td>${eur(p.invested)}</td><td>${eur(p.value)}</td><td><span class="badge ${p.pl>=0?"pos":"neg"}">${p.pl>=0?"+":""}${eur(p.pl)}</span></td><td class="${p.perf>=0?"pos":"neg"}"><strong>${p.perf>=0?"+":""}${pct(p.perf)}</strong></td><td style="min-width:160px">${pct(p.value/total*100)}<div class="bar"><span style="width:${p.value/total*100}%"></span></div></td></tr>`).join("");

const root=document.documentElement;document.getElementById("themeBtn").onclick=()=>{const dark=root.getAttribute("data-theme")==="dark";root.setAttribute("data-theme",dark?"light":"dark");localStorage.setItem("theme",dark?"light":"dark")};if(localStorage.getItem("theme")==="dark")root.setAttribute("data-theme","dark");
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js");
