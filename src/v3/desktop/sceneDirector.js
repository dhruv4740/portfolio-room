import gsap from 'gsap';

// Cold open in the true-scale room, under 8 s: in through the doorway, a slow
// push toward the desk while the lamp clicks on and the name types onto the
// monitor, then a rise to the landing view. `cue.frame(t)` gets the timeline
// time each frame; `cue.end()` runs exactly once when the shot ends or is cut.
const SHOT = [
  { at: 0, x: 1.55, y: 1.60, z: 0.95, tx: 0.30, ty: 1.10, tz: -0.50 },
  { at: 2.4, x: 0.55, y: 1.36, z: 0.62, tx: 0.02, ty: 1.08, tz: -0.30, ease: 'sine.inOut' },
  { at: 4.6, x: 0.40, y: 1.33, z: 0.50, tx: 0.00, ty: 1.08, tz: -0.30, ease: 'sine.inOut' },
];
export const COLD_OPEN = { lampAt: 1.7, typeFrom: 2.9, typeTo: 4.3, settle: 2.6 };

// Arrival has one camera owner; cancellation never invokes stale completion.
export function createSceneDirector({camera,controls,invalidate,onComplete}) {
  let timeline=null,token=0,cue=null;
  // The shot advances by at most 50 ms per tick: a load stall pauses it
  // instead of skipping ahead (the shared ticker runs on wall-clock time).
  const step=(_t,deltaMs)=>{if(timeline)timeline.time(Math.min(timeline.duration(),timeline.time()+Math.min(deltaMs,50)/1000));};
  const restore=()=>{controls.minAzimuthAngle=-.8;controls.maxAzimuthAngle=.85;controls.minPolarAngle=Math.PI*.2;controls.maxPolarAngle=Math.PI*.47;controls.enableDamping=true;};
  function cancel(){gsap.ticker.remove(step);timeline?.kill();timeline=null;token=0;const c=cue;cue=null;c?.end();restore();}
  return {
    // `warm` resolves when the room is ready enough to start; the first frame
    // is posed immediately.
    start(id,home,reduced,shotCue,warm){
      cancel();token=id;cue=shotCue||null;controls.enabled=false;controls.enableDamping=false;
      controls.minDistance=.025;controls.minAzimuthAngle=-Infinity;controls.maxAzimuthAngle=Infinity;
      controls.minPolarAngle=.01;controls.maxPolarAngle=Math.PI-.01;
      const settle=()=>{camera.position.copy(home.position);controls.target.copy(home.target);controls.update();invalidate();};
      if(reduced){settle();cancel();onComplete(id);return;}
      const p={...SHOT[0]};
      const apply=()=>{camera.position.set(p.x,p.y,p.z);controls.target.set(p.tx,p.ty,p.tz);camera.lookAt(controls.target);cue?.frame(timeline?timeline.time():0);invalidate();};
      cue?.start();apply();
      Promise.resolve(warm).catch(()=>{}).then(()=>{
        if(token!==id)return;
        timeline=gsap.timeline({paused:true,onUpdate:apply,onComplete(){settle();cancel();onComplete(id);}});
        for(let i=1;i<SHOT.length;i++){const {at,ease,...to}=SHOT[i];timeline.to(p,{...to,duration:at-SHOT[i-1].at,ease},SHOT[i-1].at);}
        timeline.to(p,{x:home.position.x,y:home.position.y,z:home.position.z,tx:home.target.x,ty:home.target.y,tz:home.target.z,duration:COLD_OPEN.settle,ease:'power2.inOut'},SHOT[SHOT.length-1].at);
        gsap.ticker.add(step);gsap.ticker.wake();
      });
    },
    cancel,
    get active(){return token!==0;},
    snapshot(){return {token,active:token!==0,progress:timeline?.progress()??1,time:timeline?.time()??null,duration:timeline?.duration()??null,position:camera.position.toArray()};},
  };
}
