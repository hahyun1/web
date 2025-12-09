document.addEventListener('DOMContentLoaded', async () => {
    // 1. [중요] 페이지 로드 시 헤더의 로그인 상태부터 확인 (이게 없으면 비로그인처럼 보임)
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
        // 2. 테스트 정보 가져오기
        const response = await fetch(`http://localhost:3000/api/tests/${testId}`);
        if (!response.ok) throw new Error("데이터 불러오기 실패");

        const data = await response.json(); 
        const testInfo = data.info; 
        const questions = data.questions;

        // 화면 채우기
        document.getElementById('detailTitle').innerText = testInfo.title; 
        document.getElementById('detailDesc').innerText = testInfo.description; 
        document.getElementById('categoryTag').innerText = testInfo.category || '성격';

        if (testInfo.thumbnail) {
            detailImage.src = `http://localhost:3000${testInfo.thumbnail}`;
        } else {
            detailImage.src = 'img/default.png';
        }

        document.getElementById('questionCount').innerText = `${questions.length}개`; 
        
        const visitCount = testInfo.visit_count || 0;
        const formattedCount = visitCount.toLocaleString();
        
        document.getElementById('participantCount').innerText = formattedCount; 
        
        // 하단 참여자 수 텍스트 (ID 확인 필요)
        const bottomText = document.getElementById('likeCountText') || document.getElementById('participantCountBottom');
        if(bottomText) bottomText.innerText = formattedCount;

        const startBtn = document.getElementById('startBtn');
        if (parseInt(testId) === AI_TEST_ID) {
            startBtn.href = "face_test.html"; 
        } else {
            startBtn.href = `test_progress.html?id=${testId}`;
        }

        // 3. 좋아요 상태 확인 및 버튼 이벤트
        checkLikeStatus(testId, heartBtn);
        heartBtn.onclick = () => toggleLike(testId, heartBtn);

    } catch (error) {
        console.error("에러:", error);
    }
});

// --- [추가] 헤더 로그인 상태 변경 함수 ---
async function checkLoginStatus() {
    try {
        const response = await fetch(`${SERVER_URL}/api/auth/status`);
        const data = await response.json();
        
        const loginGroup = document.querySelector('.login-group');
        
        if (data.loggedIn) {
            // [로그인 상태] 닉네임과 로그아웃 버튼 표시
            loginGroup.innerHTML = `
            <li><a href="mypage.html" style="font-weight:bold; color:#8F9F85;">마이페이지</a></li> 
            /
            <li><a href="#" onclick="handleLogout()" style="color:#8D8276;">로그아웃</a></li>
            `;
        } else {
            // [비로그인 상태] 기존 로그인/회원가입 링크 유지 
        }
    } catch (err) {
        console.error("로그인 상태 확인 실패:", err);
    }
}

// 마이페이지 접속 시 인증 확인 및 리다이렉션 (URL접근 막기)
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

// 로그아웃 함수 (전역)
async function handleLogout() {
    try {
        await fetch(`${SERVER_URL}/api/logout`, { method: 'POST' });
        alert("로그아웃 되었습니다.");
        location.reload(); // 페이지 새로고침해서 상태 반영
    } catch (err) {
        console.error("로그아웃 오류:", err);
    }
}

// --- 좋아요 상태 확인 ---
async function checkLikeStatus(testId, btn) {
    try {
        const res = await fetch(`http://localhost:3000/api/tests/${testId}/like/status`);
        if(!res.ok) return; // 404 방지

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

// --- 좋아요 토글 ---
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