(() => {
const qFallback={"BNP SX7E":250,"AGIF Artificial Intelligence":0.8645,"UBS Security Equity":1.5794,"DWS Smart Industrial":1.0371,"DWS ESG Akkumula":8,"DWS Top Dividende":120,"DWS ESG Stiftungsfonds":480,"DWS STR-DB Balanced":400};
D.positions.forEach(p=>{if(!Number.isFinite(p.quantity))p.quantity=qFallback[p.name]||0});
const fixedCore=D.positions.filter(p=>!Object.prototype.hasOwnProperty.call(D.savings,p.name)).reduce((a,p)=>a+p.invested,0);
const investedHistory=D.contrib.map(v=>fixedCore+v*Object.keys(D.savings).length);
const profitHistory=D.depot.map((v,i)=>v-investedHistory[i]);
const currentInvested=investedHistory.at(-1),currentProfit=D.depot.at(-1)-currentInvested;
const allHigh=Math.max(...D.depot),highI=D.depot.indexOf(allHigh),beI=profitHistory.findIndex(v=>v>=0);
function drawBreakEven(){
 const svg=document.getElementById("depotChart"),W=920,H=360,p={l:68,r:20,t:28,b:44};
 const vals=[...D.depot,...investedHistory],lo=Math.min(...vals)*.995,hi=Math.max(...vals)*1.005;
 const x=i=>p.l+i*(W-p.l-p.r)/(D.dates.length-1),y=v=>p.t+(hi-v)*(H-p.t-p.b)/(hi-lo);
 let out=`<defs><linearGradient id="gainFill54" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16a34a" stop-opacity=".28"/><stop offset="1" stop-color="#16a34a" stop-opacity=".03"/></linearGradient><linearGradient id="lossFill54" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dc2626" stop-opacity=".22"/><stop offset="1" stop-color="#dc2626" stop-opacity=".03"/></linearGradient></defs>`;
 for(let i=0;i<5;i++){const v=lo+i*(hi-lo)/4,yy=y(v);out+=`<line x1="${p.l}" y1="${yy}" x2="${W-p.r}" y2="${yy}" stroke="var(--line)"/><text x="${p.l-8}" y="${yy+4}" text-anchor="end" fill="var(--muted)" font-size="10">${Math.round(v/1000)}k</text>`}
 for(let i=0;i<D.depot.length-1;i++){const fill=(profitHistory[i]+profitHistory[i+1])/2>=0?"url(#gainFill54)":"url(#lossFill54)";out+=`<polygon points="${x(i)},${y(D.depot[i])} ${x(i+1)},${y(D.depot[i+1])} ${x(i+1)},${y(investedHistory[i+1])} ${x(i)},${y(investedHistory[i])}" fill="${fill}"/>`}
 out+=`<polyline points="${investedHistory.map((v,i)=>`${x(i)},${y(v)}`).join(" ")}" fill="none" stroke="#b45309" stroke-width="2.5" stroke-dasharray="7 6"/><polyline points="${D.depot.map((v,i)=>`${x(i)},${y(v)}`).join(" ")}" fill="none" stroke="#2563eb" stroke-width="3.5"/>`;
 out+=`<circle cx="${x(highI)}" cy="${y(D.depot[highI])}" r="6" fill="#7c3aed" stroke="white" stroke-width="2"/><text x="${x(highI)}" y="${y(D.depot[highI])-12}" text-anchor="middle" fill="#7c3aed" font-size="11" font-weight="800">Allzeithoch</text>`;
 if(beI>=0)out+=`<line x1="${x(beI)}" y1="${p.t}" x2="${x(beI)}" y2="${H-p.b}" stroke="#15803d" stroke-dasharray="3 4"/><text x="${x(beI)+5}" y="${p.t+12}" fill="#15803d" font-size="10" font-weight="800">Break-even</text>`;
 D.dates.forEach((d,i)=>{if(i===0||i===D.dates.length-1||i%3===0)out+=`<text x="${x(i)}" y="${H-15}" text-anchor="middle" fill="var(--muted)" font-size="10">${d}</text>`});
 out+=`<g transform="translate(${p.l},10)"><line x1="0" y1="0" x2="24" y2="0" stroke="#2563eb" stroke-width="3"/><text x="30" y="4" fill="var(--muted)" font-size="11">Depotwert</text><line x1="105" y1="0" x2="129" y2="0" stroke="#b45309" stroke-width="2.5" stroke-dasharray="7 5"/><text x="135" y="4" fill="var(--muted)" font-size="11">Break-even / investiert</text></g>`;
 svg.innerHTML=out;
}
drawBreakEven();
document.getElementById("breakEvenFacts").innerHTML=[["Investiertes Kapital",eur(currentInvested)],["Aktueller Buchgewinn",eur(currentProfit)],["Break-even erreicht",beI>=0?D.fullDates[beI]:"Noch nicht"],["Allzeithoch",`${eur(allHigh)} · ${D.fullDates[highI]}`]].map(x=>`<div class="fact"><div class="label">${x[0]}</div><div class="value">${x[1]}</div></div>`).join("");
const thresholds=[0,1000,2500,5000,7500,10000];
document.getElementById("milestoneGrid").innerHTML=thresholds.map(t=>{const i=profitHistory.findIndex(v=>v>=t),done=i>=0;return `<div class="milestone ${done?"done":"open"}"><div class="milestone-icon">${done?"✓":"○"}</div><div><strong>${t===0?"Break-even":eur(t)+" Gewinn"}</strong><span>${done?`erreicht am ${D.fullDates[i]}`:`noch ${eur(Math.max(0,t-currentProfit))}`}</span></div></div>`}).join("")+`<div class="milestone done"><div class="milestone-icon">★</div><div><strong>Allzeithoch ${eur(allHigh)}</strong><span>${D.fullDates[highI]}</span></div></div>`;
const gap=D.depot.at(-1)-allHigh;
document.getElementById("highWaterFacts").innerHTML=[["Höchster Depotwert",eur(allHigh)],["Datum",D.fullDates[highI]],["Aktueller Abstand",eur(gap)],["Gewinn über Break-even",eur(currentProfit)]].map(x=>`<div class="fact"><div class="label">${x[0]}</div><div class="value ${x[0]==="Aktueller Abstand"&&gap<0?"neg":""}">${x[1]}</div></div>`).join("");
document.getElementById("highWaterMessage").innerHTML=gap>=0?`<strong>Neues Allzeithoch</strong><p>Der aktuelle Depotwert markiert einen neuen Rekordstand.</p>`:`<strong>${eur(Math.abs(gap))} bis zum Allzeithoch</strong><p>Das Depot liegt ${pct(Math.abs(gap/allHigh*100))} unter dem bisherigen Höchststand.</p>`;
document.getElementById("holdingsRows").innerHTML=D.positions.map(p=>{const q=p.quantity||0,course=q?p.value/q:0,buy=q?p.invested/q:(p.buyPrice||0);return `<tr><td><strong>${p.name}</strong></td><td>${nfmt(q)}</td><td>${eur(buy)}</td><td>${eur(course)}</td><td>${eur(p.value)}</td><td class="${p.pl>=0?"pos":"neg"}">${eur(p.pl)} (${pct(p.perf)})</td></tr>`}).join("");
hbars("quantityChart",D.positions.map(p=>({name:p.name,value:p.quantity||0})),"value",nfmt,false);
lineChart("wealthBuildChart",D.dates,[{name:"Depotwert",values:D.depot,bold:true},{name:"Investiertes Kapital",values:investedHistory},{name:"Buchgewinn",values:profitHistory}],{zero:true});
document.getElementById("wealthBuildFacts").innerHTML=[["Einzahlungen/Einstand",eur(currentInvested)],["Depotwert",eur(D.depot.at(-1))],["Buchgewinn",eur(currentProfit)],["Gewinnquote",pct(currentProfit/currentInvested*100)]].map(x=>`<div class="fact"><div class="label">${x[0]}</div><div class="value">${x[1]}</div></div>`).join("");
const ah={"Aktien Europa":D.core["BNP SX7E"],"Aktien Themen":D.dates.map((_,i)=>Object.values(D.savings).reduce((a,s)=>a+s[i],0)),"Aktien übergreifend":D.dates.map((_,i)=>D.core["DWS ESG Akkumula"][i]+D.core["DWS Top Dividende"][i]),"Multi Asset":D.dates.map((_,i)=>D.core["DWS ESG Stiftungsfonds"][i]+D.core["DWS STR-DB Balanced"][i])};
lineChart("allocationHistoryChart",D.dates,Object.entries(ah).map(([name,values])=>({name,values})));
document.getElementById("allocationHistoryLegend").innerHTML=Object.keys(ah).map((n,i)=>`<span><i style="background:${C[i]}"></i>${n}</span>`).join("");
})();
