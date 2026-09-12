// Native media playback starts synchronously inside the visitor's click.
const bgm=new Audio();bgm.src=MUSIC_DATA;bgm.loop=true;bgm.preload='auto';bgm.volume=.8;bgm.setAttribute('playsinline','');
let musicStarted=false,musicBlocked=false,playRequest=0;
function updateSoundUI(){
 const labels={zh:['音乐已开启','音乐已关闭','点击播放音乐'],en:['Music on','Music off','Play music'],ms:['Muzik hidup','Muzik dimatikan','Mainkan muzik']}[S.lang];
 const label=labels[musicBlocked?2:S.sound?0:1],icon=musicBlocked?'▶':S.sound?'🔊':'🔇';
 ['#sound','#homeSound'].forEach(id=>{const b=$(id);b.classList.toggle('on',S.sound&&!musicBlocked);b.setAttribute('aria-pressed',String(S.sound&&!musicBlocked));b.setAttribute('aria-label',label);b.title=label;});
 $('#sound').textContent=icon;$('#homeSound').textContent=icon+' '+label;
}
function startMusic(){
 if(!S.sound)return;
 const request=++playRequest;
 bgm.muted=false;
 const playback=bgm.play();
 Promise.resolve(playback).then(()=>{if(request!==playRequest)return;if(!S.sound){bgm.pause();return;}musicStarted=true;musicBlocked=false;updateSoundUI();}).catch(()=>{if(request!==playRequest)return;musicBlocked=true;updateSoundUI();});
}
function sound(){
 if(S.sound&&(musicBlocked||(!musicStarted&&$('#home').classList.contains('hide')))){startMusic();return;}
 S.sound=!S.sound;musicBlocked=false;
 if(S.sound)startMusic();else{++playRequest;bgm.pause();}
 updateSoundUI();
}
function tap(){if(S.sound&&musicStarted&&bgm.paused&&!document.hidden)startMusic();}
document.addEventListener('visibilitychange',()=>{if(document.hidden){++playRequest;bgm.pause();}else if(S.sound&&musicStarted)startMusic();});
