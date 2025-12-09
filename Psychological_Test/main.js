/* ==========================================================================
 * 1. 서버 설정 (백엔드 주소)
 * ========================================================================== */
const TEST_API_URL = "http://localhost:3000/api/tests"; 
const SERVER_URL = "http://localhost:3000"; // 이미지 경로용 기본 주소

/* ==========================================================================
 * 2. 페이지 초기화 + 검색 이벤트 등록
 * ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    initScrollHeader();     
    fetchAndRenderTop3(); 
    fetchAndRenderTests();  // 초기에는 전체 목록을 로드 (query='')
    initFortuneCookie();
    checkLoginStatus();

    // 검색 입력창 요소 가져오기
    const searchInput = document.querySelector('.search-bar input');

    // 키보드를 뗄 때마다 검색 함수 실행
    searchInput.addEventListener('keyup', async (event) => {
        const query = event.target.value.trim();
        
        // [수정] 검색 키워드를 fetchAndRenderTests 함수에 전달하여 목록 필터링 실행
        await fetchAndRenderTests(query);
    });
});


/* ==========================================================================
 * 3. 전체 심리테스트 목록 (검색 시 화면 전환)
 * ========================================================================== */
async function fetchAndRenderTests(query = '') {
    const container = document.querySelector('.test-grid-container');
    
    // [NEW] 제어할 섹션들 가져오기
    const heroSection = document.querySelector('.hero-box');
    const recommendSection = document.querySelector('.highlight-tests-carousel');
    const fortuneSection = document.querySelector('.today-fortune');
    const allTestsTitle = document.querySelector('.all-tests .section-title');
    const allTestsSection = document.querySelector('.all-tests'); // 전체 영역

    if (!container) return;

    // 1. 화면 모드 전환 (검색어가 있냐 없냐에 따라)
    if (query) {
        // [검색 모드] 배너, 추천, 운세 숨기기
        if(heroSection) heroSection.style.display = 'none';
        if(recommendSection) recommendSection.style.display = 'none';
        if(fortuneSection) fortuneSection.style.display = 'none';
        
        // 제목 변경 및 스타일 조정
        if(allTestsTitle) allTestsTitle.innerHTML = `'<span style="color:#8F9F85">${query}</span>' 검색 결과`;
        if(allTestsSection) allTestsSection.style.marginTop = '40px'; // 헤더와 간격 조정
    } else {
        // [기본 모드] 모든 섹션 다시 보이기
        if(heroSection) heroSection.style.display = 'block';
        if(recommendSection) recommendSection.style.display = 'block';
        if(fortuneSection) fortuneSection.style.display = 'block';
        
        // 제목 원상복구
        if(allTestsTitle) allTestsTitle.innerText = '전체 심리테스트';
        if(allTestsSection) allTestsSection.style.marginTop = '0';
    }

    // 2. 서버 데이터 요청
    const API_ENDPOINT = query 
        ? `${TEST_API_URL}/search?q=${encodeURIComponent(query)}`
        : TEST_API_URL;

    try {
        const response = await fetch(API_ENDPOINT);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const testData = await response.json(); 

        // 결과 없음 처리
        if (!testData || testData.length === 0) {
            container.innerHTML = `<p style="text-align:center; width:100%; padding: 60px 0; color: #888; font-size:1.1rem; grid-column: 1 / -1;">
                🔍 <strong>'${query}'</strong>에 대한 테스트를 찾을 수 없어요.<br>다른 키워드로 검색해보세요!
            </p>`;
            return;
        }

        // 결과 렌더링 (카드 생성)
        container.innerHTML = testData.map(test => {
            const imageUrl = test.thumbnail ? `${SERVER_URL}${test.thumbnail}` : 'https://via.placeholder.com/400x250/E0E0E0/888888?text=No+Image';
            
            return `
            <a href="test_detail.html?id=${test.id}" class="test-item" onclick="countVisit(${test.id})">
                <div class="thumb" style="background-image: url('${imageUrl}')"></div>
                <div class="test-info">
                    <h3 class="test-title">${test.title}</h3>
                </div>
            </a>
            `;
        }).join('');

    } catch (error) {
        console.error("목록 로드 실패:", error);
        container.innerHTML = '<p style="text-align:center; width:100%; padding: 40px; color: red; grid-column: 1 / -1;">서버 연결 오류</p>';
    }
}

/* ==========================================================================
 * 4. 최신 3개 고정 노출 (Best 3)
 * ========================================================================== */
async function fetchAndRenderTop3() {
    const track = document.querySelector('.highlight-track');
    if (!track) return;

    const TOP3_API_URL = `${TEST_API_URL}/recent`; 

    try {
        const response = await fetch(TOP3_API_URL);
        const recentTests = await response.json();

        if (!recentTests || recentTests.length === 0) {
            track.innerHTML = '<div style="padding:20px; color:#999;">추천 콘텐츠 준비 중</div>';
            return;
        }

        // HTML 생성 
        track.innerHTML = recentTests.map((test, index) => {
            const imageUrl = test.thumbnail ? `${SERVER_URL}${test.thumbnail}` : 'https://via.placeholder.com/400x250/E0E0E0/888888?text=No+Image';
            const category = test.category || '성격';

            return `
            <a href="test_detail.html?id=${test.id}" class="highlight-slide" onclick="countVisit(${test.id})">
                <div class="highlight-thumb" style="background-image: url('${imageUrl}')">
                    <span class="category-tag">${category}</span>
                </div>
                <div class="highlight-info">
                    <h3 class="highlight-title">${test.title}</h3>
                    <div class="trending-tag">
                        <i class="fas fa-arrow-trend-up trending-icon"></i>
                        <span>인기 급상승</span>
                    </div>
                </div>
            </a>
            `;
        }).join('');

    } catch (error) {
        console.error("추천 목록 로드 실패:", error);
    }
}

/* ==========================================================================
 * 5. 헤더 스크롤 기능
 * ========================================================================== */
function initScrollHeader() {
    const header = document.querySelector("header");
    if (!header) return; 

    let lastScrollY = 0;

    window.addEventListener("scroll", () => {
        const currentScrollY = window.scrollY;

        if (currentScrollY <= 0) {
            header.classList.remove("hide");
            return;
        }

        if (Math.abs(currentScrollY - lastScrollY) > 10) {
            if (currentScrollY > lastScrollY) header.classList.add("hide");
            else header.classList.remove("hide");
            lastScrollY = currentScrollY;
        }
    });
}

/* ==========================================================================
 * 6. 오늘의 운세 (포춘쿠키) 기능
 * ========================================================================== */
function initFortuneCookie() {
    const fortuneBtn = document.querySelector('.fortune-btn');
    const cookieIconArea = document.querySelector('.fortune-cookie-icon');
    const fortuneContainer = document.querySelector('.fortune-container p');

    if (!fortuneBtn || !cookieIconArea) return;

    const fortuneMessages = [
        "🎉 오늘은 당신의 날! 뜻밖의 행운이 찾아올 거예요.",
        "😌 잠시 휴식을 취하세요. 재충전이 필요한 시기입니다.",
        "💡 기발한 아이디어가 떠오를 것입니다. 메모를 잊지 마세요!",
        "💖 가까운 사람에게 따뜻한 말 한마디를 건네보세요.",
        "🏃‍♂️ 망설이지 말고 도전하세요. 결과가 좋을 것입니다.",
        "💰 생각지 못한 곳에서 금전적인 이득이 생길 수 있습니다.",
        "🍀 오늘은 평범함 속에 특별한 행복이 숨어있습니다.",
        "✨ 당신의 노력이 빛을 발하는 순간이 곧 올 거예요.",
        "🧘‍♀️ 마음의 평화를 유지하면 좋은 일이 생깁니다.",
        "🎁 기다리던 소식이나 선물을 받게 될 거예요."
    ];

    fortuneBtn.addEventListener('click', () => {
        fortuneBtn.disabled = true;
        fortuneBtn.innerText = "운세를 확인했습니다!";
        fortuneContainer.innerText = "오늘의 운세가 나왔습니다!";

        // 애니메이션 시작 (CSS에서 bounce 애니메이션 사용 가정)
        cookieIconArea.classList.add('shaking');

        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * fortuneMessages.length);
            const selectedMessage = fortuneMessages[randomIndex];

            // 쿠키 아이콘을 운세 종이로 교체 
            cookieIconArea.innerHTML = `
                <div class="fortune-paper reveal">
                    <span class="paper-text">${selectedMessage}</span>
                </div>
            `;
            
            cookieIconArea.classList.remove('shaking');
        }, 500); 
    });
}

/* ==========================================================================
 * 7. 조회수 증가 함수 (클릭 시 실행)
 * ========================================================================== */
function countVisit(id) {
    // 서버에 "이 ID의 조회수를 올려줘"라고 요청
    fetch(`${SERVER_URL}/api/tests/${id}/visit`, { method: 'POST' })
        .catch(err => console.error("조회수 집계 오류:", err));
}

/* ==========================================================================
 * 8. 로그인 상태 관리 및 헤더 변경 
 * ========================================================================== */
async function checkLoginStatus() {
    try {
        const response = await fetch(`${SERVER_URL}/api/auth/status`);
        const data = await response.json();
        
        const loginGroup = document.querySelector('.login-group');
        
        if (data.loggedIn) {
            // [로그인 상태] 닉네임과 로그아웃 버튼 표시
            loginGroup.innerHTML = `
                <li style="color:#8D8276;"><span style="font-weight:bold; color:#8F9F85;">${data.user.nickname}</span>님</li>
                <li><span style="color:#ddd; margin:0 10px;">|</span></li>
                <li><a href="#" onclick="handleLogout()" style="color:#8D8276;">로그아웃</a></li>
            `;
        } else {
            // [비로그인 상태] 기존 로그인/회원가입 링크 유지 
        }
    } catch (err) {
        console.error("로그인 상태 확인 실패:", err);
    }
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