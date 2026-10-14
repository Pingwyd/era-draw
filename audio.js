'use strict';
// ================= SFX (WebAudio synth, no files) =================
let AC=null,master=null;const lastSfx={};
function audioUnlock(){if(AC)return;try{AC=new (window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=.35;master.connect(AC.destination)}catch(e){AC=null}}
addEventListener('pointerdown',audioUnlock,{once:false});addEventListener('keydown',audioUnlock);
function tone(f0,f1,dur,type='square',vol=.3,t0=0){const t=AC.currentTime+t0,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.02)}
function noise(dur,vol=.3,hp=800,t0=0){const t=AC.currentTime+t0,n=Math.floor(AC.sampleRate*dur),b=AC.createBuffer(1,n,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
  const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=b;f.type='highpass';f.frequency.value=hp;g.gain.value=vol;s.connect(f);f.connect(g);g.connect(master);s.start(t)}
const SFX={
  draw:()=>noise(.12,.12,2500),
  spawn:()=>{tone(330,660,.12,'triangle',.25);tone(495,990,.14,'triangle',.18,.05)},
  fizzle:()=>tone(220,90,.15,'sawtooth',.12),
  shatter:()=>{noise(.25,.35,1200);tone(900,200,.2,'square',.08)},
  hit:()=>tone(180,70,.06,'square',.08),
  tick:()=>tone(900,900,.025,'square',.04),
  kill:()=>noise(.06,.1,400),
  hurt:()=>{tone(140,60,.18,'sawtooth',.25);noise(.08,.15,300)},
  lvl:()=>[523,659,784,1046].forEach((f,i)=>tone(f,f,.12,'square',.12,i*.07)),
  pick:()=>tone(660,880,.08,'triangle',.2),
  chest:()=>[392,523,659,784,1046].forEach((f,i)=>tone(f,f*1.01,.16,'triangle',.18,i*.06)),
  boss:()=>{tone(80,40,.9,'sawtooth',.3);noise(.6,.15,100)},
  dash:()=>{noise(.12,.18,1800);tone(300,900,.1,'triangle',.08)},
  die:()=>[392,330,262,196].forEach((f,i)=>tone(f,f*.98,.25,'triangle',.2,i*.15)),
};
const SFX_GAP={hit:.045,kill:.03,draw:.1};
function sfx(name){if(!AC||!SFX[name]||(typeof save!=='undefined'&&save.mute))return;const now=AC.currentTime,gap=SFX_GAP[name]||0;if(gap&&lastSfx[name]&&now-lastSfx[name]<gap)return;lastSfx[name]=now;try{SFX[name]()}catch(e){}}
