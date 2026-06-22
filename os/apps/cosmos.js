// cosmos.js — Powers of Ten infinite-zoom app for dhruvOS
// No-build ES module. Ported from mockups/zoom.html.
import content from '../shell/content.js';
import { mountContactStrip } from '../shell/contactStrip.js';

function techChip(t) {
  return `<span style="display:inline-block;font-size:9px;color:rgba(92,255,208,0.55);border:1px solid rgba(92,255,208,0.2);padding:2px 8px;margin:2px;letter-spacing:.07em;font-family:'JetBrains Mono',monospace">${t}</span>`;
}

function buildCardDefs() {
  const { identity, skills, projects } = content;
  const p0 = projects[0]; // Reddit Growth Copilot — main quest
  return [
    {
      id: 'galaxy',
      html: `<div style="font:700 28px/1.1 'JetBrains Mono',monospace;color:#5cffd0;letter-spacing:.06em">${identity.name}</div>
             <div style="font:400 12px/1.4 'JetBrains Mono',monospace;color:rgba(92,255,208,0.45);letter-spacing:.14em;margin-top:8px">${identity.tagline.toUpperCase()}</div>
             <div style="font-size:10px;color:rgba(92,255,208,0.3);letter-spacing:.12em;margin-top:8px">${identity.role} · ${identity.location}</div>`,
      start: 0, peak: .5, end: 1,
    },
    {
      id: 'planet',
      html: `<div style="font-size:9px;letter-spacing:.28em;color:rgba(92,255,208,0.35);margin-bottom:10px;font-family:'JetBrains Mono',monospace">PALE BLUE DOT</div>
             <div style="font-size:13px;color:rgba(92,255,208,0.6);line-height:1.7;font-family:'JetBrains Mono',monospace">Earth, Solar System, Milky Way<br>somewhere in all of this —<br>a developer who builds things</div>`,
      start: 1, peak: 1.5, end: 2,
    },
    {
      id: 'city',
      html: `<div style="font-size:9px;letter-spacing:.28em;color:rgba(92,255,208,0.35);margin-bottom:10px;font-family:'JetBrains Mono',monospace">CITY SCALE</div>
             <div style="font-size:13px;color:rgba(92,255,208,0.6);line-height:1.7;font-family:'JetBrains Mono',monospace">Based in Mumbai, India<br>working across web, systems &amp; graphics</div>`,
      start: 2, peak: 2.5, end: 3,
    },
    {
      id: 'desk',
      html: `<div style="font-size:9px;letter-spacing:.28em;color:rgba(92,255,208,0.35);margin-bottom:10px;font-family:'JetBrains Mono',monospace">SELECTED WORK</div>
             <div style="font-size:15px;color:#5cffd0;letter-spacing:.04em;margin-bottom:6px;font-family:'JetBrains Mono',monospace;font-weight:700">${p0.name}</div>
             <div style="font-size:11px;color:rgba(92,255,208,0.5);line-height:1.65;font-family:'JetBrains Mono',monospace;margin-bottom:10px">${p0.tagline}</div>
             <div>${p0.tech.map(techChip).join('')}</div>`,
      start: 3, peak: 3.5, end: 4,
    },
    {
      id: 'eye',
      html: `<div style="font-size:9px;letter-spacing:.28em;color:rgba(92,255,208,0.35);margin-bottom:10px;font-family:'JetBrains Mono',monospace">THE BUILDER</div>
             <div style="font-size:12px;color:rgba(92,255,208,0.55);line-height:1.8;font-family:'JetBrains Mono',monospace">I build things that work at every scale —<br>from system architecture to pixel-perfect UI.<br>Obsessed with the craft.</div>`,
      start: 4, peak: 4.5, end: 5,
    },
    {
      id: 'neuron',
      html: `<div style="font-size:9px;letter-spacing:.28em;color:rgba(92,255,208,0.35);margin-bottom:10px;font-family:'JetBrains Mono',monospace">CORE SKILLS</div>
             <div style="margin-bottom:12px">${skills.map(s => techChip(s.label)).join('')}</div>`,
      start: 4.8, peak: 5, end: 5.5,
    },
  ];
}

export default {
  id: 'cosmos',
  title: 'cosmos',
  icon: '◉',
  width: 820,
  height: 600,

  mount(body, _appCtx) {
    const DPR = Math.min(window.devicePixelRatio || 1, 1.25);

    // ── Canvas ──────────────────────────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:block;';
    body.style.position = 'relative';
    body.style.overflow = 'hidden';
    body.style.background = '#050a08';
    body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let W = 0, H = 0;
    function resize() {
      W = body.clientWidth;
      H = body.clientHeight;
      canvas.width  = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
    }
    resize();

    // ── UI overlays ─────────────────────────────────────────────────────────
    const ui = document.createElement('div');
    ui.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:10;font-family:"JetBrains Mono",monospace,monospace;';

    // Progress bar (top)
    const bar = document.createElement('div');
    bar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:2px;background:rgba(60,200,120,.15);';
    const barFill = document.createElement('div');
    barFill.style.cssText = 'height:100%;width:0%;background:rgba(60,200,120,.7);transition:width .06s linear;';
    bar.appendChild(barFill);
    ui.appendChild(bar);

    // Scale label (top-center)
    const scaleLbl = document.createElement('div');
    scaleLbl.style.cssText = [
      'position:absolute', 'top:10px', 'left:50%', 'transform:translateX(-50%)',
      "font:700 13px 'JetBrains Mono',monospace", 'letter-spacing:.18em',
      'color:#ffb000', 'opacity:.9', 'white-space:nowrap', 'text-transform:uppercase',
    ].join(';');
    scaleLbl.textContent = '10²⁶ m — GALACTIC';
    ui.appendChild(scaleLbl);

    // Hint (bottom-center)
    const hint = document.createElement('div');
    hint.style.cssText = [
      'position:absolute', 'bottom:46px', 'left:50%', 'transform:translateX(-50%)',
      "font:10px 'JetBrains Mono',monospace", 'letter-spacing:.12em',
      'color:rgba(92,255,208,0.25)', 'transition:opacity .8s', 'white-space:nowrap',
    ].join(';');
    hint.textContent = 'scroll or drag to zoom through scales';
    ui.appendChild(hint);

    // Content overlay (center)
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;';
    ui.appendChild(overlay);

    body.appendChild(ui);

    // ── Content cards (from content.js) ────────────────────────────────────
    const CARD_DEFS = buildCardDefs();

    const cardEls = {};
    CARD_DEFS.forEach(c => {
      const el = document.createElement('div');
      el.style.cssText = [
        'position:absolute', 'text-align:center', 'opacity:0',
        'max-width:480px', 'padding:0 32px', 'transition:opacity .05s',
        'background:rgba(5,10,8,0.7)', 'border:1px solid rgba(92,255,208,0.1)',
        'padding:20px 28px', 'backdrop-filter:blur(2px)',
      ].join(';');
      el.innerHTML = c.html;
      overlay.appendChild(el);
      cardEls[c.id] = el;
    });

    // ── Scale ranges for label ──────────────────────────────────────────────
    const SCALE_RANGES = [
      [0,   .8,  '10²⁶ m — GALACTIC'],
      [.8,  1.8, '10⁷ m — PLANETARY'],
      [1.8, 2.8, '10⁴ m — CITY'],
      [2.8, 3.8, '10⁰ m — HUMAN'],
      [3.8, 4.8, '10⁻² m — CELLULAR'],
      [4.8, 5,   '10⁻¹⁰ m — QUANTUM'],
    ];
    function getScaleLabel(s) {
      for (const [a, b, lbl] of SCALE_RANGES) if (s >= a && s < b) return lbl;
      return SCALE_RANGES[SCALE_RANGES.length - 1][2];
    }

    // ── Zoom state ──────────────────────────────────────────────────────────
    const MAX_S = 5;
    const SCROLL_SPEED = 0.0018;
    let targetS = 0, scrollS = 0;
    let hintHidden = false;

    function hideHint() {
      if (!hintHidden) { hint.style.opacity = '0'; hintHidden = true; }
    }

    // Wheel
    function onWheel(e) {
      e.preventDefault();
      e.stopPropagation();
      targetS = Math.max(0, Math.min(MAX_S, targetS + e.deltaY * SCROLL_SPEED));
      hideHint();
    }

    // Pointer drag (vertical)
    let dragY = null;
    function onPointerDown(e) {
      if (e.button !== 0) return;
      dragY = e.clientY;
      body.setPointerCapture(e.pointerId);
      hideHint();
    }
    function onPointerMove(e) {
      if (dragY === null) return;
      const dy = dragY - e.clientY;
      dragY = e.clientY;
      targetS = Math.max(0, Math.min(MAX_S, targetS + dy * 0.006));
    }
    function onPointerUp() { dragY = null; }

    body.addEventListener('wheel',        onWheel,       { passive: false });
    body.addEventListener('pointerdown',  onPointerDown);
    body.addEventListener('pointermove',  onPointerMove);
    body.addEventListener('pointerup',    onPointerUp);
    body.addEventListener('pointercancel',onPointerUp);
    body.style.cursor = 'ns-resize';
    body.style.touchAction = 'none';

    // ── ResizeObserver ──────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => resize());
    ro.observe(body);

    // ── Procedural draw functions (ported verbatim, ctx param renamed c) ────
    function rng1(i) { let x = Math.sin(i * 127.1 + 42) * 43758.5453; return x - Math.floor(x); }
    function rng2(i) { let x = Math.sin(i * 91.3) * 5371.2; return x - Math.floor(x); }
    function rng3(i) { let x = Math.sin(i * 53.7) * 7312.4; return x - Math.floor(x); }
    function rng4(i) { let x = Math.sin(i * 179.3) * 3141.5; return x - Math.floor(x); }

    function drawGalaxy(c, w, h, t, alpha) {
      c.save(); c.globalAlpha = alpha;
      const bg = c.createRadialGradient(w/2,h/2,0,w/2,h/2,Math.max(w,h)*.7);
      bg.addColorStop(0,'#0a0418'); bg.addColorStop(1,'#000');
      c.fillStyle = bg; c.fillRect(0,0,w,h);
      for (let i = 0; i < 400; i++) {
        const sx=rng1(i*3)*w, sy=rng1(i*3+1)*h, sr=rng1(i*3+2)*1.5+.3;
        const tw=.5+.5*Math.sin(t*.5+i*.7);
        c.beginPath(); c.arc(sx,sy,sr,0,Math.PI*2);
        c.fillStyle=`rgba(200,200,255,${(.3+.4*tw)*alpha})`; c.fill();
      }
      c.translate(w/2,h/2);
      for (let arm = 0; arm < 3; arm++) {
        const aOff = arm*(Math.PI*2/3)+t*.04;
        for (let j = 0; j < 180; j++) {
          const ang=aOff+j*.08, r=j*2.2;
          const x=Math.cos(ang)*r, y=Math.sin(ang)*r*.42;
          const sz=Math.max(.5,2.5-j*.01), bright=Math.max(0,1-j/180);
          c.beginPath(); c.arc(x,y,sz,0,Math.PI*2);
          c.fillStyle=`rgba(${160+arm*20},${120+arm*10},${220-arm*20},${bright*.7})`; c.fill();
        }
      }
      const glow=c.createRadialGradient(0,0,0,0,0,80);
      glow.addColorStop(0,'rgba(255,220,180,.7)'); glow.addColorStop(.4,'rgba(200,120,255,.2)'); glow.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=glow; c.beginPath(); c.arc(0,0,80,0,Math.PI*2); c.fill();
      c.restore();
    }

    function drawPlanet(c, w, h, t, alpha) {
      c.save(); c.globalAlpha = alpha;
      c.fillStyle='#000508'; c.fillRect(0,0,w,h);
      for (let i = 0; i < 120; i++) {
        c.beginPath(); c.arc(rng2(i)*w,rng2(i+1)*h,rng2(i+2)*.8+.2,0,Math.PI*2);
        c.fillStyle=`rgba(255,255,255,${.2+rng2(i+3)*.5})`; c.fill();
      }
      c.translate(w/2,h/2);
      const R=Math.min(w,h)*.28;
      const planet=c.createRadialGradient(-R*.3,-R*.3,R*.05,-R*.1,-R*.1,R*1.1);
      planet.addColorStop(0,'#7ab8ff'); planet.addColorStop(.35,'#3a7acf');
      planet.addColorStop(.65,'#1a4a8f'); planet.addColorStop(.85,'#0a2050'); planet.addColorStop(1,'#020810');
      c.beginPath(); c.arc(0,0,R,0,Math.PI*2); c.fillStyle=planet; c.fill();
      c.save(); c.clip();
      c.fillStyle='rgba(60,120,60,.7)';
      [[-.2,-.1,.18],[.1,.2,.12],[-.15,.25,.09],[.25,-.2,.14]].forEach(([bx,by,br])=>{
        c.beginPath(); c.arc(bx*R,by*R,br*R,0,Math.PI*2); c.fill();
      });
      c.fillStyle='rgba(255,255,255,.18)';
      for (let i = 0; i < 6; i++) {
        const ang=t*.3+i*1.05, cr=R*(.4+Math.sin(i*7.3)*.3);
        c.beginPath(); c.ellipse(Math.cos(ang)*cr,Math.sin(ang)*cr*.4,R*.12,R*.04,ang,0,Math.PI*2); c.fill();
      }
      c.restore();
      const atm=c.createRadialGradient(0,0,R*.9,0,0,R*1.18);
      atm.addColorStop(0,'rgba(100,160,255,.35)'); atm.addColorStop(1,'rgba(0,40,120,0)');
      c.beginPath(); c.arc(0,0,R*1.18,0,Math.PI*2); c.fillStyle=atm; c.fill();
      c.restore();
    }

    function drawCity(c, w, h, t, alpha) {
      c.save(); c.globalAlpha = alpha;
      const sky=c.createLinearGradient(0,0,0,h);
      sky.addColorStop(0,'#020612'); sky.addColorStop(.6,'#0a0f28'); sky.addColorStop(1,'#1a1020');
      c.fillStyle=sky; c.fillRect(0,0,w,h);
      c.save(); c.translate(w*.78,h*.15);
      const moonG=c.createRadialGradient(-4,-4,2,-2,-2,28);
      moonG.addColorStop(0,'#fffde8'); moonG.addColorStop(.7,'#c8c89a'); moonG.addColorStop(1,'rgba(200,200,160,0)');
      c.beginPath(); c.arc(0,0,26,0,Math.PI*2); c.fillStyle=moonG; c.fill();
      c.restore();
      for (let i = 0; i < 80; i++) {
        c.beginPath(); c.arc(rng3(i)*w,rng3(i+1)*h*.5,rng3(i+2)*.7+.2,0,Math.PI*2);
        c.fillStyle=`rgba(255,255,255,${.15+rng3(i+3)*.4})`; c.fill();
      }
      const ground=h*.68;
      c.fillStyle='#080818';
      const buildings=[
        [0,.28],[.05,.35],[.08,.22],[.13,.42],[.17,.3],[.2,.38],[.24,.55],[.28,.45],
        [.32,.35],[.36,.6],[.4,.48],[.44,.38],[.48,.65],[.52,.5],[.56,.42],[.6,.58],
        [.64,.44],[.68,.36],[.72,.5],[.76,.38],[.8,.28],[.84,.44],[.88,.32],[.92,.38],[.96,.25],[1,.3]
      ];
      c.beginPath(); c.moveTo(0,h);
      for (let i = 0; i < buildings.length-1; i++) {
        const [bx,bh]=buildings[i],[nx]=buildings[i+1];
        const bw=(nx-bx)*w, bX=bx*w, bY=ground-bh*h*.5;
        c.lineTo(bX,ground); c.lineTo(bX,bY); c.lineTo(bX+bw,bY); c.lineTo(bX+bw,ground);
      }
      c.lineTo(w,h); c.closePath(); c.fill();
      for (let i = 0; i < 200; i++) {
        if (rng4(i) > .5) continue;
        const wx=rng4(i+1)*w, wy=ground-rng4(i+2)*(h*.5)*.9;
        const warm=rng4(i+3)>.6, flicker=.7+.3*Math.sin(t*2+i*3.7);
        c.fillStyle=warm?`rgba(255,220,120,${.4*flicker})`:`rgba(150,200,255,${.35*flicker})`;
        c.fillRect(wx,wy,2,2);
      }
      const refl=c.createLinearGradient(0,ground,0,h);
      refl.addColorStop(0,'rgba(20,30,60,.8)'); refl.addColorStop(1,'rgba(5,8,20,.95)');
      c.fillStyle=refl; c.fillRect(0,ground,w,h-ground);
      c.restore();
    }

    function drawDesk(c, w, h, t, alpha) {
      c.save(); c.globalAlpha = alpha;
      const room=c.createLinearGradient(0,0,0,h);
      room.addColorStop(0,'#0d0d14'); room.addColorStop(.5,'#111118'); room.addColorStop(1,'#181820');
      c.fillStyle=room; c.fillRect(0,0,w,h);
      const cx=w/2, cy=h/2;
      c.save(); c.translate(cx,cy);
      const dW=Math.min(w*.7,500), dH=80;
      const desk=c.createLinearGradient(0,-10,0,dH);
      desk.addColorStop(0,'#2a2418'); desk.addColorStop(1,'#1a1610');
      c.fillStyle=desk; c.fillRect(-dW/2,-20,dW,dH+20);
      const mW=Math.min(w*.35,240), mH=mW*.6;
      c.fillStyle='#222230'; c.fillRect(-mW/2-8,-mH-30,mW+16,mH+8);
      const screen=c.createLinearGradient(-mW/2,-mH-28,mW/2,-28);
      screen.addColorStop(0,'#0a1428'); screen.addColorStop(.3,'#0d1f3a');
      screen.addColorStop(.7,'#102040'); screen.addColorStop(1,'#081428');
      c.fillStyle=screen; c.fillRect(-mW/2,-mH-28,mW,mH);
      const lines=['> Reddit Growth Copilot','  phase 6 complete ✓','  mock-mode active','  key-free design','','> git push origin main','  [main] feat: dashboard'];
      c.font=`${Math.max(7,mW*.038)}px "JetBrains Mono",monospace`; c.textAlign='left';
      lines.forEach((line,i)=>{
        c.fillStyle=line.startsWith('>')?'rgba(80,160,255,.9)':'rgba(60,180,100,.7)';
        c.fillText(line,-mW/2+8,-mH-24+i*(mH*.13));
      });
      if (Math.sin(t*2.5)>0){
        c.fillStyle='rgba(80,255,180,.8)';
        c.fillRect(-mW/2+8+(lines[lines.length-1].length*mW*.022),-mH-24+(lines.length-1)*mH*.13-8,6,11);
      }
      c.fillStyle='#1a1a24'; c.fillRect(-12,-28,24,20); c.fillRect(-30,-10,60,6);
      c.fillStyle='#1c1c2a'; c.fillRect(-dW*.32,-6,dW*.64,26);
      c.strokeStyle='#2a2a3a'; c.lineWidth=1;
      for (let row=0;row<3;row++) for (let col=0;col<12;col++) c.strokeRect(-dW*.3+col*dW*.05,row*8-2,dW*.044,6);
      c.fillStyle='#2a1a10'; c.fillRect(dW*.3,-18,22,24);
      c.fillStyle='#3a2a18'; c.fillRect(dW*.3+2,-16,18,3);
      const sglow=c.createRadialGradient(0,-mH/2-28,10,0,-mH/2-28,mW*.8);
      sglow.addColorStop(0,`rgba(40,100,200,${.15+.05*Math.sin(t)})`); sglow.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=sglow; c.fillRect(-mW,-mH-80,mW*2,mH+60);
      c.restore(); c.restore();
    }

    function drawEye(c, w, h, t, alpha) {
      c.save(); c.globalAlpha = alpha;
      c.fillStyle='#040408'; c.fillRect(0,0,w,h);
      c.translate(w/2,h/2);
      const R=Math.min(w,h)*.32;
      c.save(); c.scale(1,.55);
      const scl=c.createRadialGradient(0,0,R*.1,0,0,R);
      scl.addColorStop(0,'#f0ede5'); scl.addColorStop(.7,'#e0ddd5'); scl.addColorStop(1,'#c8c5bc');
      c.beginPath(); c.arc(0,0,R,0,Math.PI*2); c.fillStyle=scl; c.fill();
      c.restore();
      c.save(); c.beginPath(); c.ellipse(0,0,R*1.05,R*.55,0,0,Math.PI*2); c.clip();
      const irisR=R*.45;
      const iris=c.createRadialGradient(0,0,irisR*.05,0,0,irisR);
      iris.addColorStop(0,'#1a3a5a'); iris.addColorStop(.4,'#2a6080');
      iris.addColorStop(.75,'#3a7a5a'); iris.addColorStop(1,'#1a3030');
      c.beginPath(); c.arc(0,0,irisR,0,Math.PI*2); c.fillStyle=iris; c.fill();
      c.save(); c.clip();
      for (let i=0;i<40;i++){
        const ang=i*(Math.PI*2/40)+t*.05;
        c.strokeStyle=`rgba(${80+i*3},${150+i*2},120,0.3)`; c.lineWidth=.8;
        c.beginPath(); c.moveTo(Math.cos(ang)*irisR*.2,Math.sin(ang)*irisR*.2);
        c.lineTo(Math.cos(ang)*irisR,Math.sin(ang)*irisR); c.stroke();
      }
      c.restore();
      const pupilR=irisR*.38;
      c.beginPath(); c.arc(0,0,pupilR,0,Math.PI*2); c.fillStyle='#000'; c.fill();
      c.beginPath(); c.arc(-pupilR*.25,-pupilR*.3,pupilR*.18,0,Math.PI*2);
      c.fillStyle='rgba(255,255,255,.6)'; c.fill();
      c.restore();
      c.fillStyle='#040408';
      c.beginPath(); c.ellipse(0,-R*.55,R*1.08,R*.58,0,Math.PI,Math.PI*2); c.fill();
      c.beginPath(); c.ellipse(0,R*.55,R*1.08,R*.58,0,0,Math.PI); c.fill();
      c.strokeStyle='rgba(20,15,10,.8)'; c.lineWidth=2;
      for (let i=-5;i<=5;i++){
        const ang=(i/5)*Math.PI*.55;
        const x0=Math.sin(ang)*R, y0=-Math.abs(Math.cos(ang))*R*.54;
        c.beginPath(); c.moveTo(x0,y0); c.lineTo(x0*1.08,y0-12); c.stroke();
      }
      c.restore();
    }

    function drawNeuron(c, w, h, t, alpha) {
      c.save(); c.globalAlpha = alpha;
      c.fillStyle='#000206'; c.fillRect(0,0,w,h);
      c.translate(w/2,h/2);
      const R=Math.min(w,h)*.18;
      const dendCount=7;
      for (let d=0;d<dendCount;d++){
        const baseAng=d*(Math.PI*2/dendCount)+t*.03;
        c.strokeStyle=`rgba(60,${120+d*15},200,0.4)`; c.lineWidth=1.5;
        let x=0, y=0;
        c.beginPath(); c.moveTo(x,y);
        for (let seg=0;seg<5;seg++){
          const segAng=baseAng+Math.sin(t*.2+d+seg)*0.4;
          const segL=R*(.6+seg*.3);
          x+=Math.cos(segAng)*segL*.4; y+=Math.sin(segAng)*segL*.4;
          c.lineTo(x,y);
          if(seg===3){
            c.moveTo(x,y); c.lineTo(x+Math.cos(segAng+.6)*R*.4,y+Math.sin(segAng+.6)*R*.4);
            c.moveTo(x,y); c.lineTo(x+Math.cos(segAng-.5)*R*.35,y+Math.sin(segAng-.5)*R*.35);
            c.moveTo(x,y);
          }
        }
        c.stroke();
        const pulse=.5+.5*Math.sin(t*2+d*1.3);
        c.beginPath(); c.arc(x,y,3,0,Math.PI*2);
        c.fillStyle=`rgba(100,200,255,${pulse*.7})`; c.fill();
      }
      const body2=c.createRadialGradient(0,0,R*.05,0,0,R);
      body2.addColorStop(0,'rgba(120,180,255,.9)'); body2.addColorStop(.5,'rgba(60,100,200,.6)'); body2.addColorStop(1,'rgba(20,40,100,.1)');
      c.beginPath(); c.arc(0,0,R,0,Math.PI*2); c.fillStyle=body2; c.fill();
      const nuc=c.createRadialGradient(0,0,1,0,0,R*.4);
      nuc.addColorStop(0,'rgba(200,230,255,.9)'); nuc.addColorStop(1,'rgba(80,120,200,.3)');
      c.beginPath(); c.arc(0,0,R*.4,0,Math.PI*2); c.fillStyle=nuc; c.fill();
      for (let o=0;o<3;o++){
        const oAng=t*.8+o*(Math.PI*2/3), oRx=R*1.8, oRy=R*.5;
        const ox=Math.cos(oAng)*oRx, oy=Math.sin(oAng)*oRy;
        c.beginPath(); c.arc(ox,oy,4,0,Math.PI*2);
        c.fillStyle=`rgba(180,220,255,${.6+.4*Math.sin(oAng)})`; c.fill();
        c.beginPath(); c.ellipse(0,0,oRx,oRy,0,0,Math.PI*2);
        c.strokeStyle='rgba(80,140,200,0.12)'; c.lineWidth=1; c.stroke();
      }
      const pRad=R*(1+.3*((t*.5)%1)), pA=Math.max(0,.5-((t*.5)%1)*.5);
      c.beginPath(); c.arc(0,0,pRad,0,Math.PI*2);
      c.strokeStyle=`rgba(100,180,255,${pA})`; c.lineWidth=2; c.stroke();
      c.restore();
    }

    // ── Layer definitions ───────────────────────────────────────────────────
    const LAYERS = [
      { draw: drawGalaxy,  sIn: 0,   sOut: 1.3 },
      { draw: drawPlanet,  sIn: 0.7, sOut: 2.3 },
      { draw: drawCity,    sIn: 1.7, sOut: 3.3 },
      { draw: drawDesk,    sIn: 2.7, sOut: 4.3 },
      { draw: drawEye,     sIn: 3.7, sOut: 5.0 },
      { draw: drawNeuron,  sIn: 4.6, sOut: 6.0 },
    ];

    function layerAlpha(layer, s) {
      const FL = 0.4;
      if (s < layer.sIn || s > layer.sOut) return 0;
      return Math.min(Math.min(1, (s - layer.sIn) / FL), Math.min(1, (layer.sOut - s) / FL));
    }

    function cardAlpha(card, s) {
      if (s < card.start || s > card.end) return 0;
      if (s <= card.peak) return (s - card.start) / (card.peak - card.start);
      return 1 - (s - card.peak) / (card.end - card.peak);
    }

    // ── Render loop ─────────────────────────────────────────────────────────
    let lastTs = 0, t = 0, rafId = null;

    function frame(ts) {
      const dt = Math.min((ts - lastTs) / 1000, .05); lastTs = ts; t += dt;
      scrollS += (targetS - scrollS) * .1;
      const s = scrollS;

      ctx.save();
      ctx.scale(DPR, DPR);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);

      LAYERS.forEach(layer => {
        const a = layerAlpha(layer, s);
        if (a > 0.005) layer.draw(ctx, W, H, t, a);
      });

      ctx.restore();

      // Update cards
      CARD_DEFS.forEach(c => {
        cardEls[c.id].style.opacity = cardAlpha(c, s);
      });

      // Progress bar
      barFill.style.width = (s / MAX_S * 100) + '%';

      // Scale label
      scaleLbl.textContent = getScaleLabel(s);

      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(ts => { lastTs = ts; rafId = requestAnimationFrame(frame); });

    const removeStrip = mountContactStrip(body);

    // ── Cleanup ─────────────────────────────────────────────────────────────
    return function cleanup() {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      removeStrip();
      body.removeEventListener('wheel',        onWheel);
      body.removeEventListener('pointerdown',  onPointerDown);
      body.removeEventListener('pointermove',  onPointerMove);
      body.removeEventListener('pointerup',    onPointerUp);
      body.removeEventListener('pointercancel',onPointerUp);
      canvas.remove();
      ui.remove();
    };
  },
};
