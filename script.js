// 🎮 遊戲關卡設定 (精準掛載你的圖片)
const levels = [
    {
        level: 1,
        title: "第一關：個人座位整理",
        desc: "請幫咕嚕將物品拖拽放入正確的容器中！",
        bannerSrc: "assets/scene_sad.png", // 融入 image_5 (愁眉苦臉)
        timer: null,
        mode: "sorting",
        items: [
            { id: "i1", name: "人文科書", imgSrc: "assets/item_book.png", fallback: "📘", type: "bag" },
            { id: "i2", name: "文具", imgSrc: "assets/item_stationery.png", fallback: "✏️", type: "bag" },
            { id: "i3", name: "廢紙團", imgSrc: "assets/item_paper.png", fallback: "📄", type: "trash" },
            { id: "i4", name: "糖果紙", imgSrc: "assets/item_candy.png", fallback: "🍬", type: "trash" },
            { id: "i5", name: "機械人", imgSrc: "assets/item_robot.png", fallback: "🤖", type: "home" },
            { id: "i6", name: "玩具車", imgSrc: "assets/item_car.png", fallback: "🚗", type: "home" }
        ]
    },
    {
        level: 2,
        title: "第二關：閃電 30 秒大挑戰",
        desc: "時間緊迫！在 30 秒內完成整理挑戰！",
        bannerSrc: "assets/scene_timer.png", // 融入 image_6 (頭帶 + 計時器)
        timer: 30,
        mode: "sorting",
        items: [
            { id: "i1", name: "人文科書", imgSrc: "assets/item_book.png", fallback: "📘", type: "bag" },
            { id: "i3", name: "廢紙團", imgSrc: "assets/item_paper.png", fallback: "📄", type: "trash" },
            { id: "i5", name: "機械人", imgSrc: "assets/item_robot.png", fallback: "🤖", type: "home" },
            { id: "i6", name: "玩具車", imgSrc: "assets/item_car.png", fallback: "🚗", type: "home" }
        ]
    },
    {
        level: 3,
        title: "第三關：五星特工大判斷",
        desc: "以下情境是否有「責任感」？請選擇 ⭕ 或 ❌！",
        bannerSrc: "assets/scene_welcome.png", // 融入 image_3 (開心揮手)
        timer: null,
        mode: "choice",
        items: [
            { id: "s1", name: "明仔讓媽媽幫忙收拾書包，自己看電視。", type: "cross", fallback: "📺" },
            { id: "s2", name: "小花看到座位下有廢紙，主動撿起丟進垃圾桶。", type: "circle", fallback: "🧹" },
            { id: "s3", name: "看到同學掉擦膠，主動提醒或幫忙撿起。", type: "circle", fallback: "🤝" }
        ]
    }
];

// 音效引擎 (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    if (type === 'correct') {
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.start(); osc.stop(audioCtx.currentTime + 0.25);
    } else if (type === 'wrong') {
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.setValueAtTime(174.61, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    }
}

// 遊戲邏輯控制
let currentLevelIdx = 0, score = 0, remainingItems = [], selectedItem = null, timerInterval = null, timeLeft = 0;

const els = {
    start: document.getElementById('start-screen'),
    game: document.getElementById('game-screen'),
    end: document.getElementById('end-screen'),
    lvlInd: document.getElementById('level-indicator'),
    timer: document.getElementById('timer-display'),
    score: document.getElementById('score-display'),
    bannerImg: document.getElementById('level-banner-img'),
    title: document.getElementById('level-title'),
    desc: document.getElementById('level-desc'),
    items: document.getElementById('items-pool'),
    targets: document.getElementById('targets-container'),
    choice: document.getElementById('choice-container')
};

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;

function startGame() {
    currentLevelIdx = 0; score = 0; els.score.innerText = `⭐ 積分: 0`;
    switchScreen(els.game); loadLevel(0);
}

function switchScreen(screen) {
    [els.start, els.game, els.end].forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

function loadLevel(idx) {
    clearInterval(timerInterval);
    const lvl = levels[idx];
    
    // 🖼️ 核心魔法：根據關卡動態切換大場景圖！
    els.bannerImg.src = lvl.bannerSrc;
    els.bannerImg.onerror = function() { this.src = 'https://via.placeholder.com/800x250?text=Image+Missing'; };
    
    els.lvlInd.innerText = `關卡 ${lvl.level}/3`;
    els.title.innerText = lvl.title;
    els.desc.innerText = lvl.desc;
    remainingItems = [...lvl.items];
    els.items.innerHTML = '';

    if (lvl.timer) {
        timeLeft = lvl.timer; els.timer.classList.remove('hidden'); els.timer.innerText = `⏱️ 時間: ${timeLeft}s`;
        els.bannerImg.style.border = "4px solid #FF9800"; // 限時關卡加上橙色邊框警告
        timerInterval = setInterval(() => {
            if (--timeLeft <= 0) { clearInterval(timerInterval); alert('⏱️ 時間到！重試一次！'); loadLevel(idx); }
            els.timer.innerText = `⏱️ 時間: ${timeLeft}s`;
        }, 1000);
    } else {
        els.timer.classList.add('hidden');
        els.bannerImg.style.border = "3px solid #E0F2F1";
    }

    if (lvl.mode === 'sorting') {
        els.targets.classList.remove('hidden'); els.choice.classList.add('hidden');
        remainingItems.forEach(item => els.items.appendChild(createItemCard(item)));
        document.querySelectorAll('.target-box').forEach(box => {
            box.onclick = () => { if(selectedItem) checkAnswer(selectedItem, box.dataset.type); };
            box.ondragover = e => e.preventDefault();
            box.ondrop = e => { e.preventDefault(); const item = remainingItems.find(i => i.id === e.dataTransfer.getData('text/plain')); if(item) checkAnswer(item, box.dataset.type); };
        });
    } else {
        els.targets.classList.add('hidden'); els.choice.classList.remove('hidden'); setupChoiceLevel();
    }
}

function createItemCard(item) {
    const card = document.createElement('div'); card.className = 'item-card'; card.draggable = true; card.id = item.id;
    card.innerHTML = `<img class="item-card-img" src="${item.imgSrc}" onerror="this.outerHTML='<div style=\\'font-size:2.5rem\\'>${item.fallback}</div>'"><div class="item-name">${item.name}</div>`;
    card.onclick = () => { document.querySelectorAll('.item-card').forEach(c => c.classList.remove('selected')); card.classList.add('selected'); selectedItem = item; };
    card.ondragstart = e => { e.dataTransfer.setData('text/plain', item.id); selectedItem = item; };
    return card;
}

function setupChoiceLevel() {
    if(!remainingItems.length) return;
    const item = remainingItems[0];
    els.items.innerHTML = `<div class="item-card" style="width:90%; max-width:400px; padding:20px; font-size:1.3rem;"><div>${item.fallback}</div><b>${item.name}</b></div>`;
    document.querySelectorAll('.choice-btn').forEach(btn => btn.onclick = () => checkAnswer(item, btn.dataset.choice));
}

function checkAnswer(item, userChoice) {
    if (item.type === userChoice) {
        playSound('correct'); score += 10; els.score.innerText = `⭐ 積分: ${score}`;
        remainingItems = remainingItems.filter(i => i.id !== item.id); selectedItem = null;
        
        if(levels[currentLevelIdx].mode === 'sorting') document.getElementById(item.id)?.remove();
        else setupChoiceLevel();

        if (!remainingItems.length) {
            clearInterval(timerInterval);
            setTimeout(() => {
                if (++currentLevelIdx < levels.length) loadLevel(currentLevelIdx);
                else { playSound('correct'); switchScreen(els.end); }
            }, 300);
        }
    } else { playSound('wrong'); alert('❌ 不太對喔，再想想看！'); }
}
