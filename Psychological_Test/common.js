/* ==========================================================================
 * 로그인 상태 관리 및 헤더 변경 
 * ========================================================================== */

var TEST_API_URL = "http://localhost:3000/api/tests"; 
var SERVER_URL = "http://localhost:3000";

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

// 페이지가 로드되면 자동으로 실행하라는 명령 
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus(); 
});