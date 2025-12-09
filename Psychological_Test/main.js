/* ==========================================================================
 * 1. 서버 설정
 * ========================================================================== */
const TEST_API_URL = "http://localhost:3000/api/tests"; 
const SERVER_URL = "http://localhost:3000"; 

/* ==========================================================================
 * 2. 페이지 초기화
 * ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    initScrollHeader();     
    fetchAndRenderTests();      // 전체 목록 (하단)
    fetchAndRenderTop3();       
    initFortuneCookie();
});

/* ==========================================================================
 * 3. 전체 심리테스트 목록 (하단 그리드)
 * ========================================================================== */
async function fetchAndRenderTests() {
    const container = document.querySelector('.test-grid-container');
    if (!container) return;

    try {
        const response = await fetch(TEST_API_URL);
        const testData = await response.json(); 

        if (!testData || testData.length === 0) {
            container.innerHTML = '<p style="text-align:center; width:100%; padding: 40px; color: #888;">등록된 테스트가 없습니다.</p>';
            return;
        }

        container.innerHTML = testData.map(test => {
            const imageUrl = test.thumbnail ? `${SERVER_URL}${test.thumbnail}` : 'https://via.placeholder.com/400x250/E0E0E0/888888?text=No+Image';
            return `
            <a href="test_detail.html?id=${test.id}" class="test-item">
                <div class="thumb" style="background-image: url('${imageUrl}')"></div>
                <h3 class="test-title">${test.title}</h3>
            </a>
            `;
        }).join('');

    } catch (error) {
        console.error("전체 목록 로드 실패:", error);
    }
}

/* ==========================================================================
 * 4. 최신 3개 고정 노출 (Best 3)
 * ========================================================================== */
async function fetchAndRenderTop3() {
    const track = document.querySelector('.highlight-track');
    if (!track) return;

    try {
        const response = await fetch(TEST_API_URL);
        const allTests = await response.json();

        // 최신순 3개만 자르기
        const recentTests = allTests.slice(0, 3); 

        if (recentTests.length === 0) {
            track.innerHTML = '<div style="padding:20px; color:#999;">추천 콘텐츠 준비 중</div>';
            return;
        }

        // HTML 생성
        track.innerHTML = recentTests.map((test, index) => {
            const imageUrl = test.thumbnail ? `${SERVER_URL}${test.thumbnail}` : null;
            
            let style = "";
            if (imageUrl) {
                // 이미지만 꽉 차게 보여줌 (글씨 그림자 제거)
                style = `
                    background-image: url('${imageUrl}');
                    background-size: cover;
                    background-position: center;
                `;
            } else {
                // 이미지가 없을 땐 파스텔톤 배경만
                const bgColors = ["#E6F0FA", "#FFF0F0", "#F5E6FA"];
                const bg = bgColors[index % bgColors.length];
                style = `background-color: ${bg};`;
            }

            return `
            <a href="test_detail.html?id=${test.id}" class="highlight-slide" style="${style}" title="${test.title}">
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
    const fortuneContainer = document.querySelector('.fortune-container p'); // "포춘 쿠키를 깨보세요" 텍스트 부분

    if (!fortuneBtn || !cookieIconArea) return;

    // 운세 메시지 목록 
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
        // 1. 버튼 중복 클릭 방지 및 텍스트 변경
        fortuneBtn.disabled = true;
        fortuneBtn.innerText = "운세를 확인했습니다!";
        fortuneContainer.innerText = "오늘의 운세가 나왔습니다!";

        // 2. 쿠키 흔들리는 애니메이션 시작
        cookieIconArea.classList.add('shaking');

        // 3. 0.5초 후 쿠키가 깨지고 메시지 등장
        setTimeout(() => {
            // 랜덤 메시지 선택
            const randomIndex = Math.floor(Math.random() * fortuneMessages.length);
            const selectedMessage = fortuneMessages[randomIndex];

            // 쿠키 아이콘을 운세 종이로 교체 
            cookieIconArea.innerHTML = `
                <div class="fortune-paper reveal">
                    <span class="paper-text">${selectedMessage}</span>
                </div>
            `;
            
            // 흔들림 클래스 제거
            cookieIconArea.classList.remove('shaking');
        }, 500); // 0.5초 대기 (애니메이션 시간과 맞춤)
    });
}