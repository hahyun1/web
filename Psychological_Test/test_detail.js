/* =========================================================
   [1] 페이지 초기화 및 테스트 상세 데이터 로드
========================================================= */
document.addEventListener('DOMContentLoaded', async () => {
    // 헤더 로그인 상태 확인
    checkLoginStatus();

    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('id');
    const AI_TEST_ID = 5; 

    if (!testId) {
        alert("잘못된 접근입니다.");
        location.href = 'index.html';
        return;
    }

    const detailImage = document.getElementById('detailImage');
    const heartBtn = document.querySelector('.heart-btn');

    try {
        // 테스트 정보 및 질문 데이터 페칭
        const response = await fetch(`http://localhost:3000/api/tests/${testId}`);
        if (!response.ok) throw new Error("데이터 불러오기 실패");

        const data = await response.json(); 
        const testInfo = data.info; 
        const questions = data.questions;

        // UI 요소 데이터 바인딩
        document.getElementById('detailTitle').innerText = testInfo.title; 
        document.getElementById('detailDesc').innerText = testInfo.description; 
        document.getElementById('categoryTag').innerText = testInfo.category || '성격';

        // 썸네일 이미지 설정
        if (testInfo.thumbnail) {
            detailImage.src = `http://localhost:3000${testInfo.thumbnail}`;
        } else {
            detailImage.src = 'img/default.png';
        }

        // 문항 수 및 참여자 수 표시
        document.getElementById('questionCount').innerText = `${questions.length}개`; 
        
        const visitCount = testInfo.visit_count || 0;
        const formattedCount = visitCount.toLocaleString();
        document.getElementById('participantCount').innerText = formattedCount; 
        
        const bottomText = document.getElementById('likeCountText') || document.getElementById('participantCountBottom');
        if(bottomText) bottomText.innerText = formattedCount;

        // 시작 버튼 링크 설정 (AI 테스트 여부 확인)
        const startBtn = document.getElementById('startBtn');
        if (parseInt(testId) === AI_TEST_ID) {
            startBtn.href = "face_test.html"; 
        } else {
            startBtn.href = `test_progress.html?id=${testId}`;
        }

        // 좋아요 상태 확인 및 이벤트 등록
        checkLikeStatus(testId, heartBtn);
        heartBtn.onclick = () => toggleLike(testId, heartBtn);

    } catch (error) {
        console.error("에러:", error);
    }
});


/* =========================================================
   [2] 사용자 인증 및 로그인 상태 관리
========================================================= */

// 헤더 로그인/로그아웃 UI 전환
async function checkLoginStatus() {
    try {
        const response = await fetch(`${SERVER_URL}/api/auth/status`);
        const data = await response.json();
        
        const loginGroup = document.querySelector('.login-group');
        
        if (data.loggedIn) {
            loginGroup.innerHTML = `
            <li><a href="mypage.html" style="font-weight:bold; color:#8F9F85;">마이페이지</a></li> 
            /
            <li><a href="#" onclick="handleLogout()" style="color:#8D8276;">로그아웃</a></li>
            `;
        }
    } catch (err) {
        console.error("로그인 상태 확인 실패:", err);
    }
}

// 페이지 접근 권한 확인 (인증 미들웨어 역할)
async function checkAuthentication() {
    const response = await fetch(`${SERVER_URL}/api/auth/status`);
    const data = await response.json();
    
    if (!data.loggedIn) {
        alert("로그인이 필요합니다.");
        window.location.href = 'login.html';
        return false;
    }
    return data.user;
}

// 로그아웃 처리
async function handleLogout() {
    try {
        await fetch(`${SERVER_URL}/api/logout`, { method: 'POST' });
        alert("로그아웃 되었습니다.");
        location.reload(); 
    } catch (err) {
        console.error("로그아웃 오류:", err);
    }
}


/* =========================================================
   [3] 좋아요(찜하기) 기능 관리
========================================================= */

// 특정 테스트의 좋아요 여부 확인 및 아이콘 렌더링
async function checkLikeStatus(testId, btn) {
    try {
        const res = await fetch(`http://localhost:3000/api/tests/${testId}/like/status`);
        if(!res.ok) return;

        const data = await res.json();
        
        if (data.liked) {
            btn.innerHTML = '<i class="fas fa-heart" style="color: #ff6b6b;"></i>';
        } else {
            btn.innerHTML = '<i class="far fa-heart"></i>';
        }
    } catch (err) {
        console.error("좋아요 상태 확인 실패", err);
    }
}

// 좋아요 추가 및 취소 토글
async function toggleLike(testId, btn) {
    try {
        const res = await fetch(`http://localhost:3000/api/tests/${testId}/like`, { method: 'POST' });
        
        if (res.status === 401) {
            if(confirm("로그인이 필요한 서비스입니다.\n로그인 페이지로 이동하시겠습니까?")) {
                location.href = 'login.html';
            }
            return;
        }

        const data = await res.json();
        
        if (data.liked) {
            btn.innerHTML = '<i class="fas fa-heart" style="color: #ff6b6b;"></i>';
            btn.style.transform = "scale(1.2)";
            setTimeout(() => btn.style.transform = "scale(1)", 200);
        } else {
            btn.innerHTML = '<i class="far fa-heart"></i>';
        }

    } catch (err) {
        console.error("좋아요 요청 실패", err);
    }
}