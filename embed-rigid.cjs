// Mechanical single-file packaging: artwork and the editable rig source are inlined.
const fs=require('node:fs');
const file='dist/index.html';let html=fs.readFileSync(file,'utf8');
const rig=fs.readFileSync('rigid-puppet.js','utf8');
const atlas=Object.fromEntries(['sheng','dan','jing'].map(r=>[r,'data:image/webp;base64,'+fs.readFileSync('assets/'+r+'-atlas.webp').toString('base64')]));
html=html.replace(/<script>[\s\S]*?<\/script>/,'<script>\n'+rig+'\nPuppetRig.atlases='+JSON.stringify(atlas)+';\n</script>');
fs.writeFileSync(file,html);
