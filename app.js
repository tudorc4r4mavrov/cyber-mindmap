/* ===========================================================
   Cybersecurity Knowledge Journey — engine
   =========================================================== */
(function(){
"use strict";
const {CATEGORIES}=window.KJ;
const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;

/* ---------- regions (one dataset per category) ---------- */
const REGIONS = {
  networking: window.KJ_NETWORKING,
  pentesting: window.KJ_PENTESTING,
  programming: window.KJ_PROGRAMMING,
};
let REGION_ID = "networking";               // active region id
let REGION = REGIONS.networking;            // active region
let CLUSTERS = REGION.clusters;
let CONCEPTS = REGION.concepts;
let RELATIONS = REGION.relations;
function setRegion(id){
  REGION_ID = REGIONS[id] ? id : "networking";
  REGION = REGIONS[REGION_ID];
  CLUSTERS = REGION.clusters; CONCEPTS = REGION.concepts; RELATIONS = REGION.relations;
}
const byId = id => CONCEPTS.find(c=>c.id===id);
const clusterOf = id => CLUSTERS.find(c=>c.id===id);

/* ---------- starfield canvas ---------- */
(function starfield(){
  const cv=document.getElementById("starfield"),ctx=cv.getContext("2d");
  let w,h,stars,dpr;
  function size(){
    dpr=Math.min(devicePixelRatio||1,2);
    w=cv.width=innerWidth*dpr; h=cv.height=innerHeight*dpr;
    cv.style.width=innerWidth+"px"; cv.style.height=innerHeight+"px";
    const n=Math.round((innerWidth*innerHeight)/5200);
    stars=Array.from({length:n},()=>({
      x:Math.random()*w,y:Math.random()*h,
      r:(Math.random()*1.3+.3)*dpr,
      a:Math.random()*.6+.2, tw:Math.random()*0.02+0.003, p:Math.random()*6.28,
      hue:Math.random()<.14?(Math.random()<.5?"148,184,255":"190,160,255"):"232,236,245"
    }));
  }
  size(); addEventListener("resize",size);
  let t=0;
  function frame(){
    ctx.clearRect(0,0,w,h);
    for(const s of stars){
      const a = reduce ? s.a : s.a*(0.6+0.4*Math.sin(t*s.tw*60+s.p));
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,6.283);
      ctx.fillStyle=`rgba(${s.hue},${a.toFixed(3)})`; ctx.fill();
    }
    t+=1; requestAnimationFrame(frame);
  }
  frame();
})();

/* ---------- scene manager ---------- */
const scenes={title:q("#title"),galaxy:q("#galaxy"),map:q("#map"),concept:q("#concept")};
let current="title";
const depth={title:0,galaxy:1,map:2,concept:3};
function q(s,r=document){return r.querySelector(s)}
function qa(s,r=document){return[...r.querySelectorAll(s)]}

function go(to){
  if(to===current) return;
  const from=current, el=scenes[from], nx=scenes[to];
  const deeper = depth[to]>depth[from];
  el.classList.remove("active");
  el.classList.add(deeper?"exit-to-deep":"exit-to-shallow");
  nx.classList.remove("exit-to-deep","exit-to-shallow","enter-from-deep");
  if(deeper) nx.classList.add("enter-from-deep");
  // allow enter-from state to apply, then activate
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    nx.classList.remove("enter-from-deep");
    nx.classList.add("active");
  }));
  const dur = reduce?120:720;
  setTimeout(()=>{ el.classList.remove("exit-to-deep","exit-to-shallow"); },dur);
  current=to;
  // nebula parallax per depth
  const shift=depth[to];
  q(".neb.a").style.transform=`translate(${shift*-20}px,${shift*-14}px) scale(${1+shift*.06})`;
  q(".neb.b").style.transform=`translate(${shift*18}px,${shift*12}px) scale(${1+shift*.05})`;
  // focus management
  (nx.querySelector(".back,.enter-btn,.orb,h2,h1")||nx).setAttribute("tabindex","-1");
  setTimeout(()=>{const f=nx.querySelector(".back,.enter-btn");if(f)f.focus({preventScroll:true});},dur);
}

/* initial */
scenes.title.classList.add("active");

/* ---------- title ---------- */
q("#enterBtn").addEventListener("click",()=>go("galaxy"));

/* ---------- galaxy orbs ---------- */
(function orbs(){
  const wrap=q("#orbs");
  CATEGORIES.forEach(cat=>{
    const b=document.createElement("button");
    b.className="orb accent-"+cat.hue; b.dataset.status=cat.status; b.dataset.id=cat.id;
    b.innerHTML=`<span class="o-name">${cat.name}</span><span class="o-tag">${cat.tagline}</span>`+
      (cat.status==="soon"?`<span class="o-badge">soon</span>`:"");
    if(cat.status==="ready" && REGIONS[cat.id]){
      b.addEventListener("click",()=>{ setRegion(cat.id); enterMap(); go("map"); });
    }else{
      b.setAttribute("aria-disabled","true"); b.title="Coming soon";
    }
    wrap.appendChild(b);
  });
})();

/* ===========================================================
   RADIAL MIND MAP
   =========================================================== */
const SVG="http://www.w3.org/2000/svg";
const svg=q("#mapsvg");
const VB={w:1480,h:1460};                 // logical viewbox with padding for top/bottom overlays
const view={x:0,y:0,s:1};                  // pan/zoom state
const nodePos={};                          // id -> {x,y,accent}
let clusterAngle={};

function makeDefs(){
  const defs=document.createElementNS(SVG,"defs");
  defs.innerHTML=`
    <radialGradient id="hubGrad" cx="50%" cy="42%" r="65%">
      <stop offset="0%" stop-color="#bfe4ff"/><stop offset="55%" stop-color="#5eb8ff"/>
      <stop offset="100%" stop-color="#2a6fd6"/></radialGradient>`;
  CLUSTERS.forEach(cl=>{
    const g=document.createElementNS(SVG,"radialGradient");
    g.id="g-"+cl.id; g.setAttribute("cx","38%");g.setAttribute("cy","34%");g.setAttribute("r","70%");
    g.innerHTML=`<stop offset="0%" stop-color="#fff" stop-opacity=".9"/>
      <stop offset="45%" stop-color="var(--${cl.accent})"/>
      <stop offset="100%" stop-color="var(--${cl.accent})" stop-opacity=".55"/>`;
    defs.appendChild(g);
  });
  svg.appendChild(defs);
}

function layout(){
  const cx=VB.w/2, cy=VB.h/2;
  const N=CLUSTERS.length;
  const sector=(2*Math.PI)/N;                     // radians allotted per cluster
  CLUSTERS.forEach((cl,i)=>{
    const ang=(-Math.PI/2) + i*sector;            // start at top, go clockwise
    clusterAngle[cl.id]=ang;
    const members=CONCEPTS.filter(c=>c.cluster===cl.id);
    const clR=250;                                // cluster centre radius
    cl._cx=cx+Math.cos(ang)*clR; cl._cy=cy+Math.sin(ang)*clR;
    // Spread members across the sector so a node never crosses into a
    // neighbour. Very large clusters (6+) are allowed a wider arc and a
    // deeper 4-level radius stagger so long, same-side labels never collide.
    const huge = members.length>=6;
    const big  = members.length>=4;
    const spanCap = huge ? sector*0.98 : sector*0.86;
    const span=Math.min(spanCap, (members.length-1)*0.32);
    const levels = huge ? 4 : (big ? 3 : 2);
    const step = huge ? 92 : (big ? 104 : 80);
    // Radius level per member. Base is a round-robin by angular index so
    // neighbours differ in distance; then, for dense clusters, push the
    // longest-labelled nodes to the outermost ring so their long text has
    // empty space to extend into and can't collide with a neighbour's.
    const levelFor = (j)=>{
      let lvl = j % levels;
      if(big){
        const m=members[j];
        const long = (m.title||"").length >= 22;
        if(long) lvl = levels-1;                 // longest labels -> outer ring
      }
      return lvl;
    };
    members.forEach((m,j)=>{
      const t = members.length===1?0:(j/(members.length-1)-0.5);
      const a = ang + t*span;
      const r = clR + 150 + levelFor(j)*step;
      nodePos[m.id]={ x:cx+Math.cos(a)*r, y:cy+Math.sin(a)*r, accent:cl.accent, cl:cl.id, ang:a };
    });
  });
}

function el(tag,attrs,parent){
  const e=document.createElementNS(SVG,tag);
  for(const k in attrs) e.setAttribute(k,attrs[k]);
  if(parent)parent.appendChild(e); return e;
}

function buildMap(){
  svg.innerHTML=""; makeDefs(); layout();
  svg.setAttribute("viewBox",`0 0 ${VB.w} ${VB.h}`);
  const root=el("g",{id:"maproot"},svg);

  const cx=VB.w/2, cy=VB.h/2;

  // relationship lines (behind)
  const relG=el("g",{},root);
  RELATIONS.forEach(([a,b])=>{
    const pa=nodePos[a],pb=nodePos[b]; if(!pa||!pb)return;
    const l=el("line",{x1:pa.x,y1:pa.y,x2:pb.x,y2:pb.y,class:"rel-line"},relG);
    l.dataset.a=a; l.dataset.b=b;
  });

  // spokes hub->cluster and cluster->node
  const spokeG=el("g",{},root);
  CLUSTERS.forEach(cl=>{
    el("line",{x1:cx,y1:cy,x2:cl._cx,y2:cl._cy,class:"spoke","stroke":`var(--${cl.accent})`},spokeG);
    CONCEPTS.filter(c=>c.cluster===cl.id).forEach(m=>{
      const p=nodePos[m.id];
      el("line",{x1:cl._cx,y1:cl._cy,x2:p.x,y2:p.y,class:"spoke","stroke":`var(--${cl.accent})`,opacity:.3},spokeG);
    });
  });

  // cluster labels — sit hub-ward of the inner nodes, clear of the hub ring
  CLUSTERS.forEach(cl=>{
    const a=clusterAngle[cl.id];
    const lx=cx+Math.cos(a)*168, ly=cy+Math.sin(a)*168;
    const t=el("text",{x:lx,y:ly+4,class:"cluster-lbl",fill:`var(--${cl.accent})`,
      "text-anchor":"middle"},root);
    t.textContent=cl.label;
  });

  // concept nodes
  const nodeG=el("g",{},root);
  CONCEPTS.forEach(c=>{
    const p=nodePos[c.id];
    const g=el("g",{class:"node accent-"+p.accent+(c.stub?" is-stub":""),tabindex:"0",role:"button",
      "aria-label":c.title},nodeG);
    g.dataset.id=c.id;
    el("circle",{class:"halo",cx:p.x,cy:p.y,r:22,fill:`var(--${p.accent})`,opacity:0,filter:"blur(6px)"},g);
    el("circle",{class:"dot",cx:p.x,cy:p.y,r:6.5,fill:`url(#g-${p.cl})`,
      stroke:`var(--${p.accent})`,"stroke-width":1.2},g);
    // label placed outward from hub
    const dx=p.x-cx, dy=p.y-cy, len=Math.hypot(dx,dy)||1;
    const lx=p.x+dx/len*14, ly=p.y+dy/len*14+4;
    const anchor = dx>40?"start": dx<-40?"end":"middle";
    const lab=el("text",{x:lx,y:ly,class:"lbl"+(c.stub?" dim":""),"text-anchor":anchor},g);
    lab.textContent=c.title;

    const open=()=>openConcept(c.id);
    g.addEventListener("click",open);
    g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open();}});
    g.addEventListener("mouseenter",()=>lightRelations(c.id,true));
    g.addEventListener("mouseleave",()=>lightRelations(c.id,false));
    g.addEventListener("focus",()=>lightRelations(c.id,true));
    g.addEventListener("blur",()=>lightRelations(c.id,false));
  });

  // central hub
  const hub=el("g",{class:"hub"},root);
  el("circle",{class:"hub-ring",cx,cy,r:74},hub);
  el("circle",{class:"hub-ring",cx,cy,r:92,opacity:.25},hub);
  el("circle",{class:"hub-core",cx,cy,r:52},hub);
  const ht=el("text",{class:"hub-lbl",x:cx,y:cy+6},hub);
  ht.textContent=REGION.hub;
  // keep hub label from overflowing the core on longer region names
  if(REGION.hub.length>10) ht.setAttribute("font-size","14");

  applyView();
}

function lightRelations(id,on){
  qa(".rel-line",svg).forEach(l=>{
    if(l.dataset.a===id||l.dataset.b===id) l.classList.toggle("lit",on);
  });
}

/* ---- pan & zoom ----
   Transform scales around the viewBox centre, then applies pan (view.x/y).
   Keeping the pivot at centre means a default zoom never drifts off-frame. */
function applyView(){
  const root=q("#maproot",svg);
  if(!root) return;
  const cx=VB.w/2, cy=VB.h/2;
  const tx = view.x + cx - cx*view.s;
  const ty = view.y + cy - cy*view.s;
  root.setAttribute("transform",`translate(${tx} ${ty}) scale(${view.s})`);
}
function clampView(){
  view.s=Math.max(.55,Math.min(2.6,view.s));
}
(function interactions(){
  let dragging=false,lx=0,ly=0,moved=0;
  svg.addEventListener("pointerdown",e=>{
    if(e.target.closest(".node"))return;         // let node clicks through
    dragging=true;moved=0;lx=e.clientX;ly=e.clientY;svg.classList.add("grabbing");
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener("pointermove",e=>{
    if(!dragging)return;
    const k=VB.w/svg.clientWidth; // logical per css px (approx; viewBox is width-fit)
    const dx=(e.clientX-lx),dy=(e.clientY-ly); moved+=Math.abs(dx)+Math.abs(dy);
    view.x+=dx*k; view.y+=dy*k; lx=e.clientX;ly=e.clientY; applyView();
  });
  const end=e=>{dragging=false;svg.classList.remove("grabbing");};
  svg.addEventListener("pointerup",end); svg.addEventListener("pointercancel",end);
  svg.addEventListener("wheel",e=>{
    e.preventDefault();
    const factor=e.deltaY<0?1.12:0.89;
    view.s*=factor; clampView(); applyView();
  },{passive:false});
})();

/* zoom the map toward a node before switching to concept (the "push in") */
function zoomToNode(id,then){
  const p=nodePos[id]; if(!p||reduce){then();return;}
  const root=q("#maproot",svg);
  const cx=VB.w/2, cy=VB.h/2;
  const targetS=2.6;
  // With centre-pivot: screen pos of node = (p - c)*s + c + pan.
  // Want node at centre c  =>  pan = -(p - c)*s.
  const px=-(p.x-cx)*targetS, py=-(p.y-cy)*targetS;
  const tx = px + cx - cx*targetS, ty = py + cy - cy*targetS;
  root.style.transition="transform .6s cubic-bezier(.5,.02,.5,1)";
  root.style.opacity=".0"; // fade as we push in
  root.setAttribute("transform",`translate(${tx} ${ty}) scale(${targetS})`);
  setTimeout(()=>{ root.style.transition="";root.style.opacity=""; then(); },540);
}

/* ===========================================================
   CONCEPT VIEW
   =========================================================== */
function highlight(text){
  // light syntactic coloring for the code panel
  let t=text.replace(/[&<>]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[m]));
  // comments (# ... or ! ...) whole-line
  t=t.split("\n").map(line=>{
    const cm=line.match(/^(\s*)([#!].*)$/);
    if(cm) return `${cm[1]}<span class="cmt">${cm[2]}</span>`;
    // inline trailing comment after 2+ spaces
    line=line.replace(/( {2,}[#!].*)$/,'<span class="cmt">$1</span>');
    line=line.replace(/\b(\d+(?:\.\d+)*(?:\/\d+)?)\b/g,'<span class="num">$1</span>');
    line=line.replace(/\b(SYN|ACK|FIN|RST|GET|POST|PUT|DELETE|SELECT|UNION|WHERE|FROM|INSERT|UPDATE|TCP|UDP|IP|TLS|ESP|IKE|permit|deny|interface|switchport|mode|trunk|vlan|show|ping|traceroute|sudo|tcpdump|nmap|curl|gobuster|ffuf|nikto|searchsploit|hydra|smbclient|ldapsearch|dig|openssl|msfconsole|exploit|whoami|hostname|import|def|func|fn|let|const|return|print|package|public|void)\b/g,'<span class="key">$1</span>');
    return line;
  }).join("\n");
  return t;
}

function relatedChipsHTML(c){
  if(!c.links||!c.links.length) return "";
  let h=`<div class="c-related"><div class="rl">Connected concepts</div><div class="chips">`;
  c.links.forEach(lid=>{const lc=byId(lid); if(lc) h+=`<button class="chip" data-go="${lid}">${lc.title}</button>`;});
  return h+`</div></div>`;
}
function wireChips(root){
  qa(".chip",root).forEach(ch=>ch.addEventListener("click",()=>{
    const to=ch.dataset.go;
    const col=root.closest(".c-read")||root.parentElement;
    col.animate?.([{opacity:.3},{opacity:1}],{duration:260});
    openConcept(to);
  }));
}

function openConcept(id){
  const c=byId(id); if(!c)return;
  if(c.kind==="steps") return openSteps(c);

  const cl=clusterOf(c.cluster);
  const read=q("#cRead"), side=q("#cSide"), scene=q("#concept");
  scene.className="scene accent-"+cl.accent;
  q(".c-grid").classList.remove("steps-mode");
  // read column
  let html=`<div class="c-eyebrow"><span class="pip"></span>${cl.label}</div>`;
  html+=`<h2>${c.title}</h2>`;
  if(c.stub) html+=`<div class="c-stub-note">Draft summary — full detail coming in the next pass</div>`;
  html+=`<p class="c-short">${c.short}</p>`;
  c.body.forEach(b=>{
    html+=`<div class="c-block"><h3>${b.h}</h3>`;
    if(b.list){ html+="<ul>"+b.list.map(li=>`<li>${li}</li>`).join("")+"</ul>"; }
    else{ html+=`<p>${b.p}</p>`; }
    html+="</div>";
  });
  html+=relatedChipsHTML(c);
  read.innerHTML=html; read.parentElement.scrollTop=0;
  wireChips(read);

  // side code
  const code=c.code||{lang:"text",label:"",text:"// no snippet"};
  side.style.display="";
  side.innerHTML=
    `<div class="c-side-head"><span class="lang">${code.lang}</span><span class="cap">${code.label||""}</span></div>`+
    `<pre class="c-code">${highlight(code.text)}</pre>`+
    `<button class="copy-btn" id="copyBtn">copy snippet</button>`;
  const cp=q("#copyBtn",side);
  cp.addEventListener("click",()=>{
    navigator.clipboard?.writeText(code.text).then(()=>{cp.textContent="copied ✓";setTimeout(()=>cp.textContent="copy snippet",1400);});
  });

  if(current==="map"){ zoomToNode(id,()=>go("concept")); }
  else { go("concept"); }
}

/* ---------- STEPS VIEW (process walkthroughs) ---------- */
function openSteps(c){
  const cl=clusterOf(c.cluster);
  const read=q("#cRead"), side=q("#cSide"), scene=q("#concept");
  scene.className="scene accent-"+cl.accent;
  q(".c-grid").classList.add("steps-mode");
  side.style.display="none";

  let html=`<div class="c-eyebrow"><span class="pip"></span>${cl.label}</div>`;
  html+=`<h2>${c.title}</h2>`;
  html+=`<p class="c-short">${c.short}</p>`;
  html+=`<ol class="stepper">`;
  c.steps.forEach((s,i)=>{
    html+=`<li class="step" data-i="${i}">
      <button class="step-head" aria-expanded="false">
        <span class="step-num">${i+1}</span>
        <span class="step-head-txt"><span class="step-title">${s.title}</span>
          <span class="step-summary">${s.summary||""}</span></span>
        <span class="step-chev" aria-hidden="true">▾</span>
      </button>
      <div class="step-body" hidden>
        <p>${s.detail}</p>
        ${s.code?`<div class="step-code-head"><span class="lang">${s.code.lang||"text"}</span></div>
          <pre class="c-code step-code">${highlight(s.code.text)}</pre>`:""}
      </div></li>`;
  });
  html+=`</ol>`;
  html+=relatedChipsHTML(c);
  read.innerHTML=html; read.parentElement.scrollTop=0;
  wireChips(read);

  // expand / collapse behaviour (accordion: one open at a time, but toggleable)
  qa(".step",read).forEach(step=>{
    const head=q(".step-head",step), body=q(".step-body",step);
    head.addEventListener("click",()=>{
      const open=step.classList.contains("open");
      qa(".step",read).forEach(s2=>{
        s2.classList.remove("open");
        q(".step-head",s2).setAttribute("aria-expanded","false");
        q(".step-body",s2).hidden=true;
      });
      if(!open){
        step.classList.add("open"); head.setAttribute("aria-expanded","true"); body.hidden=false;
        step.scrollIntoView({block:"nearest",behavior:reduce?"auto":"smooth"});
      }
    });
  });
  // open the first step by default so the view is never a bare list
  const first=q(".step",read); if(first) q(".step-head",first).click();

  if(current==="map"){ zoomToNode(c.id,()=>go("concept")); }
  else { go("concept"); }
}

/* ---------- back buttons ---------- */
qa(".back").forEach(b=>b.addEventListener("click",()=>{
  const to=b.dataset.to;
  if(to==="map"){ enterMap(); }          // rebuild + reset zoom state cleanly
  go(to);
}));

/* reset map zoom when entering map fresh.
   On wide screens the square viewBox leaves big side margins, so nudge zoom up. */
function defaultZoom(){
  // viewBox uses xMidYMid meet: on wide screens it fits to HEIGHT (side margins),
  // on tall screens it fits to WIDTH (top/bottom margins). Zoom only to reclaim
  // the margin on the axis that has slack — never past the fitted axis.
  const r = innerWidth/innerHeight;
  if(r < 0.72) return 1.0;      // tall phone: width-fit already fills; keep 1
  return 1.0;
}
const REGION_SUBTITLE = {
  networking: "the chain of decisions behind every packet",
  pentesting: "observe, hypothesise, verify, prove impact — then report",
  programming: "the languages and frameworks security work is built on",
};
function enterMap(){
  view.x=0;view.y=0;view.s=defaultZoom();
  const mt=q(".map-title");
  if(mt){ mt.innerHTML = `${REGION.hub}<small>${REGION_SUBTITLE[REGION_ID]||""}</small>`; }
  buildMap();
}

/* keyboard: Escape backs out */
addEventListener("keydown",e=>{
  if(e.key==="Escape"){
    if(current==="concept") go("map");
    else if(current==="map") go("galaxy");
    else if(current==="galaxy") go("title");
  }
});

/* build once so it's ready */
buildMap();
})();
