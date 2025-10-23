// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------


// let scoreText = "成績分數: " + finalScore + "/" + maxScore;
// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字

// 【新增】全域變數：用於儲存正在燃放的煙火
let fireworks = []; 
let lastFireworkTime = 0; // 用於控制煙火發射頻率


window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製 (見方案二)
        // ----------------------------------------
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() { 
    // ... (其他設置)
    createCanvas(windowWidth / 2, windowHeight / 2); 
    background(255); 
    // 移除 noLoop(); 讓 draw 能夠連續執行以產生動畫效果
    // noLoop(); // 如果您希望分數只有在改變時才繪製，保留此行
} 

// score_display.js 中的 draw() 函數片段

function draw() { 
    // 讓背景帶有一點透明度 (例如 25) 產生殘影效果，使煙火更逼真
    background(255, 25); 

    // 計算百分比
    let percentage = (finalScore / maxScore) * 100;
    let scoreDisplayY = height / 2 + 50;


    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    textSize(80); 
    textAlign(CENTER);

    if (percentage >= 90) {
        // 滿分或高分：顯示鼓勵文本，使用鮮豔顏色
        fill(0, 200, 50); // 綠色 
        text("恭喜！優異成績！", width / 2, height / 2 - 50);

        // 【新增煙火發射邏輯】
        // 只有在分數 90 分以上時，且每隔一段時間 (例如 30 幀) 
        // 才隨機發射新的煙火
        if (frameCount % 30 == 0 || frameCount - lastFireworkTime > 60) {
            let fireworkX = random(width * 0.2, width * 0.8);
            fireworks.push(new Firework(fireworkX, height)); 
            lastFireworkTime = frameCount;
        }

        
    } else if (percentage >= 60) {
        // 中等分數：顯示一般文本，使用黃色 
        fill(255, 181, 35); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage >= 0) {
        // 低分：顯示警示文本，使用紅色 
        fill(200, 0, 0); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數或分數為 0
        fill(150);
        text(scoreText, width / 2, height / 2);
        scoreDisplayY = height / 2; // 如果沒有成績，具體分數顯示在中間
    }

    // 顯示具體分數
    textSize(50);
    fill(50);
    text(`得分: ${finalScore}/${maxScore}`, width / 2, scoreDisplayY);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (畫面反映二)
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        // 移除原有的幾何圖形，讓位給煙火特效
        
        // --------------------------------------------------
        // 【關鍵步驟：更新並顯示煙火】
        // --------------------------------------------------
        for (let i = fireworks.length - 1; i >= 0; i--) {
            fireworks[i].update();
            fireworks[i].show();

            // 如果煙火已經結束，從陣列中移除
            if (fireworks[i].isFinished()) {
                fireworks.splice(i, 1);
            }
        }
        
    } else if (percentage >= 60) {
        // 畫一個方形 
        fill(255, 181, 35, 150);
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }
}


// =================================================================
// 步驟三：煙火與粒子系統的 Class 定義
// -----------------------------------------------------------------

// 煙火 Class (Firework)
class Firework {
    constructor(startX, startY) {
        // 煙火的火箭部分
        this.firework = new Particle(startX, startY, true); 
        this.exploded = false;
        this.particles = [];
        this.explosionColor = color(random(255), random(255), random(255)); 
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(createVector(0, -0.05)); // 模擬推力
            this.firework.update();

            // 當火箭速度為正 (開始下落) 或到達一定高度，就爆炸
            if (this.firework.vel.y >= 0 || this.firework.pos.y < height * 0.3) {
                this.explode();
                this.exploded = true;
            }
        }

        // 更新爆炸後的粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].applyForce(createVector(0, 0.05)); // 模擬重力
            this.particles[i].update();
            // 粒子淡出
            if (this.particles[i].lifespan <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    explode() {
        // 產生數個爆炸粒子
        for (let i = 0; i < 100; i++) {
            this.particles.push(new Particle(this.firework.pos.x, this.firework.pos.y, false, this.explosionColor));
        }
    }

    show() {
        if (!this.exploded) {
            this.firework.show();
        }
        
        // 顯示爆炸後的粒子
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].show();
        }
    }

    isFinished() {
        // 如果已經爆炸，且所有爆炸粒子都消失，則視為結束
        return this.exploded && this.particles.length === 0;
    }
}


// 粒子 Class (Particle)
class Particle {
    constructor(x, y, isFirework, pColor) {
        this.pos = createVector(x, y);
        this.acc = createVector(0, 0);
        this.lifespan = 255;
        this.isFirework = isFirework;

        if (this.isFirework) {
            // 火箭向上發射
            this.vel = createVector(random(-1, 1), random(-10, -15));
            this.color = color(255, 100, 0); // 火箭顏色：橙紅色
            this.size = 5;
        } else {
            // 爆炸粒子向四周發散
            let angle = random(TWO_PI);
            let speed = random(1, 6);
            this.vel = p5.Vector.fromAngle(angle, speed);
            this.color = pColor; 
            this.size = random(2, 4);
        }
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        // 更新速度與位置
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // 清空加速度

        // 減少生命值 (用於淡出效果)
        if (!this.isFirework) {
            this.lifespan -= 5;
            // 讓粒子緩慢減速
            this.vel.mult(0.98); 
        }
    }

    show() {
        colorMode(RGB);
        strokeWeight(this.size);
        let alpha = this.isFirework ? 255 : this.lifespan;
        
        // 增加發光效果：使用 stroke 和 fill 接近的顏色
        let pColor = color(red(this.color), green(this.color), blue(this.color), alpha);
        stroke(pColor);
        fill(pColor);

        // 繪製粒子
        point(this.pos.x, this.pos.y);
    }
}
