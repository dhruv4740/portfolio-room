import gsap from 'gsap';

// Arrival has one camera owner; cancellation never invokes stale completion.
export function createSceneDirector({camera,controls,invalidate,onComplete}) {
  let timeline=null,token=0;
  const restore=()=>{controls.minAzimuthAngle=-.8;controls.maxAzimuthAngle=.85;controls.minPolarAngle=Math.PI*.2;controls.maxPolarAngle=Math.PI*.47;controls.enableDamping=true;};
  function cancel(){timeline?.kill();timeline=null;token=0;restore();}
  return {
    start(id,home,reduced){
      cancel();token=id;controls.enabled=false;controls.enableDamping=false;
      controls.minDistance=.025;controls.minAzimuthAngle=-Infinity;controls.maxAzimuthAngle=Infinity;
      controls.minPolarAngle=.01;controls.maxPolarAngle=Math.PI-.01;
      const settle=()=>{camera.position.copy(home.position);controls.target.copy(home.target);controls.update();invalidate();};
      if(reduced){settle();cancel();onComplete(id);return;}
      const p={x:2.17,y:1.76,z:1.23,tx:.45,ty:1.60,tz:-.65};
      const apply=()=>{camera.position.set(p.x,p.y,p.z);controls.target.set(p.tx,p.ty,p.tz);camera.lookAt(controls.target);invalidate();};
      apply();
      timeline=gsap.timeline({onUpdate:apply,onComplete(){settle();cancel();onComplete(id);}});
      timeline.to(p,{x:1.22,y:1.83,z:1.35,tx:.6,ty:1.68,tz:-.9,duration:1.9,ease:'sine.inOut'})
        .to(p,{x:home.position.x,y:home.position.y,z:home.position.z,tx:home.target.x,ty:home.target.y,tz:home.target.z,duration:3.1,ease:'power2.inOut'});
      gsap.ticker.wake();
    },
    cancel,
    get active(){return token!==0;},
    snapshot(){return {token,active:token!==0,progress:timeline?.progress()??1,position:camera.position.toArray()};},
  };
}
