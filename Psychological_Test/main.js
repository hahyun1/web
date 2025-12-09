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
 * 3. 전체 심리테스트 목록 (하단 그리드) 
 * ========================================================================== */
async function fetchAndRenderTests(query = '') {
    const container = document.querySelector('.test-grid-container');
    if (!container) return;

    const API_ENDPOINT = query 
        ? `${TEST_API_URL}/search?q=${encodeURIComponent(query)}`
        : TEST_API_URL;

    try {
        const response = await fetch(API_ENDPOINT);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const testData = await response.json(); 

        // 데이터가 없을 때 (검색 결과 없음)
        if (!testData || testData.length === 0) {
            container.innerHTML = `<p style="text-align:center; width:100%; padding: 40px; color: #888;">'${query}'에 해당하는 테스트가 없습니다.</p>`;
            return;
        }

        // HTML 생성
        container.innerHTML = testData.map(test => {
            const imageUrl = test.thumbnail 
                ? `${SERVER_URL}${test.thumbnail}` 
                : 'https://via.placeholder.com/400x250/E0E0E0/888888?text=No+Image';

            return `
            <a href="test_detail.html?id=${test.id}" class="test-item">
                <div class="thumb" style="background-image: url('${imageUrl}')"></div>
                <h3 class="test-title">${test.title}</h3>
            </a>
            `;
        }).join('');

    } catch (error) {
        console.error("목록 로드 실패:", error);
        container.innerHTML = '<p style="text-align:center; width:100%; padding: 40px; color: red;">서버 연결 오류</p>';
    }
}

/* ==========================================================================
 * 4. 최신 3개 고정 노출 (Best 3)
 * ========================================================================== */
async function fetchAndRenderTop3() {
    const track = document.querySelector('.highlight-track');
    if (!track) return;

    // [수정] 백엔드에 최신/인기 목록만 요청하는 전용 엔드포인트를 사용한다고 가정
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
    const imageUrl = test.thumbnail ? `${SERVER_URL}${test.thumbnail}` : null;
    
    // 1. 이미지 영역 스타일 설정
    let imageStyle = `
        width: 100%; 
        height: 180px; 
        border-radius: 12px; 
        background-size: cover; 
        background-position: center;
        margin-bottom: 12px;
    `;

    if (imageUrl) {
        imageStyle += `background-image: url('${imageUrl}');`;
    } else {
        const bgColors = ["#E6F0FA", "#FFF0F0", "#F5E6FA"];
        const bg = bgColors[index % bgColors.length];
        imageStyle += `background-color: ${bg};`;
    }

    // 2. HTML 구조 반환 (이미지 박스 위, 텍스트 아래 배치)
    return `
    <a href="test_detail.html?id=${test.id}" class="highlight-slide" style="text-decoration: none; display: block;">
        <div style="${imageStyle}"></div>

        <div style="text-align: center; padding: 0 5px;">
            <p style="
                color: #4A3B32; 
                font-size: 1.1rem; 
                font-weight: bold; 
                margin: 0;
                line-height: 1.4;
                word-break: keep-all;
            ">
                ${test.title}
            </p>
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