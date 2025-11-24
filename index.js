/* ==========================================================================
    1. 전역 변수 및 프로젝트 데이터 (정적)
   ========================================================================== */
let lastScrollY = 0; 

// [프로젝트 데이터 관리] 
const projectsData = {
    'plant': {
        title: 'AI 기반 식물 상태 데이터 인식 작업',
        desc: 'AI 모델 학습을 위한 식물 마름 인식 데이터 수집 및 CVAT 활용 라벨링 작업',
        badges: ['CVAT','Figma'],
        people: '4명 (데이터팀)',
        period: '2025.09 ~ 2025.11',
        link: '#',
        linkText: '결과 보고서 보기',
        details: [
            'CVAT 툴을 활용한 식물 잎/줄기 Polygon 정밀 라벨링 수행',
            '데이터 품질 검수 및 노이즈 데이터 필터링 프로세스 도입',
        ]
    },
    'app': {
        title: '통합 지원 앱 개발',
        desc: '가족돌봄청년을 위한 통합 지원 모바일 앱 UI 개발',
        badges: ['Flutter', 'Dart', 'Figma', 'Android Studio'],
        people: '4명 (FE 2, BE 2)',
        period: '2025.06 ~ 2025.07',
        link: 'https://github.com/hahyun1/backup',
        linkText: 'Git',
        details: [
            'Flutter 프레임워크를 활용한 크로스 플랫폼 UI/UX 구현',
            'Figma를 활용한 화면 설계 및 디자인 시스템 구축',
            '복잡한 복지 정책 데이터를 직관적인 카드 UI로 시각화'
        ]
    },
    'queenmac': {
        title: '퀸 맥클러스키',
        desc: 'C++ 객체지향 프로그래밍 기초 콘솔 프로젝트',
        badges: ['C++'],
        people: '1명 (개인)',
        period: '2024.12',
        link: '#',
        linkText: '시연 영상 보기',
        details: [
            '학부생 시절 C++을 활용하여 구현'
        ]
    },
    'game': {
        title: '유니티 게임 개발',
        desc: '스토리 기반 무인도 생존 게임',
        badges: ['C++', 'Unity', 'Git'],
        people: '2명',
        period: '2025.09 - current',
        link: '#',
        linkText: '시연 영상 보기',
        details: [
            '학부생 시절 유니티를 활용하여 구현'
        ]
    }
};

/* ==========================================================================
    2. 초기화
    ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
       initScrollHeader();      // 헤더 스크롤
       initScrollReveal();      // 요소 등장 애니메이션
       initSkillScrollSpy();    // 스킬 섹션 스크롤바 기능
});

/* ==========================================================================
    3. 헤더 스크롤 제어
    ========================================================================== */
function initScrollHeader() {
    const header = document.querySelector("header");
    window.addEventListener("scroll", () => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY && currentScrollY > 0) {
            header.classList.add("hide");
        } else {
            header.classList.remove("hide");
        }
        lastScrollY = currentScrollY;
    });
}

/* ==========================================================================
    4. 스크롤 등장 애니메이션 
      ========================================================================== */
function initScrollReveal() {
    const observerOptions = {
        root: null, rootMargin: "0px", threshold: 0.1
    };
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active-ani");
                obs.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll(".scroll-reveal").forEach(el => observer.observe(el));
}

/* ==========================================================================
    5. 스킬 섹션 스크롤바 기능 
    ========================================================================== */
    function initSkillScrollSpy() {
        const tabs = document.querySelectorAll('.skill-tabs .tab-item');
        const sections = document.querySelectorAll('.skill-group');
        const slider = document.querySelector('.sliding-bar');
    
        // 슬라이더를 해당 탭 위치로 이동시키는 함수
        function moveSlider(tab) {
            // 탭의 높이와 위치를 계산해서 슬라이더에 적용
            slider.style.top = tab.offsetTop + "px";
            slider.style.height = tab.offsetHeight + "px";
        }
    
        // 초기 실행: 첫 번째 탭('Language')을 활성화 상태로 만듦
        if(tabs.length > 0) {
            moveSlider(tabs[0]);
            tabs[0].classList.add('active');
            // 첫 번째 섹션만 보이게
            const firstTargetId = tabs[0].getAttribute('data-target');
            document.getElementById(firstTargetId).classList.add('active');
        }
    
        // 클릭 이벤트 처리
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
    
                // 1. 모든 탭의 active 제거
                tabs.forEach(t => t.classList.remove('active'));
                
                // 2. 현재 클릭한 탭 active 추가
                tab.classList.add('active');
    
                // 3. 슬라이더 위치 이동 
                moveSlider(tab);
    
                // 4. 모든 섹션 숨기기
                sections.forEach(sec => sec.classList.remove('active'));
    
                // 5. 클릭한 탭에 해당하는 섹션만 보여주기
                const targetId = tab.getAttribute('data-target');
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.classList.add('active');
                }
            });
        });
    
        window.addEventListener('resize', () => {
            const activeTab = document.querySelector('.skill-tabs .tab-item.active');
            if(activeTab) moveSlider(activeTab);
        });
    }
/* ==========================================================================
    6. 프로젝트 상세 모달 
    ========================================================================== */
function openModal(event, projectId) {
    if(event) event.preventDefault();

    const data = projectsData[projectId];
    if (!data) return;

    // 텍스트 데이터 채우기
    document.getElementById('modal-title').innerText = data.title;
    document.getElementById('modal-desc').innerText = data.desc;
    document.getElementById('modal-people').innerText = data.people;
    document.getElementById('modal-period').innerText = data.period;
    
    const linkEl = document.getElementById('modal-link');
    linkEl.href = data.link;
    linkEl.innerText = data.linkText;

    // 기술 배지 생성
    const badgeContainer = document.getElementById('modal-badges');
    badgeContainer.innerHTML = ''; 
    data.badges.forEach(text => {
        const span = document.createElement('span');
        span.className = 'badge';
        span.innerText = text;
        badgeContainer.appendChild(span);
    });

    // 상세 내용 리스트 생성
    const detailContainer = document.getElementById('modal-details');
    detailContainer.innerHTML = ''; 
    data.details.forEach(text => {
        const li = document.createElement('li');
        li.innerText = text;
        detailContainer.appendChild(li);
    });

    // 모달 보이기
    const modal = document.getElementById("project-modal");
    modal.classList.add("active");
    document.body.style.overflow = "hidden"; // 배경 스크롤 막기
}

function closeModal(event) {
    // 모달 내부 클릭 시 닫히지 않음 (닫기 버튼이나 배경 클릭 시에만 닫힘)
    if (event && event.target.closest('.modal-content') && !event.target.classList.contains('close-btn')) {
        return;
    }
    const modal = document.getElementById("project-modal");
    modal.classList.remove("active");
    document.body.style.overflow = "auto"; // 배경 스크롤 허용
}

