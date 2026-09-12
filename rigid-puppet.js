/* Rigid articulated puppet. Each texture is a complete leather part.
   Only uniform scale at assembly + rotations at real joint centers are used. */
class PuppetRig {
  static atlases = {};
  static layouts = {
    sheng:{base:{crop:[0,0,530,1024],dest:[122,50,402.8,778.24]},neck:[345,239],shoulders:[[315.04,263.56],[385.72,264.32]],lengths:[[120,110],[120,98]],arms:[
      {upper:{crop:[680,40,210,455],start:[110,53],end:[117,410]},fore:{crop:[695,530,205,460],start:[98,43],end:[113,323]}},
      {upper:{crop:[1200,45,220,442],start:[94,48],end:[82,404]},fore:{crop:[1090,530,430,390],start:[75,41],end:[154,242]}}]},
    dan:{base:{crop:[0,0,530,1024],dest:[94.64,50,402.8,778.24]},neck:[346,269],shoulders:[[302.88,303.84],[397.12,303.08]],lengths:[[120,110],[120,110]],arms:[
      {upper:{crop:[620,40,280,450],start:[187,51],end:[188,400]},fore:{crop:[690,520,280,450],start:[94,52],end:[174,305]}},
      {upper:{crop:[1130,40,280,450],start:[74,50],end:[91,398]},fore:{crop:[1135,515,385,470],start:[80,59],end:[193,260]}}]},
    jing:{base:{crop:[0,0,620,1024],dest:[122,50,471.2,778.24]},neck:[353,253],shoulders:[[283.12,308.4],[414.6,276.48]],lengths:[[125,110],[125,102]],rest:[[123,-36],[45,30]],arms:[
      {upper:{crop:[760,50,225,420],start:[83,60],end:[99,371]},fore:{crop:[760,520,190,440],start:[84,54],end:[105,259]}},
      {upper:{crop:[1115,50,240,420],start:[127,59],end:[119,372]},fore:{crop:[1150,465,275,550],start:[69,131],end:[109,310]}}]}
  };
  static clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  static joint(origin,angle,length){return [origin[0]+Math.cos(angle)*length,origin[1]+Math.sin(angle)*length];}
  static poseArm(shoulder,lengths,side,input,rest){
    // Same two independent rotation channels as the original theatre.
    // Limits avoid branch switches and snapping from an IK straight-arm singularity.
    const x=PuppetRig.clamp(input.x,-75,75),y=PuppetRig.clamp(input.y,-80,55);
    const upper=(rest?rest[0]:side===0?123:57)+(side===0?1:-1)*y*1.05+x*.60;
    const flex=(rest?rest[1]:side===0?-36:-86)+x*.86-y*.72;
    const a=upper*Math.PI/180,b=(upper+PuppetRig.clamp(flex,-155,135))*Math.PI/180;
    const elbow=this.joint(shoulder,a,lengths[0]),wrist=this.joint(elbow,b,lengths[1]);
    return {shoulder,elbow,wrist,upper:a,fore:b};
  }
  constructor(image){
    this.image=image;this.canvas=document.createElement('canvas');this.canvas.className='puppet';this.canvas.style.position='absolute';this.canvas.style.inset='0';this.canvas.setAttribute('aria-hidden','true');image.after(this.canvas);
    this.ctx=this.canvas.getContext('2d');this.ready=false;this.generation=0;
  }
  async load(role){
    const generation=++this.generation,source=new Image();source.src=PuppetRig.atlases[role];
    try{await source.decode();}catch(e){this.image.style.opacity='1';this.canvas.style.opacity='0';return;}
    if(generation!==this.generation)return;
    this.role=role;this.source=this.prepareTexture(source);this.config=PuppetRig.layouts[role];this.ready=true;
    this.canvas.style.opacity='1';this.image.style.opacity='0';
    this.draw(this.last||{left:{x:0,y:0},right:{x:0,y:0}});if(this.onReady)this.onReady();
  }
  prepareTexture(source){
    // Decode neutral sprite-sheet matte as transparency, preserving coloured leather.
    const texture=document.createElement('canvas');texture.width=source.naturalWidth||source.width;texture.height=source.naturalHeight||source.height;
    const c=texture.getContext('2d',{willReadFrequently:true});c.drawImage(source,0,0);const pixels=c.getImageData(0,0,texture.width,texture.height),p=pixels.data;
    for(let i=0;i<p.length;i+=4){const low=Math.min(p[i],p[i+1],p[i+2]),high=Math.max(p[i],p[i+1],p[i+2]);if(low>155&&high-low<25)p[i+3]=0;}
    c.putImageData(pixels,0,0);return texture;
  }
  part(part,anchor,angle,length){
    const c=this.ctx,[sx,sy,sw,sh]=part.crop,[px,py]=part.start,[qx,qy]=part.end;
    const originalAngle=Math.atan2(qy-py,qx-px),scale=length/Math.hypot(qx-px,qy-py);
    c.save();c.translate(...anchor);c.rotate(angle-originalAngle);c.scale(scale,scale);
    c.drawImage(this.source,sx,sy,sw,sh,-px,-py,sw,sh);c.restore();
  }
  rivet(p,r=4){
    const c=this.ctx;c.save();const g=c.createRadialGradient(p[0]-r*.35,p[1]-r*.4,.3,p[0],p[1],r);g.addColorStop(0,'#fff0b9');g.addColorStop(.35,'#d9a64e');g.addColorStop(.8,'#835325');g.addColorStop(1,'#472c17');c.fillStyle=g;c.beginPath();c.arc(p[0],p[1],r,0,Math.PI*2);c.fill();c.restore();
  }
  draw(input){
    this.last=input;if(!this.ready||!this.ctx)return;
    const rect=this.canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
    if(w!==this.canvas.width||h!==this.canvas.height){this.canvas.width=w;this.canvas.height=h;}
    const c=this.ctx,fit=Math.min(w/700,h/900),ox=(w-700*fit)/2,oy=(h-900*fit)/2;
    this.fit={scale:fit/dpr,ox:ox/dpr,oy:oy/dpr};c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);c.setTransform(fit,0,0,fit,ox,oy);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    const cfg=this.config;this.solutions=cfg.shoulders.map((s,i)=>PuppetRig.poseArm(s,cfg.lengths[i],i,i===0?input.left:input.right,cfg.rest?.[i]));
    const arm=i=>{let a=this.solutions[i],p=cfg.arms[i];this.part(p.upper,a.shoulder,a.upper,cfg.lengths[i][0]);this.part(p.fore,a.elbow,a.fore,cfg.lengths[i][1]);this.rivet(a.elbow);this.rivet(a.wrist,3);};
    // Far arm behind complete torso; near arm above torso. No torso subtraction mask.
    arm(0);c.drawImage(this.source,...cfg.base.crop,...cfg.base.dest);arm(1);
    cfg.shoulders.forEach(s=>this.rivet(s,5));
  }
  anchor(index){if(!this.ready)return null;const p=index===1?this.config.neck:this.solutions[index===0?0:1].wrist;return {x:this.fit.ox+p[0]*this.fit.scale,y:this.fit.oy+p[1]*this.fit.scale};}
}
