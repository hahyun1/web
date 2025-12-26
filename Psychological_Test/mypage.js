// API 기본 경로 설정 (common.js의 SERVER_URL 참조)
const API_URL = `${SERVER_URL}/api/mypage`; 

document.addEventListener('DOMContentLoaded', initMypage);

/* ---------------------------------------------------------
   1. 초기화 함수 (Authentication 확인 및 초기 데이터 로드)
--------------------------------------------------------- */
async function initMypage() {
    console.log("마이페이지 초기화 시작...");

    // 인증 함수 존재 여부 확인
    if (typeof checkAuthentication !== 'function') {
        console.error("오류: checkAuthentication 함수를 찾을 수 없습니다.");
        alert("시스템 오류: 로그인 정보를 확인할 수 없습니다.");
        return;
    }

    // 로그인 상태 확인 및 유저 정보 취득
    const user = await checkAuthentication(); 
    if (!user) return; 

    // 탭 버튼 클릭 이벤트 바인딩
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    // 초기 데이터 로드
    await loadUserProfileAndStats();
    await loadLikedTests(); 
    
    // 초기 탭 설정 (좋아요 탭 활성화)
    switchTab('liked');
}


/* ---------------------------------------------------------
   2. 프로필 및 통계 정보 로드
--------------------------------------------------------- */
async function loadUserProfileAndStats() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const stats = await response.json();
        
        if (response.ok) {
            const nicknameEl = document.getElementById('userNickname');
            const likeCountEl = document.getElementById('likeCount');
            const historyCountEl = document.getElementById('historyCount');

            if(nicknameEl) {
                nicknameEl.innerText = `${stats.nickname}님!`;
                // 설정 바로가기 아이콘 추가
                nicknameEl.innerHTML += ` <a href="#" onclick="switchTab('settings'); return false;"><i class="fas fa-cog"></i></a>`;
            }

            if(likeCountEl) likeCountEl.innerHTML = `<i class="fas fa-heart"></i> 좋아요 ${stats.likeCount}개`;
            if(historyCountEl) historyCountEl.innerHTML = `<i class="fas fa-chart-bar"></i> 완료한 테스트 ${stats.historyCount}개`;

        } else {
            console.error("통계 로드 실패:", stats.message);
        }
    } catch (error) {
        console.error("통계 로드 오류:", error);
    }
}


/* ---------------------------------------------------------
   3. 좋아요한 테스트 목록 로드
--------------------------------------------------------- */
async function loadLikedTests() {
    const gridContainer = document.getElementById('likedTestGrid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '<p style="grid-column: 1 / -1; color: #aaa;">로딩 중...</p>';
    
    try {
        const response = await fetch(`${API_URL}/liked`);
        const tests = await response.json();

        if (!Array.isArray(tests) || tests.length === 0) {
            gridContainer.innerHTML = '<p style="grid-column: 1 / -1; color: #888;">아직 찜한 테스트가 없습니다.</p>';
            return;
        }

        gridContainer.innerHTML = tests.map(test => {
            const imageUrl = test.thumbnail ? `${SERVER_URL}${test.thumbnail}` : 'https://via.placeholder.com/400x250?text=No+Image';
            const category = test.category || '기타';
            
            return `
            <a href="test_detail.html?id=${test.id}" class="mypage-test-item">
                <div class="thumb" style="background-image: url('${imageUrl}')">
                    <span class="test-category-tag">${category}</span>
                    <i class="fas fa-heart liked-icon"></i>
                </div>
                <div class="info">
                    <h3 class="test-title">${test.title}</h3>
                </div>
            </a>
            `;
        }).join('');

    } catch (error) {
        console.error("좋아요 목록 오류:", error);
        gridContainer.innerHTML = '<p style="color: red;">목록을 불러오지 못했습니다.</p>';
    }
}


/* ---------------------------------------------------------
   4. 탭 전환 제어 (UI 업데이트 및 데이터 리로드)
--------------------------------------------------------- */
function switchTab(targetId) {
    console.log("탭 전환:", targetId);

    // 전체 활성 클래스 제거
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // 선택된 탭 및 콘텐츠 활성화
    const targetBtn = document.querySelector(`.tab-btn[data-tab="${targetId}"]`);
    const targetContent = document.getElementById(targetId);

    if (targetBtn) targetBtn.classList.add('active');
    if (targetContent) targetContent.classList.add('active');
    
    // 탭 종류별 데이터 로드 처리
    if (targetId === 'liked') loadLikedTests();
    if (targetId === 'history') loadHistory();
    if (targetId === 'settings') loadSettingsForm();
}


/* ---------------------------------------------------------
   5. 테스트 참여 내역 로드
--------------------------------------------------------- */
async function loadHistory() {
    const listContainer = document.getElementById('historyList');
    if (!listContainer) return;

    listContainer.innerHTML = '<p style="grid-column: 1 / -1; color: #aaa; text-align: center; padding: 20px;">내역 로딩 중...</p>';

    try {
        const response = await fetch(`${API_URL}/history`);
        const historyData = await response.json();

        if (!Array.isArray(historyData) || historyData.length === 0) {
            listContainer.innerHTML = '<p style="grid-column: 1 / -1; color: #888; text-align: center; padding: 40px 0;">아직 참여한 테스트가 없습니다.</p>';
            return;
        }

        listContainer.innerHTML = historyData.map(item => {
            const dateObj = new Date(item.completed_at);
            const dateStr = `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;
            const imageUrl = item.thumbnail ? `${SERVER_URL}${item.thumbnail}` : 'https://via.placeholder.com/400x250?text=No+Image';
            const categoryTag = item.category || '기타';
            const resultText = item.result_title ? item.result_title : "결과 기록 없음";

            return `
            <a href="test_detail.html?id=${item.test_id}" class="mypage-test-item">
                <div class="thumb" style="background-image: url('${imageUrl}')">
                    <span class="test-category-tag">${categoryTag}</span>
                </div>
                <div class="info">
                    <h3 class="test-title">${item.title}</h3>
                    <div style="margin-top: 6px; font-weight: bold; color: #E76F00; font-size: 0.95rem;">
                        <i class="fas fa-check-circle"></i> ${resultText}
                    </div>
                    <p style="font-size: 0.85rem; color: #aaa; margin-top: 6px;">${dateStr} 참여</p>
                </div>
            </a>
            `;
        }).join('');

    } catch (error) {
        console.error("참여 내역 오류:", error);
        listContainer.innerHTML = '<p style="grid-column: 1 / -1; color: red; text-align: center;">내역을 불러오지 못했습니다.</p>';
    }
}


/* ---------------------------------------------------------
   6. 내 정보 수정 폼 (Settings) 생성 및 로드
--------------------------------------------------------- */
async function loadSettingsForm() {
    const container = document.getElementById('settingsContainer'); 
    if(!container) return;

    container.innerHTML = '<div style="padding: 40px 0; text-align: center; color: #aaa;">정보 불러오는 중...</div>';
    
    const user = await checkAuthentication();
    if (!user) return;

    container.innerHTML = `
        <div style="max-width: 500px; margin: 0 auto; padding: 20px; background: white; border-radius: 15px; box-sizing: border-box;">
            
            <div style="margin-bottom: 40px;">
                <h3 style="font-family: 'Jua', sans-serif; font-size: 1.2rem; color: #333; margin-bottom: 15px;">기본 정보 수정</h3>
                <form onsubmit="event.preventDefault(); updateNickname(this);">
                    <div style="margin-bottom: 20px;">
                        <label style="display:block; margin-bottom: 8px; font-weight: bold; color: #555;">아이디</label>
                        <input type="text" value="${user.user_id}" disabled 
                            style="width: 100%; padding: 15px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 8px; color: #888; font-size: 1rem; box-sizing: border-box;">
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label for="newNickname" style="display:block; margin-bottom: 8px; font-weight: bold; color: #555;">닉네임</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="text" id="newNickname" value="${user.nickname}" required 
                                style="flex: 1; width: 100%; padding: 15px; border: 1px solid #ccc; border-radius: 8px; font-size: 1rem; box-sizing: border-box;">
                            <button type="submit" 
                                style="width: 100px; padding: 15px 0; background: #8F9F85; color: white; border: none; border-radius: 8px; font-weight: bold; font-family: 'Jua', sans-serif; cursor: pointer; white-space: nowrap;">
                                변경
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <hr style="border: 0; border-top: 1px dashed #ccc; margin: 30px 0;">

            <div>
                <h3 style="font-family: 'Jua', sans-serif; font-size: 1.2rem; color: #333; margin-bottom: 15px;">비밀번호 변경</h3>
                <form onsubmit="event.preventDefault(); updatePassword(this);">
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <input type="password" id="currentPw" placeholder="현재 비밀번호" required 
                            style="width: 100%; padding: 15px; border: 1px solid #ccc; border-radius: 8px; font-size: 1rem; box-sizing: border-box;">
                        <input type="password" id="newPw" placeholder="새 비밀번호 (8자 이상)" required 
                            style="width: 100%; padding: 15px; border: 1px solid #ccc; border-radius: 8px; font-size: 1rem; box-sizing: border-box;">
                        <input type="password" id="newPwConfirm" placeholder="새 비밀번호 확인" required 
                            style="width: 100%; padding: 15px; border: 1px solid #ccc; border-radius: 8px; font-size: 1rem; box-sizing: border-box;">
                        <button type="submit" 
                            style="width: 100%; padding: 15px; margin-top: 10px; background: #8D8276; color: white; border: none; border-radius: 8px; font-weight: bold; font-family: 'Jua', sans-serif; font-size: 1.1rem; cursor: pointer;">
                            비밀번호 변경
                        </button>
                    </div>
                </form>
            </div>
            
        </div>
    `;
}


/* ---------------------------------------------------------
   7. 닉네임 및 비밀번호 변경 요청 (API 통신)
--------------------------------------------------------- */

// 닉네임 업데이트
async function updateNickname(form) {
    const newNickname = form.querySelector('#newNickname').value;
    if (!newNickname) return alert("닉네임을 입력해주세요.");

    try {
        const response = await fetch(`${SERVER_URL}/api/mypage/nickname`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname: newNickname })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert("닉네임이 변경되었습니다.");
            location.reload();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("닉네임 변경 오류:", error);
        alert("서버 연결 실패");
    }
}

// 비밀번호 업데이트
async function updatePassword(form) {
    const currentPw = form.querySelector('#currentPw').value;
    const newPw = form.querySelector('#newPw').value;
    const newPwConfirm = form.querySelector('#newPwConfirm').value;

    if (newPw !== newPwConfirm) return alert("새 비밀번호가 일치하지 않습니다.");

    try {
        const response = await fetch(`${SERVER_URL}/api/mypage/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw })
        });

        const data = await response.json();

        if (response.ok) {
            alert("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
            await fetch(`${SERVER_URL}/api/logout`, { method: 'POST' });
            window.location.href = 'login.html';
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("비밀번호 변경 오류:", error);
        alert("서버 연결 실패");
    }
}