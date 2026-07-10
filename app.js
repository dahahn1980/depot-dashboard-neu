
const COLORS=["#315efb","#6d4aff","#0ea5a8","#0f9f6e","#f59e0b","#d94645","#6366f1","#0f766e"];
const eur=v=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(v);
const pct=v=>new Intl.NumberFormat("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2}).format(v)+" %";
const latest=D.depot.at(-1),start=D.depot[0],low=Math.min(...D.depot),high=Math.max(...D.depot);
const allSeries={...D.core,...D.savings};

function rangeSlice(labels,values,range){
  const n=range==="1m"?4:range==="3m"?10:values.length;
  return {labels:labels.slice(-n),values:values.slice(-n),offset:values.length-Math.min(n,values.length)};
}
function svgLineChart(id,labels,series,{percent=false,zero=false,onPoint=null}={}){
  const svg=document.getElementById(id),W=+svg.viewBox.baseVal.width,H=+svg.viewBox.baseVal.height,p={l:66,r:20,t:18,b:42};
  const vals=series.flatMap(s=>s.values);let lo=Math.min(...vals),hi=Math.max(...vals);if(zero){lo=Math.min(lo,0);hi=Math.max(hi,0)}
  const pad=(hi-lo)*.1||1;lo-=pad;hi+=pad;
  const x=i=>p.l+i*(W-p.l-p.r)/Math.max(1,labels.length-1),y=v=>p.t+(hi-v)*(H-p.t-p.b)/(hi-lo);
  let out="";
  for(let i=0;i<5;i++){const v=lo+i*(hi-lo)/4,yy=y(v);out+=`<line x1="${p.l}" y1="${yy}" x2="${W-p.r}" y2="${yy}" stroke="var(--line)"/><text x="${p.l-8}" y="${yy+4}" text-anchor="end" fill="var(--muted)" font-size="11">${percent?pct(v):Math.round(v/1000)+"k"}</text>`}
  labels.forEach((d,i)=>{if(i===0||i===labels.length-1||i%3===0)out+=`<text x="${x(i)}" y="${H-14}" text-anchor="middle" fill="var(--muted)" font-size="11">${d}</text>`})
  series.forEach((s,si)=>{const pts=s.values.map((v,i)=>`${x(i)},${y(v)}`).join(" ");out+=`<polyline points="${pts}" fill="none" stroke="${COLORS[si%COLORS.length]}" stroke-width="${s.bold?4:2.6}" stroke-linecap="round" stroke-linejoin="round"/>`;s.values.forEach((v,i)=>out+=`<circle class="hit" data-si="${si}" data-i="${i}" cx="${x(i)}" cy="${y(v)}" r="10" fill="transparent"/><circle cx="${x(i)}" cy="${y(v)}" r="3.7" fill="${COLORS[si%COLORS.length]}" stroke="white" stroke-width="1.5"/>`)});
  svg.innerHTML=out;
  svg.querySelectorAll(".hit").forEach(el=>el.onclick=()=>{const si=+el.dataset.si,i=+el.dataset.i;if(onPoint)onPoint(series[si],i)});
}
function hbars(id,rows,key,fmt,signed=true,onClick=null){
  const svg=document.getElementById(id),W=+svg.viewBox.baseVal.width,H=+svg.viewBox.baseVal.height,p={l:210,r:85,t:14,b:18},max=Math.max(...rows.map(r=>Math.abs(r[key])))||1,rh=(H-p.t-p.b)/rows.length;
  let out="";
  rows.forEach((r,i)=>{const y=p.t+i*rh+rh*.23,h=rh*.5,w=Math.abs(r[key])/max*(W-p.l-p.r),x=signed?(r[key]>=0?p.l:p.l-w):p.l,col=signed?(r[key]>=0?"#0f9f6e":"#d94645"):"#315efb";out+=`<text x="${p.l-8}" y="${y+h*.72}" text-anchor="end" fill="var(--text)" font-size="11">${r.name}</text><rect class="bar-hit" data-i="${i}" x="${Math.min(x,p.l)}" y="${y-4}" width="${Math.max(w,14)}" height="${h+8}" rx="8" fill="transparent"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${col}"/><text x="${signed?(r[key]>=0?x+w+7:x-7):x+w+7}" y="${y+h*.72}" text-anchor="${signed&&r[key]<0?"end":"start"}" fill="var(--text)" font-size="11">${fmt(r[key])}</text>`});
  if(signed)out+=`<line x1="${p.l}" y1="${p.t}" x2="${p.l}" y2="${H-p.b}" stroke="var(--muted)"/>`;
  svg.innerHTML=out;
  if(onClick)svg.querySelectorAll(".bar-hit").forEach(el=>el.onclick=()=>onClick(rows[+el.dataset.i]));
}
function spark(values){
  const W=320,H=70,p=4,lo=Math.min(...values),hi=Math.max(...values),x=i=>p+i*(W-2*p)/Math.max(1,values.length-1),y=v=>p+(hi-v)*(H-2*p)/((hi-lo)||1);
  return `<svg class="spark" viewBox="0 0 ${W} ${H}"><polyline points="${values.map((v,i)=>`${x(i)},${y(v)}`).join(" ")}" fill="none" stroke="#315efb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function showModal(title,html){
  document.getElementById("modalContent").innerHTML=`<div class="section-kicker">Detailansicht</div><h2 style="font-size:34px;margin:6px 0 18px">${title}</h2>${html}`;
  document.getElementById("detailModal").classList.add("show");
}
document.getElementById("modalClose").onclick=()=>document.getElementById("detailModal").classList.remove("show");
document.getElementById("detailModal").onclick=e=>{if(e.target.id==="detailModal")e.currentTarget.classList.remove("show")};

document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>{document.querySelectorAll(".nav-btn").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.getElementById("view-"+b.dataset.view).classList.add("active")});

document.getElementById("kpis").innerHTML=[
 ["Aktueller Depotwert",eur(latest),"Stand "+D.meta.lastUpdate],
 ["Seit Start",eur(latest-start),pct((latest/start-1)*100)],
 ["Letzte Veränderung",eur(latest-D.depot.at(-2)),pct((latest/D.depot.at(-2)-1)*100)],
 ["Abstand zum Hoch",eur(latest-high),pct((latest/high-1)*100)]
].map(x=>`<article class="metric"><div class="label">${x[0]}</div><div class="value ${x[1].startsWith("-")?"neg":"pos"}">${x[1]}</div><div class="hint">${x[2]}</div></article>`).join("");

let depotRange="all";
function drawDepot(){
  const r=rangeSlice(D.dates,D.depot,depotRange);
  svgLineChart("depotChart",r.labels,[{name:"Depotwert",values:r.values,bold:true}],{onPoint:(s,i)=>{const gi=r.offset+i,v=s.values[i],prev=gi>0?D.depot[gi-1]:null;document.getElementById("depotDetail").innerHTML=[
    ["Datum",D.fullDates[gi]],["Depotwert",eur(v)],["Zum vorherigen Punkt",prev===null?"–":eur(v-prev)],["Seit Start",pct((v/start-1)*100)]
  ].map(x=>`<div class="detail-cell"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join("")+(D.notes[D.fullDates[gi]]?`<div class="detail-cell" style="grid-column:1/-1"><span>Notiz</span><strong>${D.notes[D.fullDates[gi]]}</strong></div>`:"")}});
}
drawDepot();

document.querySelectorAll('.range-switch[data-target="depotChart"] button').forEach(b=>b.onclick=()=>{depotRange=b.dataset.range;b.parentElement.querySelectorAll("button").forEach(x=>x.classList.remove("active"));b.classList.add("active");drawDepot()});

function donut(){
  const svg=document.getElementById("donut"),cx=260,cy=160,r=105,sw=52,total=D.categories.reduce((a,b)=>a+b.value,0);let acc=0,out="";
  D.categories.forEach((c,i)=>{const f=c.value/total,len=2*Math.PI*r*f,off=-2*Math.PI*r*acc;out+=`<circle class="donut-hit" data-i="${i}" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${COLORS[i]}" stroke-width="${sw}" stroke-dasharray="${len} ${2*Math.PI*r-len}" stroke-dashoffset="${off}" transform="rotate(-90 ${cx} ${cy})"/>`;acc+=f});
  out+=`<text x="${cx}" y="${cy-3}" text-anchor="middle" fill="var(--muted)" font-size="13">Depotwert</text><text x="${cx}" y="${cy+30}" text-anchor="middle" fill="var(--text)" font-size="25" font-weight="800">${Math.round(total/1000)} Tsd. €</text>`;svg.innerHTML=out;
  svg.querySelectorAll(".donut-hit").forEach(el=>el.onclick=()=>{const c=D.categories[+el.dataset.i],ps=D.positions.filter(p=>p.cat===c.name);showModal(c.name,`<div class="fact-grid">${[["Kategorie-Wert",eur(c.value)],["Depotanteil",pct(c.value/total*100)]].map(x=>`<div class="fact"><div class="label">${x[0]}</div><div class="value">${x[1]}</div></div>`).join("")}</div><div class="table-wrap"><table><thead><tr><th>Position</th><th>Wert</th></tr></thead><tbody>${ps.map(p=>`<tr><td>${p.name}</td><td>${eur(p.value)}</td></tr>`).join("")}</tbody></table></div>`)});
  document.getElementById("catLegend").innerHTML=D.categories.map((c,i)=>`<span><i style="background:${COLORS[i]}"></i>${c.name} · ${pct(c.value/total*100)}</span>`).join("");
}
donut();

document.getElementById("ranking").innerHTML=`<div class="rank-list">${D.weeklyChanges.slice(0,3).map((r,i)=>`<div class="rank-item"><span>${i+1}. ${r.name}</span><strong class="${r.change>=0?"pos":"neg"}">${eur(r.change)}</strong></div>`).join("")}<div style="height:8px"></div>${D.weeklyChanges.slice(-3).reverse().map((r,i)=>`<div class="rank-item"><span>${i+1}. ${r.name}</span><strong class="${r.change>=0?"pos":"neg"}">${eur(r.change)}</strong></div>`).join("")}</div>`;
hbars("perfChart",D.positions,"perf",pct,true,r=>openPosition(r.name));

let coreRange="all",coreMode="all";
const coreNames=Object.keys(D.core);
document.getElementById("coreTabs").innerHTML='<button class="active" data-mode="all">Alle</button>'+coreNames.map((n,i)=>`<button data-mode="${i}">${n}</button>`).join("");
function drawCore(){
  const names=coreMode==="all"?coreNames:[coreNames[+coreMode]];
  const series=names.map(n=>{
    const r=rangeSlice(D.dates,D.core[n],coreRange);
    return {name:n,values:r.values.map(v=>v/r.values[0]*100),offset:r.offset};
  });
  const labels=rangeSlice(D.dates,D.core[names[0]],coreRange).labels;
  svgLineChart("coreChart",labels,series,{
    onPoint:(s,i)=>{
      const global=(s.offset||0)+i;
      const cells=[
        ["Datum",D.fullDates[global]],
        ["Index",s.values[i].toFixed(2)],
        ["Seit Zeitraumstart",pct(s.values[i]-100)]
      ].map(x=>`<div class="fact"><div class="label">${x[0]}</div><div class="value">${x[1]}</div></div>`).join("");
      showModal(s.name,`<div class="fact-grid">${cells}</div>`);
    }
  });
  document.getElementById("coreLegend").innerHTML=names.map((n,i)=>`<span><i style="background:${COLORS[i]}"></i>${n}</span>`).join("");
}
drawCore();
document.querySelectorAll("#coreTabs button").forEach(b=>b.onclick=()=>{coreMode=b.dataset.mode;b.parentElement.querySelectorAll("button").forEach(x=>x.classList.remove("active"));b.classList.add("active");drawCore()});
document.querySelectorAll('.range-switch[data-target="coreChart"] button').forEach(b=>b.onclick=()=>{coreRange=b.dataset.range;b.parentElement.querySelectorAll("button").forEach(x=>x.classList.remove("active"));b.classList.add("active");drawCore()});

document.getElementById("positionCards").innerHTML=D.positions.map(p=>`<article class="position-card" data-name="${p.name}"><h3>${p.name}</h3><div class="meta">${p.wkn} · ${p.cat}</div>${spark(allSeries[p.name])}<div class="row"><span>Aktueller Wert</span><strong>${eur(p.value)}</strong></div><div class="row"><span>Gewinn / Verlust</span><strong class="${p.pl>=0?"pos":"neg"}">${eur(p.pl)}</strong></div><div class="row"><span>Performance</span><strong class="${p.perf>=0?"pos":"neg"}">${pct(p.perf)}</strong></div></article>`).join("");
document.querySelectorAll(".position-card").forEach(c=>c.onclick=()=>openPosition(c.dataset.name));

function openPosition(name){
  const p=D.positions.find(x=>x.name===name),arr=allSeries[name],peak=Math.max(...arr),trough=Math.min(...arr),weekly=arr.at(-1)-arr.at(-2),monthlyChange=arr.at(-1)-arr[Math.max(0,arr.length-4)],best=Math.max(...arr.slice(1).map((v,i)=>v-arr[i])),worst=Math.min(...arr.slice(1).map((v,i)=>v-arr[i]));
  showModal(name,`<div class="fact-grid">${[
    ["Investiert",eur(p.invested)],["Aktueller Wert",eur(p.value)],["Gewinn / Verlust",eur(p.pl)],["Performance",pct(p.perf)],
    ["Letzter Messpunkt",eur(weekly)],["Ca. 1 Monat",eur(monthlyChange)],["Abstand zum Hoch",pct((p.value/peak-1)*100)],["Bisheriges Tief",eur(trough)],
    ["Beste Periode",eur(best)],["Schlechteste Periode",eur(worst)]
  ].map(x=>`<div class="fact"><div class="label">${x[0]}</div><div class="value">${x[1]}</div></div>`).join("")}</div><svg id="modalChart" class="chart chart-lg" viewBox="0 0 900 340"></svg>`);
  svgLineChart("modalChart",D.dates,[{name,values:arr,bold:true}],{onPoint:(s,i)=>{}});
}

const sn=Object.keys(D.savings);
document.getElementById("savingTabs").innerHTML=sn.map((n,i)=>`<button class="${i===0?"active":""}" data-i="${i}">${n}</button>`).join("");
function drawSaving(i=0){const n=sn[i],v=D.savings[n],invested=D.contrib.at(-1),current=v.at(-1),gain=current-invested;svgLineChart("savingsChart",D.dates,[{name:n,values:v,bold:true},{name:"Einzahlungen",values:D.contrib}]);document.getElementById("savingFacts").innerHTML=[["Eingezahlt",eur(invested)],["Aktueller Wert",eur(current)],["Reiner Kursgewinn",eur(gain)],["Rendite",pct(gain/invested*100)],["Durchschnittlicher Einstand",eur(invested/(D.positions.find(p=>p.name===n)?.value/current||1))]].map(x=>`<div class="fact"><div class="label">${x[0]}</div><div class="value">${x[1]}</div></div>`).join("")}
drawSaving();document.querySelectorAll("#savingTabs button").forEach(b=>b.onclick=()=>{b.parentElement.querySelectorAll("button").forEach(x=>x.classList.remove("active"));b.classList.add("active");drawSaving(+b.dataset.i)});

let runningMax=-Infinity,maxDD=0,maxDDIndex=0,peakIndex=0;
const dd=D.depot.map((v,i)=>{if(v>runningMax){runningMax=v;peakIndex=i}const d=(v/runningMax-1)*100;if(d<maxDD){maxDD=d;maxDDIndex=i}return d});
svgLineChart("drawdownChart",D.dates,[{name:"Drawdown",values:dd,bold:true}],{percent:true,zero:true});
document.getElementById("drawdownFacts").innerHTML=[["Größter Rückgang",pct(maxDD)],["Tiefpunkt",D.dates[maxDDIndex]],["Aktueller Abstand zum Hoch",pct((latest/high-1)*100)],["Hochpunkt",D.dates[D.depot.indexOf(high)]]].map(x=>`<div class="fact"><div class="label">${x[0]}</div><div class="value">${x[1]}</div></div>`).join("");
hbars("monthlyChart",D.monthly.map(m=>({name:m.month.slice(5)+"/"+m.month.slice(2,4),value:m.change})),"value",eur,true);
hbars("plChart",D.positions,"pl",eur,true,r=>openPosition(r.name));

function checks(){
  const list=[];
  const catSum=D.categories.reduce((a,b)=>a+b.value,0),posSum=D.positions.reduce((a,b)=>a+b.value,0);
  list.push({state:Math.abs(catSum-latest)<1?"ok":"bad",title:"Kategorien = Gesamtdepot",text:`Differenz ${eur(catSum-latest)}`});
  list.push({state:Math.abs(posSum-latest)<1?"ok":"bad",title:"Positionen = Gesamtdepot",text:`Differenz ${eur(posSum-latest)}`});
  const lengths=[D.dates.length,D.depot.length,...Object.values(D.core).map(a=>a.length),...Object.values(D.savings).map(a=>a.length)];
  list.push({state:new Set(lengths).size===1?"ok":"bad",title:"Zeitreihen vollständig",text:`${Math.max(...lengths)} Messpunkte`});
  const spike=Math.max(...D.depot.slice(1).map((v,i)=>Math.abs(v-D.depot[i])));
  list.push({state:spike>5000?"warn":"ok",title:"Ausreißerprüfung",text:`Größte Veränderung ${eur(spike)}`});
  document.getElementById("checkList").innerHTML=list.map(x=>`<div class="check-item ${x.state}"><strong>${x.title}</strong><div style="color:var(--muted);margin-top:4px">${x.text}</div></div>`).join("");
}
checks();

document.getElementById("historyTimeline").innerHTML=D.fullDates.slice().reverse().map((d,ri)=>{const i=D.fullDates.length-1-ri;return `<div class="timeline-item"><div><div class="timeline-date">${d}</div><div class="badge ${D.quality[i].status}">${D.quality[i].status}</div></div><div><strong>${eur(D.depot[i])}</strong><div class="timeline-note">${D.notes[d]||"Kein Kommentar hinterlegt."}</div></div></div>`}).join("");

const qc={direct:0,summed:0,history:0};D.quality.forEach(q=>qc[q.status]++);
document.getElementById("qualitySummary").innerHTML=[["Direkt",qc.direct],["Summiert",qc.summed],["Historie",qc.history],["Gesamt",D.quality.length]].map(x=>`<article class="metric"><div class="label">${x[0]}</div><div class="value">${x[1]}</div></article>`).join("");
document.getElementById("qualityRows").innerHTML=D.quality.slice().reverse().map(q=>`<tr><td>${q.date}</td><td><span class="badge ${q.status}">${q.status}</span></td><td>${q.label}</td></tr>`).join("");

const root=document.documentElement;document.getElementById("themeBtn").onclick=()=>{const dark=root.getAttribute("data-theme")==="dark";root.setAttribute("data-theme",dark?"light":"dark");localStorage.setItem("theme",dark?"light":"dark")};if(localStorage.getItem("theme")==="dark")root.setAttribute("data-theme","dark");

const menu=document.getElementById("exportMenu");document.getElementById("exportBtn").onclick=()=>menu.classList.toggle("show");
function download(name,text,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
document.getElementById("exportJson").onclick=()=>download("depot-data.json",JSON.stringify(D,null,2),"application/json");
document.getElementById("exportCsv").onclick=()=>{const rows=[["Datum","Depotwert"],...D.fullDates.map((d,i)=>[d,D.depot[i]])];download("depot-verlauf.csv",rows.map(r=>r.join(";")).join("\n"),"text/csv")};
document.getElementById("printPdf").onclick=()=>window.print();
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js");
