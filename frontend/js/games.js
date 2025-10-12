const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const BASE_SIZE = { w: 800, h: 600 };
let currentScale = 1;
function resizeCanvas(){
  const container = document.querySelector('.stage');
  const padding = 20;
  const availW = Math.max(320, Math.min((container?.clientWidth || window.innerWidth) - padding, window.innerWidth - 48));
  const availH = Math.max(240, Math.min(window.innerHeight - 220, window.innerHeight - 48));
  let targetW = availW; let targetH = Math.round(targetW * (BASE_SIZE.h / BASE_SIZE.w));
  if (targetH > availH) { targetH = availH; targetW = Math.round(targetH * (BASE_SIZE.w / BASE_SIZE.h)); }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  currentScale = targetW / BASE_SIZE.w;
  canvas.style.width = targetW + 'px'; canvas.style.height = targetH + 'px';
  canvas.width = Math.floor(BASE_SIZE.w * currentScale * dpr); canvas.height = Math.floor(BASE_SIZE.h * currentScale * dpr);
  ctx.setTransform(currentScale * dpr, 0, 0, currentScale * dpr, 0, 0);
}
window.addEventListener('resize', () => {
  const prevRight = gameState.player.x + gameState.player.width; resizeCanvas();
  gameState.player.x = Math.min(gameState.player.x, BASE_SIZE.w - gameState.player.width);
  if (prevRight > BASE_SIZE.w) gameState.player.x = BASE_SIZE.w - gameState.player.width;
});
let soundEnabled = true; const audioContext = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, dur, type='sine', force=false){ if(!soundEnabled && !force) return; const o=audioContext.createOscillator(), g=audioContext.createGain(); o.connect(g); g.connect(audioContext.destination); o.frequency.value=freq; o.type=type; g.gain.setValueAtTime(0.28, audioContext.currentTime); g.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + dur); o.start(); o.stop(audioContext.currentTime + dur); }
const playShootSound=()=>playSound(820,.08,'square');
const playExplosionSound=()=>{ playSound(120,.25,'sawtooth'); setTimeout(()=>playSound(60,.15,'sawtooth'),60); };
const playHitSound=()=>playSound(220,.16,'triangle');
const playCorrectSound=()=>{ playSound(523.25,.12,'sine',true); setTimeout(()=>playSound(659.25,.12,'sine',true),90); setTimeout(()=>playSound(783.99,.26,'sine',true),180); };
const playWrongSound=()=>{ playSound(300,.18,'sawtooth',true); setTimeout(()=>playSound(250,.18,'sawtooth',true),130); setTimeout(()=>playSound(200,.26,'sawtooth',true),260); };
const playGameOverSound=()=>{ playSound(400,.18,'sine'); setTimeout(()=>playSound(340,.18,'sine'),200); setTimeout(()=>playSound(280,.18,'sine'),400); setTimeout(()=>playSound(230,.44,'sine'),600); };
document.getElementById('soundToggle').addEventListener('click', function(){ soundEnabled=!soundEnabled; this.textContent = soundEnabled?'🔊':'🔇'; this.classList.toggle('muted'); if(soundEnabled) playSound(440,.08); });
const physicsQuestions=[
  { q:"Rumus Hukum II Newton adalah...", o:["F = ma","F = m/a","F = a/m","F = m + a"], c:0 },
  { q:"Sebuah benda bermassa 5 kg diberi gaya 20 N. Berapakah percepatannya?", o:["2 m/s²","4 m/s²","10 m/s²","100 m/s²"], c:1 },
  { q:"Jika massa benda digandakan dan gaya tetap, maka percepatan akan...", o:["Menjadi dua kali lipat","Tetap sama","Menjadi setengahnya","Menjadi empat kali lipat"], c:2 },
  { q:"Benda bermassa 10 kg memiliki percepatan 3 m/s². Gaya yang bekerja adalah...", o:["13 N","30 N","3.33 N","300 N"], c:1 },
  { q:"Dalam Hukum II Newton, percepatan benda berbanding lurus dengan...", o:["Massa benda","Gaya yang bekerja","Kecepatan benda","Waktu tempuh"], c:1 },
  { q:"Gaya 50 N menghasilkan percepatan 5 m/s². Massa benda tersebut adalah...", o:["5 kg","10 kg","45 kg","250 kg"], c:1 },
  { q:"Jika gaya yang bekerja pada benda ditambah 2 kali lipat (massa tetap), percepatan akan...", o:["Tetap","Menjadi 2 kali lipat","Menjadi setengahnya","Menjadi 4 kali lipat"], c:1 },
  { q:"Satuan percepatan dalam SI adalah...", o:["m/s","m/s²","N/kg","kg.m/s²"], c:1 },
  { q:"Menurut Hukum II Newton, benda dengan massa lebih besar memerlukan gaya yang... untuk menghasilkan percepatan yang sama.", o:["Lebih kecil","Sama","Lebih besar","Tidak ada hubungannya"], c:2 },
  { q:"Benda bermassa 8 kg mengalami gaya resultan 32 N. Percepatannya adalah...", o:["2 m/s²","4 m/s²","8 m/s²","256 m/s²"], c:1 },
  { q:"Dalam rumus F = ma, 'a' mewakili...", o:["Percepatan","Amplitudo","Area","Arah"], c:0 },
  { q:"Jika tidak ada gaya resultan yang bekerja pada benda (F = 0), maka percepatannya adalah...", o:["Maksimum","Minimum","0 m/s²","9.8 m/s²"], c:2 },
  { q:"Mobil bermassa 1000 kg dipercepat dari diam dengan percepatan 2 m/s². Gaya yang diperlukan adalah...", o:["500 N","1000 N","2000 N","4000 N"], c:2 },
  { q:"Hubungan antara massa dan percepatan dalam Hukum II Newton adalah...", o:["Berbanding lurus","Berbanding terbalik","Eksponensial","Tidak ada hubungan"], c:1 },
  { q:"Gaya 100 N bekerja pada benda bermassa 25 kg. Percepatannya adalah...", o:["2 m/s²","4 m/s²","5 m/s²","25 m/s²"], c:1 }
];

let gameState={ player:{x:375,y:520,width:50,height:40,speed:6}, bullets:[], asteroids:[], score:0, lives:3, gameOver:false, gamePaused:false, keys:{}, asteroidTimer:0, asteroidDelay:60, nextQuizScore:50, quizInterval:50, totalQuizAnswered:0, currentQuiz:null, answeredQuestions:[] };
document.addEventListener('keydown', (e)=>{ gameState.keys[e.key]=true; if(e.key===' '&&!gameState.gameOver&&!gameState.gamePaused){ e.preventDefault(); shoot(); }});
document.addEventListener('keyup', (e)=>{ gameState.keys[e.key]=false; });
document.getElementById('restartBtn').addEventListener('click', restartGame);
function shoot(){ gameState.bullets.push({ x: gameState.player.x + gameState.player.width/2 - 2, y: gameState.player.y, width: 4, height: 16, speed: 8 }); playShootSound(); }
function spawnAsteroid(){ const size=30+Math.random()*30; gameState.asteroids.push({ x: Math.random()*(800 - size), y: -size, width:size, height:size, speed: 2 + Math.random()*3 }); }
function showQuiz(){
  gameState.gamePaused=true; let available=physicsQuestions.filter((q,idx)=>!gameState.answeredQuestions.includes(idx));
  if(!available.length){ gameState.answeredQuestions=[]; available=physicsQuestions; }
  const randIdx=Math.floor(Math.random()*available.length); const q=available[randIdx]; const originalIndex=physicsQuestions.indexOf(q);
  gameState.currentQuiz={ q, originalIndex };
  document.getElementById('quizQuestion').textContent=q.q; document.getElementById('feedback').textContent='';
  const optionsDiv=document.getElementById('quizOptions'); optionsDiv.innerHTML='';
  q.o.forEach((opt,i)=>{ const btn=document.createElement('button'); btn.className='option-btn'; btn.textContent=`${String.fromCharCode(65+i)}. ${opt}`; btn.onclick=()=>checkAnswer(i,btn); optionsDiv.appendChild(btn); });
  document.getElementById('quizModal').style.display='grid';
}

function checkAnswer(selectedIndex, btn){
  const buttons=document.querySelectorAll('.option-btn'); buttons.forEach(b=>b.disabled=true);
  if(selectedIndex===gameState.currentQuiz.q.c){ btn.classList.add('correct'); document.getElementById('feedback').textContent='✅ Benar! Lanjutkan permainan!'; document.getElementById('feedback').style.color='#2e7d32'; playCorrectSound(); gameState.totalQuizAnswered++; gameState.answeredQuestions.push(gameState.currentQuiz.originalIndex); setTimeout(()=>{ document.getElementById('quizModal').style.display='none'; gameState.gamePaused=false; gameState.nextQuizScore+=gameState.quizInterval; document.getElementById('nextQuiz').textContent=gameState.nextQuizScore; gameLoop(); }, 1500); }
  else { btn.classList.add('wrong'); buttons[gameState.currentQuiz.q.c].classList.add('correct'); document.getElementById('feedback').textContent='❌ Salah! Kehilangan 1 nyawa!'; document.getElementById('feedback').style.color='#c62828'; playWrongSound(); gameState.lives--; document.getElementById('lives').textContent=gameState.lives; setTimeout(()=>{ document.getElementById('quizModal').style.display='none'; if(gameState.lives<=0){ endGame(); } else { gameState.gamePaused=false; gameState.nextQuizScore+=gameState.quizInterval; document.getElementById('nextQuiz').textContent=gameState.nextQuizScore; gameLoop(); } }, 1800); }
}

function drawPlayer(){
  const {x,y,width:w,height:h}=gameState.player; const grad=ctx.createLinearGradient(x,y,x,y+h); grad.addColorStop(0,'#ff9ac2'); grad.addColorStop(1,'#a983ff'); ctx.fillStyle=grad; ctx.beginPath(); ctx.moveTo(x+w/2,y); ctx.lineTo(x+6,y+h); ctx.lineTo(x+w-6,y+h); ctx.closePath(); ctx.shadowColor='rgba(162,82,255,.3)'; ctx.shadowBlur=12; ctx.fill(); ctx.shadowBlur=0; ctx.fillStyle='#fff'; ctx.fillRect(x+10,y+h-10,10,5); ctx.fillRect(x+w-20,y+h-10,10,5);
}
function drawBullets(){ gameState.bullets.forEach(b=>{ const g=ctx.createLinearGradient(b.x,b.y,b.x,b.y+b.height); g.addColorStop(0,'#ffffff'); g.addColorStop(1,'#ffd166'); ctx.fillStyle=g; ctx.fillRect(b.x,b.y,b.width,b.height); }); }
function drawAsteroids(){ gameState.asteroids.forEach(a=>{ const cx=a.x+a.width/2, cy=a.y+a.height/2, r=a.width/2; const g=ctx.createRadialGradient(cx-r*0.3,cy-r*0.3,r*0.2,cx,cy,r); g.addColorStop(0,'#b08cff'); g.addColorStop(1,'#ff9ac2'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(cx-r*0.3,cy-r*0.1,r*0.22,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+r*0.25,cy+r*0.2,r*0.16,0,Math.PI*2); ctx.fill(); }); }
function updatePlayer(){ if(gameState.keys['ArrowLeft']&&gameState.player.x>0) gameState.player.x-=gameState.player.speed; if(gameState.keys['ArrowRight']&&gameState.player.x<800-gameState.player.width) gameState.player.x+=gameState.player.speed; }
function updateBullets(){ gameState.bullets = gameState.bullets.filter(b=>{ b.y -= b.speed; return b.y > -b.height; }); }
function updateAsteroids(){ gameState.asteroids = gameState.asteroids.filter(a=>{ a.y += a.speed; if(a.y>600) return false; if(checkCollision(gameState.player,a)){ playHitSound(); gameState.lives--; document.getElementById('lives').textContent=gameState.lives; if(gameState.lives<=0) endGame(); return false; } return true; }); }
function checkCollisions(){ gameState.bullets.forEach((b,bi)=>{ gameState.asteroids.forEach((a,ai)=>{ if(checkCollision(b,a)){ gameState.bullets.splice(bi,1); gameState.asteroids.splice(ai,1); playExplosionSound(); gameState.score+=10; document.getElementById('score').textContent=gameState.score; if(gameState.score>=gameState.nextQuizScore) showQuiz(); } }); }); }
function checkCollision(r1,r2){ return r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y; }
function endGame(){ gameState.gameOver=true; playGameOverSound(); document.getElementById('finalScore').textContent=gameState.score; document.getElementById('quizAnswered').textContent=gameState.totalQuizAnswered; document.getElementById('gameOver').style.display='grid'; }
function restartGame(){ gameState={ player:{x:375,y:520,width:50,height:40,speed:6}, bullets:[], asteroids:[], score:0, lives:3, gameOver:false, gamePaused:false, keys:{}, asteroidTimer:0, asteroidDelay:60, nextQuizScore:50, quizInterval:50, totalQuizAnswered:0, currentQuiz:null, answeredQuestions:[] }; document.getElementById('score').textContent=0; document.getElementById('lives').textContent=3; document.getElementById('nextQuiz').textContent=50; document.getElementById('gameOver').style.display='none'; gameLoop(); }
function gameLoop(){ if(gameState.gameOver||gameState.gamePaused) return; ctx.clearRect(0,0,800,600); updatePlayer(); updateBullets(); updateAsteroids(); checkCollisions(); gameState.asteroidTimer++; if(gameState.asteroidTimer>gameState.asteroidDelay){ spawnAsteroid(); gameState.asteroidTimer=0; if(gameState.asteroidDelay>30) gameState.asteroidDelay -= .5; } drawPlayer(); drawBullets(); drawAsteroids(); requestAnimationFrame(gameLoop); }
resizeCanvas(); requestAnimationFrame(gameLoop);

function initializeUserInfo() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      const user = JSON.parse(userData);
      document.getElementById('userName').textContent = user.name || 'Aulia';
      document.getElementById('userAvatar').textContent = user.avatar || 'A';
    }
  }

  function logout() {
    if (confirm('Apakah Anda yakin ingin keluar dari akun?')) {
      localStorage.removeItem('currentUser');
      window.location.href = '../index.html';
    }
  }

  function goBackToDashboard() {
    window.location.href = 'homepage.html';
  }

  document.addEventListener('DOMContentLoaded', initializeUserInfo);