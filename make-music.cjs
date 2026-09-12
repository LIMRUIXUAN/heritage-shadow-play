// Render the existing pentatonic melody once, avoiding live synthesis on phones.
const fs=require('fs');
const rate=22050,step=.72,duration=16*step,samples=new Float64Array(Math.ceil(rate*duration));
const seq=[293.66,392,440,null,392,329.63,293.66,null,261.63,293.66,329.63,392,293.66,null,261.63,null];
function add(t,d,voice){for(let i=0;i<d*rate;i++){const x=i/rate;const index=(Math.round(t*rate)+i)%samples.length;samples[index]+=voice(x);}}
seq.forEach((f,i)=>{if(f)add(i*step,2,x=>Math.min(1,x/.008)*Math.exp(-x*3.5)*(.16*Math.sin(2*Math.PI*f*x)+.055*Math.sin(2*Math.PI*f*2.01*x)+.018*Math.sin(2*Math.PI*f*3*x)));if(i===0||i===8){const low=i===0?196:174.61;add(i*step,2.7,x=>.065*Math.min(1,x/.35,(2.7-x)/.45)*Math.sin(2*Math.PI*low*x+.25*Math.sin(2*Math.PI*5*x)));}if(i%4===0)add(i*step,.09,x=>.07*Math.exp(-x*55)*Math.sin(2*Math.PI*(520*x-2055*x*x)));});
const wav=Buffer.alloc(44+samples.length*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples.length*2,40);samples.forEach((v,i)=>wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),44+i*2));fs.writeFileSync('assets/theatre-music.wav',wav);
