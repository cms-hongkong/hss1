// 🎮 遊戲核心數據結構 (整合最新修正物品)
const levels = [
    {
        level: 1,
        title: "第一關：個人座位整理",
        desc: "請幫咕嚕將物品放入正確的容器中！",
        timer: null,
        mode: "sorting",
        items: [
            { id: "humanities_book", name: "人文科書", icon: "📘", type: "bag" },
            { id: "music_book", name: "音樂科書", icon: "🎵", type: "bag" },
            { id: "pencil_eraser", name: "鉛筆與擦膠", icon: "✏️", type: "bag" },
            { id: "tissue", name: "用過的紙巾", icon: "🧻", type: "trash" },
            { id: "food_wrapper", name: "食物包裝袋", icon: "🥪", type: "trash" },
            { id: "candy_wrapper", name: "糖果紙", icon: "🍬", type: "trash" },
            { id: "robot", name: "機械人玩具", icon: "🤖", type: "home" },
            { id: "plush_toy", name: "毛公仔", icon: "🧸", type: "home" }
        ]
    },
    {
        level: 2,
        title: "第二關：閃電 30 秒大挑戰",
        desc: "時間緊迫！在 30 秒內完成所有整理任務！",
        timer: 30,
        mode: "sorting",
        items: [
            { id: "humanities_book", name: "人文科書", icon: "📘", type: "bag" },
            { id: "pencil_eraser", name: "鉛筆與擦膠", icon: "✏️", type: "bag" },
            { id: "tissue", name: "用過的紙巾", icon: "🧻", type: "trash" },
            { id: "candy_wrapper", name: "糖果紙", icon: "🍬", type: "trash" },
            { id: "robot", name: "機械人玩具", icon: "🤖", type: "home" }
        ]
    },
    {
        level: 3,
        title: "第三關：五星特工大判斷",
        desc: "以下情境是否有「責任感」？請選擇 ⭕ 或 ❌！",
        timer: null,
        mode: "choice",
        items: [
            { id: "s1", name: "明仔讓媽媽幫忙收拾書包，自己看電視。", type: "cross", icon: "📺" },
            { id: "s2", name: "小花看到座位下有廢紙，主動撿起丟進垃圾桶。", type: "circle", icon: "🧹" },
            { id: "s3", name: "看到隔壁同學掉擦膠，主動提醒或幫忙撿起。", type: "circle", icon: "🤝" }
        ]
    }
];

// 🔊 Web Audio API 無需外部音效檔
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'correct') {
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
    } else if (type === 'wrong') {
        osc.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
        osc.frequency.setValueAtTime(174.61, audioCtx.currentTime + 0.1); // F3
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'win') {
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15);
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.3); // G5
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
    }
}

// 🎯 遊戲狀態控制
let currentLevelIdx = 0;
let score = 0;
let remainingItems = [];
let selectedItem = null;
let timerInterval = null;
let timeLeft = 0;

// DOM 元素引用
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');

const levelIndicator = document.getElementById('level-indicator');
const timerDisplay = document.getElementById('timer-display');
const scoreDisplay = document.getElementById('score-display');

const levelTitle = document.getElementById('level-title');
const levelDesc = document.getElementById('level-desc');
const itemsPool = document.getElementById('items-pool');
const targetsContainer = document.getElementById('targets-container');
const choiceContainer = document.getElementById('choice-container');

// 初始化事件監聽
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);

function startGame() {
    currentLevelIdx = 0;
    score = 0;
    scoreDisplay.innerText = `⭐ 積分: ${score}`;
    switchScreen(gameScreen);
    loadLevel(currentLevelIdx);
}

function switchScreen(targetScreen) {
    [startScreen, gameScreen, endScreen].forEach(s => s.classList.remove('active'));
    targetScreen.classList.add('active');
}

function loadLevel(idx) {
    clearInterval(timerInterval);
    const lvl = levels[idx];
    
    levelIndicator.innerText = `關卡 ${lvl.level}/3`;
    levelTitle.innerText = lvl.title;
    levelDesc.innerText = lvl.desc;
    
    remainingItems = [...lvl.items];
    selectedItem = null;
    itemsPool.innerHTML = '';

    // 計時器設定
    if (lvl.timer) {
        timeLeft = lvl.timer;
        timerDisplay.classList.remove('hidden');
        timerDisplay.innerText = `⏱️ 時間: ${timeLeft}s`;
        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.innerText = `⏱️ 時間: ${timeLeft}s`;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                alert('⏱️ 時間到！重新試試看！');
                loadLevel(idx);
            }
        }, 1000);
    } else {
        timerDisplay.classList.add('hidden');
    }

    // 模式渲染
    if (lvl.mode === 'sorting') {
        targetsContainer.classList.remove('hidden');
        choiceContainer.classList.add('hidden');
        setupSortingLevel();
    } else if (lvl.mode === 'choice') {
        targetsContainer.classList.add('hidden');
        choiceContainer.classList.remove('hidden');
        setupChoiceLevel();
    }
}

function setupSortingLevel() {
    remainingItems.forEach(item => {
        const card = createItemCard(item);
        itemsPool.appendChild(card);
    });

    // 容器設置點擊/拖放事件
    document.querySelectorAll('.target-box').forEach(box => {
        box.onclick = () => {
            if (selectedItem) {
                checkAnswer(selectedItem, box.dataset.type);
            }
        };

        box.ondragover = (e) => e.preventDefault();
        box.ondrop = (e) => {
            e.preventDefault();
            const itemId = e.dataTransfer.getData('text/plain');
            const item = remainingItems.find(i => i.id === itemId);
            if (item) checkAnswer(item, box.dataset.type);
        };
    });
}

function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.draggable = true;
    card.id = item.id;
    card.innerHTML = `<div class="item-icon">${item.icon}</div><div class="item-name">${item.name}</div>`;

    // 點選選擇（方便平板操作）
    card.onclick = () => {
        document.querySelectorAll('.item-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedItem = item;
    };

    // 原生拖拽
    card.ondragstart = (e) => {
        e.dataTransfer.setData('text/plain', item.id);
        selectedItem = item;
    };

    return card;
}

function setupChoiceLevel() {
    if (remainingItems.length === 0) return;
    const currentItem = remainingItems[0];
    
    itemsPool.innerHTML = `
        <div class="item-card selected" style="width: 80%; max-width: 400px; cursor: default;">
            <div class="item-icon">${currentItem.icon}</div>
            <div class="item-name" style="font-size: 1.1rem; padding: 10px;">${currentItem.name}</div>
        </div>
    `;

    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.onclick = () => {
            checkAnswer(currentItem, btn.dataset.choice);
        };
    });
}

function checkAnswer(item, userChoice) {
    if (item.type === userChoice) {
        playSound('correct');
        score += 10;
        scoreDisplay.innerText = `⭐ 積分: ${score}`;
        
        // 移除已完成項目
        remainingItems = remainingItems.filter(i => i.id !== item.id);
        selectedItem = null;

        if (levels[currentLevelIdx].mode === 'sorting') {
            const cardEl = document.getElementById(item.id);
            if (cardEl) cardEl.remove();
        } else {
            setupChoiceLevel();
        }

        // 通關判定
        if (remainingItems.length === 0) {
            clearInterval(timerInterval);
            setTimeout(() => {
                currentLevelIdx++;
                if (currentLevelIdx < levels.length) {
                    alert('🎉 太棒了！挑戰下一關！');
                    loadLevel(currentLevelIdx);
                } else {
                    playSound('win');
                    switchScreen(endScreen);
                }
            }, 300);
        }
    } else {
        playSound('wrong');
        alert('❌ 好像不太對，再試一次看看！');
    }
}
