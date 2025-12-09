// ========================================================
// 테스트 상세 페이지 로직 (DB 데이터 불러오기)
// ========================================================

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('id');

    if (!testId) { return; }

    try {
        const response = await fetch(`http://localhost:3000/api/tests/${testId}`);
        if (!response.ok) throw new Error("데이터 불러오기 실패");

        const data = await response.json(); 

        // 1. 테스트 기본 정보 (info 객체 사용)
        const testInfo = data.info; // <--- info 객체를 추출
        document.getElementById('detailTitle').innerText = testInfo.title; 
        document.getElementById('detailDesc').innerText = testInfo.description; 

        // 2. 썸네일 이미지 처리
        const imgElement = document.getElementById('detailImage');
        // DB에 저장된 썸네일 경로 사용 
        if (testInfo.thumbnail) {
            imgElement.src = `http://localhost:3000${testInfo.thumbnail}`;
        } else {
            imgElement.src = 'img/default.png';
        }

        // 3. '시작하기' 버튼 링크 수정
        document.getElementById('startBtn').href = `test_progress.html?id=${testId}`;

    } catch (error) {
        console.error("상세 정보 로드 중 에러:", error);
        document.getElementById('detailTitle').innerText = "오류가 발생했습니다.";
    }
});


/* 고양이상/강아지상 판별 */
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('id');

    const AI_TEST_ID = 5; 

    if (!testId) return;

    try {
        const response = await fetch(`http://localhost:3000/api/tests/${testId}`);
        if (!response.ok) throw new Error("데이터 불러오기 실패");

        const data = await response.json(); 
        const testInfo = data.info; 

        // 제목, 설명, 이미지 넣기 
        document.getElementById('detailTitle').innerText = testInfo.title; 
        document.getElementById('detailDesc').innerText = testInfo.description; 
        
        if (testInfo.thumbnail) {
            document.getElementById('detailImage').src = `http://localhost:3000${testInfo.thumbnail}`;
        } else {
            document.getElementById('detailImage').src = 'img/default.png';
        }

        // ID가 동물상 테스트면 face_test.html로 이동
        const startBtn = document.getElementById('startBtn');
        
        if (parseInt(testId) === AI_TEST_ID) {
            // 동물상 테스트일 때
            startBtn.href = "face_test.html"; 
        } else {
            // 일반 심리테스트일 때
            startBtn.href = `test_progress.html?id=${testId}`;
        }

    } catch (error) {
        console.error("에러:", error);
        document.getElementById('detailTitle').innerText = "오류가 발생했습니다.";
    }
});