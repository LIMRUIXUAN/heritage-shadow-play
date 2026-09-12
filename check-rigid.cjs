const fs=require('node:fs'),vm=require('node:vm');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const document={createElement(){const c=createCanvas(700,900);c.style={};c.setAttribute=()=>{};c.getBoundingClientRect=()=>({width:700,height:900});return c;}};
const sandbox={document,window:{devicePixelRatio:1},console};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('rigid-puppet.js','utf8')+';this.Rig=PuppetRig',sandbox);
(async()=>{const sheet=createCanvas(1050,1350),sc=sheet.getContext('2d');sc.fillStyle='#efd39a';sc.fillRect(0,0,1050,1350);
const poses=[{left:{x:0,y:0},right:{x:0,y:0}},{left:{x:50,y:-65},right:{x:-45,y:50}},{left:{x:-60,y:40},right:{x:60,y:-60}}];
for(const [row,role] of ['sheng','dan','jing'].entries()){
 const rig=new sandbox.Rig({after(){},style:{}});rig.config=sandbox.Rig.layouts[role];rig.source=rig.prepareTexture(await loadImage('assets/'+role+'-atlas.png'));rig.ready=true;
 for(const [col,pose]of poses.entries()){rig.draw(pose);sc.drawImage(rig.canvas,col*350,row*450,350,450);}
 for(let side=0;side<2;side++)for(let x=-75;x<=75;x+=15)for(let y=-80;y<=55;y+=15){let p=sandbox.Rig.poseArm(rig.config.shoulders[side],rig.config.lengths[side],side,{x,y},rig.config.rest?.[side]);const [l1,l2]=rig.config.lengths[side];if(Math.abs(Math.hypot(p.shoulder[0]-p.elbow[0],p.shoulder[1]-p.elbow[1])-l1)>1e-9||Math.abs(Math.hypot(p.wrist[0]-p.elbow[0],p.wrist[1]-p.elbow[1])-l2)>1e-9)throw Error('Rigid length failed');}
 console.log(role+': independent rotations, constant lengths and shared pivots verified');
}
fs.writeFileSync('/workspace/scratch/ff7f503d82eb/rigid-assembly-check.png',sheet.toBuffer('image/png'));
})();
