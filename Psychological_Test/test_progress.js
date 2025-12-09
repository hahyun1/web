// ========================================================
// 1. 변수 정의
// ========================================================
let currentQ = 0;
let totalScore = 0; // 점수만 누적
let testId = null;

let questions = []; 
let results = [];   

// ========================================================
// 2. 데이터 로드
// ========================================================
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    testId = urlParams.get('id');

    if (!testId) {
        alert("잘못된 접근입니다.");
        location.href = 'home.html';
        return;
    }

    try {
        // [1] 테스트 정보 로드
        const testRes = await fetch(`http://localhost:3000/api/tests/${testId}`);
        const testRaw = await testRes.json();
        
        // 서버 응답 구조 확인 (info 객체)
        const testInfo = testRaw.info || testRaw; 
        document.getElementById('testTitle').innerText = testInfo.title; 

        // [2] 질문 목록 로드
        const qRes = await fetch(`http://localhost:3000/api/questions/${testId}`);
        const qData = await qRes.json();
        
        questions = qData.map(q => ({
            text: q.question_text,
            options: [q.option_a, q.option_b],
            scores: [q.score_a, q.score_b]
        }));

        // [3] 결과 목록 로드
        const rRes = await fetch(`http://localhost:3000/api/results/${testId}`);
        results = await rRes.json(); 

        showSection('question');
        showQuestion();

    } catch (error) {
        console.error("데이터 로드 실패:", error);
        document.getElementById('testTitle').innerText = "데이터를 불러올 수 없습니다.";
    }
});


// ========================================================
// 3. 기능 함수
// ========================================================

// 진행 바 업데이트
function updateProgressBar() {
    const total = questions.length;
    if (total === 0) return;

    let percent = Math.round(((currentQ + 1) / total) * 100);
    if (percent > 100) percent = 100;

    const bar = document.getElementById('progressBar');
    const label = document.getElementById('progressLabel');
    if (bar && label) {
        bar.style.width = percent + '%';
        label.innerText = percent + '%';
    }
}

// 섹션 전환 (질문 <-> 결과)
function showSection(id) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
}

// 질문 표시 함수
function showQuestion() {
    updateProgressBar();

    // 모든 질문 완료 시 결과 화면으로
    if (currentQ >= questions.length) {
        showResult();
        return;
    }

    const q = questions[currentQ];
    document.getElementById("questionText").innerText = q.text;
    
    const optionsDiv = document.getElementById("options");
    optionsDiv.innerHTML = "";
    document.getElementById("submitContainer").style.display = "none";

    // 버튼 생성
    q.options.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.innerText = opt;
        
        // 버튼 스타일링
        btn.style.display = "block";
        btn.style.width = "100%";
        btn.style.padding = "15px";
        btn.style.margin = "10px 0";
        btn.style.borderRadius = "10px";
        btn.style.border = "1px solid #ddd";
        btn.style.cursor = "pointer";
        btn.style.backgroundColor = "#fff";
        btn.style.fontSize = "1rem";
        
        // 호버 효과
        btn.onmouseover = () => { btn.style.backgroundColor = "#8F9F85"; btn.style.color = "white"; };
        btn.onmouseout = () => { btn.style.backgroundColor = "#fff"; btn.style.color = "black"; };

        btn.onclick = () => {
            // 점수 누적 후 다음 문제로
            totalScore += q.scores[i]; 
            currentQ++;
            showQuestion();
        };
        optionsDiv.appendChild(btn);
    });
}

// 결과 표시 함수 
function showResult() {
    showSection('result');
    if(document.getElementById("progressContainer")) {
        document.getElementById("progressContainer").style.display = "none";
    }

    // ★ 핵심: 총점이 min ~ max 사이에 있는 결과를 찾음
    const finalResult = results.find(r => totalScore >= r.min_score && totalScore <= r.max_score);

    if (finalResult) {
        // 결과 화면 구성
        document.getElementById("resultText").innerHTML = `
            <h2 style="color:#4A3B32; margin-bottom:20px; font-size:2rem;">${finalResult.result_title}</h2>
            <div style="background:#fff; padding:20px; border-radius:15px; border:1px solid #eee;">
                <p style="font-size:1.1rem; line-height:1.6; color:#555;">${finalResult.result_desc}</p>
            </div>
        `;
    } else {
        document.getElementById("resultText").innerText = "해당 점수에 맞는 결과가 없습니다. (관리자에게 문의하세요)";
        console.log("총점:", totalScore); // 디버깅용 점수 출력
    }
    
    // 다시하기 버튼 링크 (첫 화면으로)
    const restartBtn = document.querySelector('.restart-btn');
    if(restartBtn) restartBtn.href = `test_detail.html?id=${testId}`;
}