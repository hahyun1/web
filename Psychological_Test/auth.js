const API_URL = 'http://localhost:3000/api';

// ----------------------------------------------------
// [공통 기능 1] 비밀번호 일치 확인 및 UI 업데이트 (회원가입 페이지용)
// ----------------------------------------------------
function validatePasswords() {
    const pw = document.getElementById('signPw');
    const pwConfirm = document.getElementById('signPwConfirm');
    const confirmWrapper = pwConfirm.closest('.input-wrapper');
    
    // 입력된 값이 있고, 두 비밀번호가 일치하면
    if (pw.value && pw.value === pwConfirm.value) {
        confirmWrapper.classList.add('valid-match');
        return true;
    } else {
        // 비어있지 않은데 불일치하거나, 둘 중 하나가 비어있으면
        confirmWrapper.classList.remove('valid-match');
        return false;
    }
}

// ----------------------------------------------------
// [공통 기능 2] 비밀번호 보이기/숨기기 토글 (로그인/회원가입 공통)
// ----------------------------------------------------
function togglePasswordVisibility(inputId, iconElement) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        iconElement.classList.replace('fa-eye', 'fa-eye-slash'); // 눈 모양 아이콘 변경
    } else {
        input.type = 'password';
        iconElement.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// ----------------------------------------------------
// 1. 회원가입 함수
// ----------------------------------------------------
async function handleSignup() {
    const user_id = document.getElementById('signId').value;
    const nickname = document.getElementById('signNick').value;
    const password = document.getElementById('signPw').value;
    const passwordConfirm = document.getElementById('signPwConfirm').value; // 확인용 비번

    if(!user_id || !nickname || !password || !passwordConfirm) return alert("모든 항목을 입력해주세요.");
    
    // 비밀번호 일치 최종 검증
    if (password !== passwordConfirm) {
        alert("비밀번호가 일치하지 않습니다. 다시 확인해주세요.");
        return;
    }

    const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, nickname, password })
    });

    const data = await res.json();
    if(res.ok) {
        alert("회원가입 성공! 로그인해주세요.");
        location.href = 'login.html';
    } else {
        // 백엔드에서 받은 상세 메시지 출력
        alert(data.message); 
    }
}

// ----------------------------------------------------
// 2. 로그인 함수
// ----------------------------------------------------
async function handleLogin() {
    const user_id = document.getElementById('loginId').value;
    const password = document.getElementById('loginPw').value;

    const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, password })
    });

    const data = await res.json();
    if(res.ok) {
        alert(`${data.user.nickname}님 환영합니다!`);
        location.href = 'home.html'; 
    } else {
        alert(data.message); 
    }
}