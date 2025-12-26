/* =========================================================
   [1] 페이지 초기설정 및 검색 이벤트 등록
========================================================= */
document.addEventListener('DOMContentLoaded', () => {
    initScrollHeader();         // 헤더 스크롤 제어
    fetchAndRenderLatestTest(); // 메인 배너 로드
    fetchAndRenderTop3();       // 인기 TOP 3 로드
    fetchAndRenderTests();      // 전체 목록 로드
    initFortuneCookie();        // 운세 기능 초기화
    checkLoginStatus();         // 로그인 상태 확인

    const searchInput = document.querySelector('.search-bar input');

    // 실시간 검색 기능 (keyup 이벤트)
    if (searchInput) {
        searchInput.addEventListener('keyup', async (event) => {
            const query = event.target.value.trim();
            await fetchAndRenderTests(query);
        });
    }
});

/* =========================================================
   [2] 메인 배너(Hero) 최신 테스트 데이터 렌더링
========================================================= */
async function fetchAndRenderLatestTest() {
    const LATEST_API_URL = `${TEST_API_URL}/latest`; 
    
    const heroContent = document.querySelector('.hero-content');
    const heroTextDiv = heroContent ? heroContent.querySelector('.hero-text') : null;
    const heroImgContainer = heroContent ? heroContent.querySelector('.hero-img-container') : null;

    if (!heroTextDiv || !heroImgContainer) return;

    try {
        const response = await fetch(LATEST_API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const latestTest = await response.json(); 

        if (!latestTest || !latestTest.id) {
            console.warn("최신 테스트 데이터가 없어 기본 배너를 유지합니다.");
            return;
        }
        
        const title = latestTest.title || '제목 없음';
        const description = latestTest.description || '재미있고 신비로운 테스트가 기다리고 있어요 ✨';
        const imageUrl = latestTest.thumbnail 
            ? `${SERVER_URL}${latestTest.thumbnail}`
            : '../Psychological_Test/img/default-image.png';

        // 텍스트 및 버튼 정보 업데이트
        heroTextDiv.querySelector('h1').innerHTML = title.replace(/\n/g, '<br>');
        heroTextDiv.querySelector('p').innerHTML = description.replace(/\n/g, '<br>');
        
        const heroBtn = heroTextDiv.querySelector('.hero-btn');
        if (heroBtn) {
            heroBtn.href = `test_detail.html?id=${latestTest.id}`;
            heroBtn.setAttribute('onclick', `countVisit(${latestTest.id})`);
        }
        
        // 이미지 업데이트
        const imgElement = heroImgContainer.querySelector('img');
        if (imgElement) {
            imgElement.src = imageUrl;
            imgElement.alt = title;
        }

    } catch (error) {
        console.error("최신 테스트 로드 실패:", error);
    }
}

/* =========================================================
   [3] 테스트 목록 렌더링 (검색 모드 대응)
========================================================= */
async function fetchAndRenderTests(query = '') {
    const container = document.querySelector('.test-grid-container');
    const heroSection = document.querySelector('.hero-box');
    const recommendSection = document.querySelector('.highlight-tests-carousel');
    const fortuneSection = document.querySelector('.today-fortune');
    const allTestsTitle = document.querySelector('.all-tests .section-title');
    const allTestsSection = document.querySelector('.all-tests');

    if (!container) return;

    // 검색 여부에 따른 섹션 가시성 제어
    if (query) {
        if(heroSection) heroSection.style.display = 'none';
        if(recommendSection) recommendSection.style.display = 'none';
        if(fortuneSection) fortuneSection.style.display = 'none';
        
        if(allTestsTitle) allTestsTitle.innerHTML = `'<span style="color:#8F9F85">${query}</span>' 검색 결과`;
        if(allTestsSection) allTestsSection.style.marginTop = '40px';
    } else {
        if(heroSection) heroSection.style.display = 'block';
        if(recommendSection) recommendSection.style.display = 'block';
        if(fortuneSection) fortuneSection.style.display = 'block';
        
        if(allTestsTitle) allTestsTitle.innerText = '전체 심리테스트';
        if(allTestsSection) allTestsSection.style.marginTop = '0';
    }

    // 서버 데이터 요청
    const API_ENDPOINT = query 
        ? `${TEST_API_URL}/search?q=${encodeURIComponent(query)}`
        : TEST_API_URL;

    try {
        const response = await fetch(API_ENDPOINT);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const testData = await response.json(); 

        // 결과가 없을 경우 메시지 표시
        if (!testData || testData.length === 0) {
            container.innerHTML = `<p style="text-align:center; width:100%; padding: 60px 0; color: #888; font-size:1.1rem; grid-column: 1 / -1;">
                🔍 <strong>'${query}'</strong>에 대한 테스트를 찾을 수 없어요.<br>다른 키워드로 검색해보세요!
            </p>`;
            return;
        }

        // 테스트 카드 목록 생성
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

/* =========================================================
   [4] 인기 테스트 TOP 3 렌더링
========================================================= */
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

/* =========================================================
   [5] 헤더 스크롤 이벤트 (스크롤 시 숨기기/보이기)
========================================================= */
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

/* =========================================================
   [6] 오늘의 운세(포춘쿠키) 기능
========================================================= */
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

        // 애니메이션 효과 추가
        cookieIconArea.classList.add('shaking');

        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * fortuneMessages.length);
            const selectedMessage = fortuneMessages[randomIndex];

            // 쿠키 이미지 대신 운세 메시지 결과 표시
            cookieIconArea.innerHTML = `
                <div class="fortune-paper reveal">
                    <span class="paper-text">${selectedMessage}</span>
                </div>
            `;
            
            cookieIconArea.classList.remove('shaking');
        }, 500); 
    });
}

/* =========================================================
   [7] 조회수 통계 전송
========================================================= */
function countVisit(id) {
    fetch(`${SERVER_URL}/api/tests/${id}/visit`, { method: 'POST' })
        .catch(err => console.error("조회수 집계 오류:", err));
}

/* =========================================================
   [8] 좋아요 상태 변경 (토글)
========================================================= */
async function toggleLikeStatus(testId, element) {
    const response = await fetch(`${SERVER_URL}/api/tests/${testId}/like`, { method: 'POST' });
    const data = await response.json();
    
    if (response.status === 401) {
        alert("좋아요 기능은 로그인 후 이용 가능합니다.");
        return;
    }
    
    if (response.ok) {
        if (data.liked) {
            alert("좋아요를 눌렀습니다!");
        } else {
            alert("좋아요를 취소했습니다!");
        }
        
        // 마이페이지에서 호출 시 목록 새로고침
        if (window.location.pathname.includes('mypage.html')) {
            loadUserProfileAndStats();
            fetchLikedTests();
        }
        
    } else {
        alert(`좋아요 처리 실패: ${data.message || '서버 오류'}`);
    }
}