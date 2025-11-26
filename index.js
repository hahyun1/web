/* ==========================================================================
 * 1. 전역 변수 및 서버 설정
 * ========================================================================== */
const SERVER_URL = 'http://localhost:3000/api/projects';
let lastScrollY = 0;
let projectsData = {}; // 프로젝트 ID를 키로 데이터 저장
let isOldest = false; // 정렬 상태 (false: 최신순, true: 오래된순)

/* ==========================================================================
 * 2. 초기화 (Initialization)
 * ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    initScrollHeader(); 
    initScrollReveal(); 
    initSkillScrollSpy(); 
    
    // [초기 로드] 최신순(desc)으로 시작
    loadProjects('desc'); 
    
    // 모달 닫기 이벤트 연결
    const modal = document.getElementById("project-modal");
    if (modal) {
        modal.addEventListener('click', closeModal);
    }

    // [추가] 방문자 수 업데이트 실행
    updateVisitCount();
});

/* ==========================================================================
 * 3. 데이터 로딩 & 화면 출력
 * ========================================================================== */

// [기능] 기술 스택 배지 색상 판별
function getBadgeClass(techName) {
    const name = techName.toLowerCase().trim();

    // 1. Languages
    if (name === 'c') return 'badge-c';
    if (name === 'c++' || name === 'cpp') return 'badge-cpp';
    if (name === 'c#' || name === 'csharp') return 'badge-csharp';
    if (name === 'java') return 'badge-java';
    if (name.includes('python')) return 'badge-python';
    if (name === 'js' || name === 'javascript') return 'badge-js';
    if (name === 'ts' || name === 'typescript') return 'badge-ts';

    // 2. FrontEnd & Web
    if (name.includes('react')) return 'badge-react';
    if (name.includes('vue')) return 'badge-vue';
    if (name.includes('next')) return 'badge-next';
    if (name.includes('html')) return 'badge-html';
    if (name.includes('css')) return 'badge-css';
    if (name.includes('tailwind')) return 'badge-tailwind';

    // 3. BackEnd & Frameworks
    if (name.includes('node')) return 'badge-node';
    if (name.includes('spring')) return 'badge-spring';
    if (name.includes('django')) return 'badge-django';

    // 4. Mobile
    if (name.includes('flutter')) return 'badge-flutter';
    if (name.includes('swift')) return 'badge-swift';
    if (name.includes('kotlin')) return 'badge-kotlin';

    // 5. Data & DB
    if (name.includes('mongo')) return 'badge-mongo';
    if (name.includes('firebase')) return 'badge-firebase';
    if (name.includes('sql') || name.includes('db') || name.includes('database')) return 'badge-db';

    // 6. Tools & Cloud
    if (name.includes('aws')) return 'badge-aws';
    if (name.includes('docker')) return 'badge-docker';
    if (name.includes('figma')) return 'badge-figma';
    if (name.includes('git')) {
        if (name.includes('hub')) return 'badge-github';
        return 'badge-git';
    }

    // 그 외는 회색 처리
    return 'badge-gray'; 
}

// [기능] 기술 스택 HTML 생성
function createTechHtml(techStackStr) {
    if (!techStackStr) return '';
    return techStackStr.split(',').map(tech => {
        const className = getBadgeClass(tech);
        return `<span class="badge ${className}">${tech.trim()}</span>`;
    }).join('');
}

// [기능] 날짜 포맷팅 (YYYY-MM-DD -> YYYY.MM 변환 및 기간 합치기)
function formatDateRange(start, end, isCurrent) {
    if (!start) return '';
    
    // 앞 7자리(YYYY-MM)만 자르고 -를 .으로 변경
    const startDate = start.substring(0, 7).replace('-', '.');
    
    if (isCurrent) {
        return `${startDate} - Current`;
    } else if (end) {
        const endDate = end.substring(0, 7).replace('-', '.');
        return (startDate === endDate) ? startDate : `${startDate} - ${endDate}`;
    } else {
        return startDate;
    }
}

// [기능] 서버에서 프로젝트 목록 가져오기
async function loadProjects(sortType) {
    const timelineList = document.querySelector('.timeline-list');
    
    try {
        // 서버 요청
        const response = await fetch(`${SERVER_URL}?sort=${sortType}`);
        let projects = await response.json();

        projects.sort((a, b) => {

            const getEndDate = (p) => {

                if (p.is_current) return new Date().getTime(); 
                // 끝난 날짜가 있으면 그 날짜, 없으면 0 (아주 과거)
                return p.end_date ? new Date(p.end_date).getTime() : 0;
            };

            const dateA = getEndDate(a);
            const dateB = getEndDate(b);

            if (dateA === dateB) {
                const startA = new Date(a.start_date).getTime();
                const startB = new Date(b.start_date).getTime();
                // 최신순일 땐 늦게 시작한 게 위로, 오래된순일 땐 빨리 시작한 게 위로
                return sortType === 'asc' ? startA - startB : startB - startA;
            }

            if (sortType === 'asc') {

                return dateA - dateB; 
            } else {

                return dateB - dateA; 
            }
        });
        // ============================================================

        timelineList.innerHTML = ''; // 초기화
        projectsData = {}; 

        if (projects.length === 0) {
            timelineList.innerHTML = '<p style="text-align:center; padding:50px; color:#888;">아직 등록된 프로젝트가 없습니다.</p>';
            return;
        }

        projects.forEach(data => {
            projectsData[data.id] = data; 
            
            const dateText = formatDateRange(data.start_date, data.end_date, data.is_current);
            const activeClass = data.is_current ? 'current' : '';
            const nowBadge = data.is_current ? '<span class="ing-badge" style="font-size:0.65rem; background:#4CAF50; color:white; padding:2px 5px; border-radius:4px; margin-left:8px; vertical-align:middle;">NOW</span>' : '';

            const html = `
            <div class="timeline-item scroll-reveal ${activeClass}">
                <div class="project-date-col">
                    <div class="date-wrapper">
                        <span class="date-icon">✱</span>
                        <span class="date-text">${dateText}</span>
                    </div>
                </div>
                <div class="project-info-col">
                    <h3 class="project-title">${data.title} ${nowBadge}</h3>
                    <p class="p-desc">${data.summary}</p>
                
                    <div class="tech-stack">
                        ${createTechHtml(data.tech_stack)}
                    </div>

                    <a href="#" class="view-detail" onclick="openModal(event, ${data.id})">
                        <i class="fas fa-chevron-right" style="font-size: 0.7rem;"></i> 상세보기
                    </a>
                </div>
            </div>
            `;
            timelineList.insertAdjacentHTML('beforeend', html);
        });

        initScrollReveal(); 

    } catch (error) {
        console.error("서버 연결 실패:", error);
        timelineList.innerHTML = '<p style="text-align:center; padding:50px; color:red;">⚠️ 서버 연결 실패 (Docker 실행 여부를 확인하세요)</p>';
    }
}

// [기능] 정렬 토글 버튼
function toggleSort() {
    const btn = document.getElementById('sort-btn');
    if (!btn) return;

    isOldest = !isOldest; 

    if (isOldest) {
        btn.innerHTML = '<i class="fas fa-sort-amount-up"></i> 오래된순';
        loadProjects('asc'); // 오름차순
    } else {
        btn.innerHTML = '<i class="fas fa-sort-amount-down"></i> 최신순';
        loadProjects('desc'); // 내림차순
    }
}

/* ==========================================================================
 * 4. 모달 (상세보기) 기능
 * ========================================================================== */
function openModal(event, dbId) {
    if(event) event.preventDefault();

    const data = projectsData[dbId];
    if (!data) return;

    // 기본 텍스트
    document.getElementById('modal-title').innerText = data.title;
    document.getElementById('modal-desc').innerText = data.summary;
    document.getElementById('modal-people').innerText = data.team_size || '-';
    
    // 날짜
    document.getElementById('modal-period').innerText = formatDateRange(data.start_date, data.end_date, data.is_current);
    
    // 링크
    const linkEl = document.getElementById('modal-link');
    if(data.link) {
        linkEl.href = data.link;
        linkEl.innerText = data.link_text || "바로가기";
        linkEl.style.display = "inline-block";
        linkEl.target = "_blank";
    } else {
        linkEl.innerText = "";
        linkEl.removeAttribute("href");
    }

    // 기술 스택 & 상세 내용
    document.getElementById('modal-badges').innerHTML = createTechHtml(data.tech_stack);
    const content = data.detail_content ? data.detail_content.replace(/\n/g, '<br>') : '내용 없음';
    document.getElementById('modal-details').innerHTML = `<li style="list-style:none;">${content}</li>`;

    // 모달 열기
    const modal = document.getElementById("project-modal");
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeModal(event) {
    // 배경 클릭 시 닫기 (내부 컨텐츠 클릭 제외)
    if (event && event.target.closest('.modal-content') && !event.target.classList.contains('close-btn')) {
        return;
    }
    const modal = document.getElementById("project-modal");
    modal.classList.remove("active");
    document.body.style.overflow = "auto";
}

/* ==========================================================================
 * 5. UI 기능 (스크롤, 탭) 
 * ========================================================================== */
function initScrollHeader() {
    const header = document.querySelector("header");
    if(!header) return;
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

function initScrollReveal() {
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active-ani");
            }
        });
    }, { root: null, rootMargin: "0px", threshold: 0.1 });
    document.querySelectorAll(".scroll-reveal").forEach(el => observer.observe(el));
}

function initSkillScrollSpy() {
    const tabs = document.querySelectorAll('.skill-tabs .tab-item');
    const sections = document.querySelectorAll('.skill-group');
    const slider = document.querySelector('.sliding-bar');

    if(!tabs.length || !slider) return;

    function moveSlider(tab) {
        slider.style.top = tab.offsetTop + "px";
        slider.style.height = tab.offsetHeight + "px";
    }

    if(tabs.length > 0) {
        moveSlider(tabs[0]);
        tabs[0].classList.add('active');
        const firstTargetId = tabs[0].getAttribute('data-target');
        if(firstTargetId) {
            const el = document.getElementById(firstTargetId);
            if(el) el.classList.add('active');
        }
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            moveSlider(tab);
            sections.forEach(sec => sec.classList.remove('active'));
            const targetId = tab.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) targetSection.classList.add('active');
        });
    });

    window.addEventListener('resize', () => {
        const activeTab = document.querySelector('.skill-tabs .tab-item.active');
        if(activeTab) moveSlider(activeTab);
    });
}

/* ==========================================================================
    방문자 수 가져오기 (MongoDB 연동)
 * ========================================================================== */
    async function updateVisitCount() {
        const textSpan = document.getElementById('visit-text');
        if (!textSpan) return; // HTML에 태그가 없으면 그냥 종료
    
        try {
            // 서버에 요청
            const response = await fetch('http://localhost:3000/api/visit');
            const data = await response.json();
            
            // 화면에 표시 (Today: 빨간색, Total: 검은색)
            textSpan.innerHTML = `
                <span style="color:#555; font-size:0.9em;">Today</span> 
                <span style="color:#d32f2f; font-weight:bold;">${data.today}</span>
                <span style="color:#ccc; margin:0 6px;">|</span>
                <span style="color:#555; font-size:0.9em;">Total</span> 
                <span>${data.total.toLocaleString()}</span>
            `;
        } catch (error) {
            console.error("방문자 정보 로딩 실패:", error);
            textSpan.innerText = "Count Error";
        }
    }

// 전역 노출
window.toggleSort = toggleSort;
window.openModal = openModal;
window.closeModal = closeModal;