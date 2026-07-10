const colors=["#2563eb","#7c3aed","#0891b2","#16a34a","#ea580c","#dc2626","#4f46e5","#0f766e"];
const eur=v=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(v);
const pct=v=>new Intl.NumberFormat('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v)+" %";

const min=Math.min(...D.depot), max=Math.max(...D.depot), latest=D.depot.at(-1), start=D.depot[0];

document.getElementById("kpis").innerHTML=[
["Aktueller Depotwert",eur(latest),"Stand 05.07.2026"],
["Seit 15.02.",eur(latest-start),pct((latest/start-1)*100)],
["Tiefpunkt",eur(min),D.dates[D.depot.indexOf(min)]],
["Erholung seit Tief",eur(latest-min),pct((latest/min-1)*100)]
].map((x,i)=>`<div class="card kpi"><div class="label">${x[0]}</div><div class="value ${i==1||i==3?'pos':''}">${x[1]}</div><div class="hint">${x[2]}</div></div>`).join("");

function lineChart(id, labels, series, opts={}){
 const svg=document.getElementById(id), W=+svg.viewBox.baseVal.width,H=+svg.viewBox.baseVal.height,p={l:62,r:18,t:18,b:42};
 const vals=series.flatMap(s=>s.values), lo=Math.min(...vals), hi=Math.max(...vals), pad=(hi-lo)*.10||1, ymin=lo-pad,ymax=hi+pad;
 const x=i=>p.l+i*(W-p.l-p.r)/(labels.length-1), y=v=>p.t+(ymax-v)*(H-p.t-p.b)/(ymax-ymin);
 let s="";
 for(let i=0;i<5;i++){let v=ymin+i*(ymax-ymin)/4, yy=y(v);s+=`<line x1="${p.l}" y1="${yy}" x2="${W-p.r}" y2="${yy}" stroke="#e5e7eb"/><text x="${p.l-8}" y="${yy+4}" text-anchor="end" font-size="10" fill="#6b7280">${opts.percent?pct(v):Math.round(v/1000)+"k"}</text>`}
 labels.forEach((d,i)=>{if(i===0||i===labels.length-1||i%3===0)s+=`<text x="${x(i)}" y="${H-14}" text-anchor="middle" font-size="10" fill="#6b7280">${d}</text>`})
 series.forEach((ser,si)=>{const pts=ser.values.map((v,i)=>`${x(i)},${y(v)}`).join(" ");s+=`<polyline points="${pts}" fill="none" stroke="${colors[si%colors.length]}" stroke-width="${ser.bold?3.4:2.4}" opacity=".96"/>`;ser.values.forEach((v,i)=>s+=`<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="${colors[si%colors.length]}" stroke="white" stroke-width="1"><title>${ser.name} · ${labels[i]} · ${opts.percent?pct(v):eur(v)}</title></circle>`)})
 svg.innerHTML=s;
}

lineChart("depotChart",D.dates,[{name:"Depotwert",values:D.depot,bold:true}]);

const coreNames=Object.keys(D.core);
document.getElementById("coreTabs").innerHTML=`<button class="active" data-mode="all">Alle</button>`+coreNames.map((n,i)=>`<button data-mode="${i}">${n}</button>`).join("");
function drawCore(mode="all"){
 const s=mode==="all"?coreNames.map(n=>({name:n,values:D.core[n]})):[{name:coreNames[+mode],values:D.core[coreNames[+mode]],bold:true}];
 lineChart("coreChart",D.dates,s);
 document.getElementById("coreLegend").innerHTML=s.map((x,i)=>`<span><i style="background:${colors[i]}"></i>${x.name}</span>`).join("");
}
drawCore();
document.querySelectorAll("#coreTabs button").forEach(b=>b.onclick=()=>{document.querySelectorAll("#coreTabs button").forEach(x=>x.classList.remove("active"));b.classList.add("active");drawCore(b.dataset.mode)});

const savNames=Object.keys(D.savings), savSeries=savNames.map(n=>({name:n,values:D.savings[n]}));
lineChart("savingsChart",D.dates,savSeries);
document.getElementById("savingsLegend").innerHTML=savNames.map((n,i)=>`<span><i style="background:${colors[i]}"></i>${n}</span>`).join("");

function hbars(id,rows,valueKey,fmt,colorBySign=false){
 const svg=document.getElementById(id),W=+svg.viewBox.baseVal.width,H=+svg.viewBox.baseVal.height,p={l:190,r:70,t:14,b:18},maxAbs=Math.max(...rows.map(r=>Math.abs(r[valueKey])));
 const rowH=(H-p.t-p.b)/rows.length; let s="";
 rows.forEach((r,i)=>{const y=p.t+i*rowH+rowH*.22,h=rowH*.52,w=Math.abs(r[valueKey])/maxAbs*(W-p.l-p.r),x=colorBySign?(r[valueKey]>=0?p.l:p.l-w):p.l;const c=colorBySign?(r[valueKey]>=0?"#15803d":"#b91c1c"):"#2563eb";s+=`<text x="${p.l-8}" y="${y+h*.72}" text-anchor="end" font-size="11" fill="#374151">${r.name}</text><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${c}"/><text x="${colorBySign?(r[valueKey]>=0?x+w+6:x-6):x+w+6}" y="${y+h*.72}" text-anchor="${colorBySign&&r[valueKey]<0?'end':'start'}" font-size="11" fill="#374151">${fmt(r[valueKey])}</text>`})
 if(colorBySign)s+=`<line x1="${p.l}" y1="${p.t}" x2="${p.l}" y2="${H-p.b}" stroke="#9ca3af"/>`;
 svg.innerHTML=s;
}
hbars("perfChart",D.positions,"perf",pct,true);
hbars("valueBars",D.positions,"value",v=>Math.round(v/1000)+"k €");

const deltas=D.depot.slice(1).map((v,i)=>({name:D.dates[i+1],delta:v-D.depot[i]}));
hbars("deltaChart",deltas,"delta",eur,true);

function donut(){
 const svg=document.getElementById("donut"),cx=210,cy=155,r=100,stroke=46,total=D.categories.reduce((a,b)=>a+b.value,0);let acc=0,s="";
 D.categories.forEach((c,i)=>{const frac=c.value/total,dash=2*Math.PI*r*frac,off=-2*Math.PI*r*acc;s+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${colors[i]}" stroke-width="${stroke}" stroke-dasharray="${dash} ${2*Math.PI*r-dash}" stroke-dashoffset="${off}" transform="rotate(-90 ${cx} ${cy})"><title>${c.name} · ${eur(c.value)} · ${pct(frac*100)}</title></circle>`;acc+=frac});
 s+=`<text x="${cx}" y="${cy-4}" text-anchor="middle" font-size="13" fill="#6b7280">Depotwert</text><text x="${cx}" y="${cy+24}" text-anchor="middle" font-size="21" font-weight="800" fill="#111827">${Math.round(total/1000)} Tsd. €</text>`;svg.innerHTML=s;
 document.getElementById("catLegend").innerHTML=D.categories.map((c,i)=>`<span><i style="background:${colors[i]}"></i>${c.name} · ${pct(c.value/total*100)}</span>`).join("");
}
donut();

const totalPos=D.positions.reduce((a,b)=>a+b.value,0);
document.getElementById("positionRows").innerHTML=D.positions.map(p=>`<tr><td><strong>${p.name}</strong></td><td>${p.cat}</td><td>${eur(p.value)}</td><td><span class="badge ${p.pl>=0?'pos':'neg'}">${p.pl>=0?'+':''}${eur(p.pl)}</span></td><td class="${p.perf>=0?'pos':'neg'}"><strong>${p.perf>=0?'+':''}${pct(p.perf)}</strong></td><td style="min-width:150px">${pct(p.value/totalPos*100)}<div class="bar"><span style="width:${p.value/totalPos*100}%"></span></div></td></tr>`).join("");
