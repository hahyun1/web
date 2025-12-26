/* =========================================================
   [1] 전역 변수 정의
========================================================= */
let currentQ = 0;       // 현재 진행 중인 질문 인덱스
let totalScore = 0;     // 누적 점수
let testId = null;      // 현재 테스트 ID

let questions = [];     // 서버에서 받아온 질문 목록
let results = [];       // 서버에서 받아온 결과 목록


/* =========================================================
   [2] 페이지 초기화 및 데이터 로드 (DOMContentLoaded)
========================================================= */
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    testId = urlParams.get('id');

    if (!testId) {
        alert("잘못된 접근입니다.");
        location.href = 'home.html';
        return;
    }

    try {
        // [1] 테스트 기본 정보 로드
        const testRes = await fetch(`http://localhost:3000/api/tests/${testId}`);
        const testRaw = await testRes.json();
        const testInfo = testRaw.info || testRaw; 
        document.getElementById('testTitle').innerText = testInfo.title; 

        // [2] 질문 목록 로드 및 가공
        const qRes = await fetch(`http://localhost:3000/api/questions/${testId}`);
        const qData = await qRes.json();
        
        questions = qData.map(q => ({
            text: q.question_text,
            options: [q.option_a, q.option_b],
            scores: [q.score_a, q.score_b]
        }));

        // [3] 결과 기준 목록 로드
        const rRes = await fetch(`http://localhost:3000/api/results/${testId}`);
        results = await rRes.json(); 

        // 초기 화면 설정
        showSection('question');
        showQuestion();

    } catch (error) {
        console.error("데이터 로드 실패:", error);
        document.getElementById('testTitle').innerText = "데이터를 불러올 수 없습니다.";
    }
});


/* =========================================================
   [3] 진행 상태 및 UI 제어 함수
========================================================= */

// 상단 진행 바(Progress Bar) 업데이트
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

// 질문 섹션과 결과 섹션 간의 전환
function showSection(id) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
}


/* =========================================================
   [4] 질문 렌더링 및 응답 처리
========================================================= */

// 현재 질문 표시 및 버튼 생성
function showQuestion() {
    updateProgressBar();

    // 모든 문항을 풀었을 경우 결과 화면으로 이동
    if (currentQ >= questions.length) {
        showResult();
        return;
    }

    const q = questions[currentQ];
    document.getElementById("questionText").innerText = q.text;
    
    const optionsDiv = document.getElementById("options");
    optionsDiv.innerHTML = "";
    document.getElementById("submitContainer").style.display = "none";

    // 옵션 버튼 동적 생성 및 스타일 적용
    q.options.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.innerText = opt;
        
        btn.style.display = "block";
        btn.style.width = "100%";
        btn.style.padding = "15px";
        btn.style.margin = "10px 0";
        btn.style.borderRadius = "10px";
        btn.style.border = "1px solid #ddd";
        btn.style.cursor = "pointer";
        btn.style.backgroundColor = "#fff";
        btn.style.fontSize = "1rem";
        
        // 버튼 호버 효과 정의
        btn.onmouseover = () => { btn.style.backgroundColor = "#8F9F85"; btn.style.color = "white"; };
        btn.onmouseout = () => { btn.style.backgroundColor = "#fff"; btn.style.color = "black"; };

        btn.onclick = () => {
            // 점수 합산 후 다음 문항으로 이동
            totalScore += q.scores[i]; 
            currentQ++;
            showQuestion();
        };
        optionsDiv.appendChild(btn);
    });
}


/* =========================================================
   [5] 결과 산출 및 서버 저장
========================================================= */

// 최종 점수에 따른 결과 매칭 및 화면 노출
function showResult() {
    showSection('result');
    if(document.getElementById("progressContainer")) {
        document.getElementById("progressContainer").style.display = "none";
    }

    // 총점이 min_score와 max_score 범위 내에 있는 결과 객체 검색
    const finalResult = results.find(r => totalScore >= r.min_score && totalScore <= r.max_score);

    if (finalResult) {
        document.getElementById("resultText").innerHTML = `
            <h2 style="color:#4A3B32; margin-bottom:20px; font-size:2rem;">${finalResult.result_title}</h2>
            <div style="background:#fff; padding:20px; border-radius:15px; border:1px solid #eee;">
                <p style="font-size:1.1rem; line-height:1.6; color:#555;">${finalResult.result_desc}</p>
            </div>
        `;
        // 결과 기록 서버 전송
        saveTestResult(testId, totalScore, finalResult.id);

    } else {
        document.getElementById("resultText").innerText = "해당 점수에 맞는 결과가 없습니다. (관리자에게 문의하세요)";
        console.log("총점:", totalScore);
    }
    
    // 다시하기 버튼 링크 초기화
    const restartBtn = document.querySelector('.restart-btn');
    if(restartBtn) restartBtn.href = `test_detail.html?id=${testId}`;
}

// 테스트 참여 내역 DB 저장 요청
async function saveTestResult(testId, score, resultId) {
    if (!testId) return;

    try {
        const response = await fetch(`${SERVER_URL}/api/test/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                test_id: testId,
                score: score || 0,
                result_id: resultId
            }),
        });
        console.log("결과 저장 완료!");
    } catch (error) {
        console.error("결과 저장 실패:", error);
    }
}