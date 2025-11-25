/* ==========================================================================
 * 1. 전역 변수 및 서버 설정
 * ========================================================================== */
const SERVER_URL = 'http://localhost:3000/api/projects';

/* ==========================================================================
 * 2. 초기화 (Initialization)
 * ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    initBadgePreview();
    loadAdminProjects(); // 페이지 로드 시 목록 불러오기
});

// [기능] 종료 날짜 토글 (진행 중 체크 시)
function toggleEndDate() {
    const isCurrent = document.getElementById('is_current').checked;
    const endDateInput = document.getElementById('end_date');
    
    if (isCurrent) {
        endDateInput.value = '';
        endDateInput.disabled = true;
        endDateInput.style.backgroundColor = '#eee';
    } else {
        endDateInput.disabled = false;
        endDateInput.style.backgroundColor = '#fff';
    }
}

// [기능] 프로젝트 저장 및 수정 (CREATE / UPDATE)
async function submitProject() {
    const getValue = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : "";
    };

    const isCurrent = document.getElementById('is_current').checked;
    const editId = document.getElementById('edit-id').value; // 수정 모드 확인

    const data = {
        title: getValue('title'),
        summary: getValue('summary'),
        start_date: getValue('start_date'),
        end_date: isCurrent ? null : getValue('end_date'),
        is_current: isCurrent,
        tech_stack: getValue('tech_stack'),
        team_size: getValue('team_size'),
        link: getValue('link'),
        link_text: getValue('link_text'),
        detail_content: getValue('detail_content')
    };

    // 필수값 체크
    if (!data.title || !data.start_date) {
        alert("제목과 시작 날짜는 필수입니다!");
        return;
    }

    try {
        let response;
        // ID가 있으면 수정(PUT), 없으면 새글(POST)
        if (editId) {
            response = await fetch(`${SERVER_URL}/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            response = await fetch(SERVER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }

        if (response.ok) {
            // [수정] 홈으로 이동하지 않고 현재 페이지 유지
            alert(editId ? "수정 완료!" : "저장 성공!");
            
            resetForm();       // 입력창 비우기
            loadAdminProjects(); // 아래 목록 새로고침 (저장된 거 바로 확인 가능)
            
        } else {
            alert("작업 실패: 서버 에러");
        }
    } catch (error) {
        console.error(error);
        alert("서버가 꺼져있습니다. (node server.js 확인)");
    }
}

// [기능] 관리자용 프로젝트 목록 불러오기 (READ)
async function loadAdminProjects() {
    const listContainer = document.getElementById('admin-project-list');
    if(!listContainer) return;

    try {
        // 최신순(desc)으로 가져와서 위쪽에 보이게 함
        const response = await fetch(SERVER_URL + '?sort=desc');
        const projects = await response.json();

        listContainer.innerHTML = '';
        
        if (projects.length === 0) {
            listContainer.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">등록된 프로젝트가 없습니다.</p>';
            return;
        }

        projects.forEach(p => {
            const li = document.createElement('li');
            li.className = 'admin-list-item';
            
            // 데이터를 수정 함수에 넘기기 위해 문자열로 변환 (특수문자 처리)
            const dataStr = JSON.stringify(p).replace(/"/g, '&quot;');
            
            // 날짜 표시 (YYYY-MM)
            const dateDisplay = p.start_date ? p.start_date.substring(0, 7) : '';

            li.innerHTML = `
                <div class="info">
                    <strong>${p.title}</strong>
                    <span style="font-size:0.85rem; color:#888; margin-left:10px;">(${dateDisplay})</span>
                </div>
                <div class="actions">
                    <button type="button" class="btn-edit" onclick="startEdit(${dataStr})">수정</button>
                    <button type="button" class="btn-delete" onclick="deleteProject(${p.id})">삭제</button>
                </div>
            `;
            listContainer.appendChild(li);
        });
    } catch (error) {
        console.error("목록 로딩 실패:", error);
    }
}

// [기능] 삭제 (DELETE)
async function deleteProject(id) {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
        const response = await fetch(`${SERVER_URL}/${id}`, { method: 'DELETE' });
        if (response.ok) {
            alert("🗑️ 삭제되었습니다.");
            loadAdminProjects(); // 목록 갱신
        } else {
            alert("삭제 실패");
        }
    } catch (error) {
        alert("서버 에러");
    }
}

// [기능] 수정 모드 시작 (폼 채우기)
function startEdit(data) {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 1. hidden ID 설정
    document.getElementById('edit-id').value = data.id;

    // 2. 값 채우기
    document.getElementById('title').value = data.title;
    document.getElementById('summary').value = data.summary;
    
    if(data.start_date) document.getElementById('start_date').value = data.start_date.substring(0, 10);
    if(data.end_date) document.getElementById('end_date').value = data.end_date.substring(0, 10);
    
    document.getElementById('is_current').checked = (data.is_current == 1);
    toggleEndDate(); // 날짜칸 활성/비활성 처리

    document.getElementById('tech_stack').value = data.tech_stack;
    document.getElementById('team_size').value = data.team_size || '';
    document.getElementById('link').value = data.link || '';
    document.getElementById('link_text').value = data.link_text || '';
    document.getElementById('detail_content').value = data.detail_content || '';

    // 3. 배지 미리보기 강제 실행
    const event = new Event('input');
    document.getElementById('tech_stack').dispatchEvent(event);

    // 4. UI 변경 (수정 모드임을 알림)
    document.getElementById('form-title').innerText = "Edit Project ✏️";
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.innerHTML = '<i class="fas fa-check"></i> 수정 완료';
    submitBtn.style.color = "#2196F3"; 
    submitBtn.style.borderColor = "#2196F3";
    
    document.getElementById('cancel-btn').style.display = 'inline-flex';
}

// [기능] 폼 초기화 (취소 버튼)
function resetForm() {
    document.getElementById('uploadForm').reset();
    document.getElementById('edit-id').value = '';
    document.getElementById('tech-preview').innerHTML = '<span class="badge badge-gray" style="opacity:0.5">입력하면 배지가 나타납니다</span>';
    
    // UI 원상복구
    document.getElementById('form-title').innerText = "Upload Project";
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.innerHTML = '<i class="fas fa-upload"></i> DB에 저장하기';
    submitBtn.style.color = ""; 
    submitBtn.style.borderColor = "";
    
    document.getElementById('cancel-btn').style.display = 'none';
    toggleEndDate(); // 날짜칸 초기화
}

// [기능] 배지 색상 로직 
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

// [기능] 배지 미리보기 초기화
function initBadgePreview() {
    const techInput = document.getElementById('tech_stack');
    const previewBox = document.getElementById('tech-preview');

    if(techInput && previewBox) {
        techInput.addEventListener('input', (e) => {
            const text = e.target.value;
            
            if (!text.trim()) {
                previewBox.innerHTML = '<span class="badge badge-gray" style="opacity:0.5; font-size:0.8rem;">입력하면 배지가 나타납니다</span>';
                return;
            }

            const badgesHtml = text.split(',').map(tech => {
                if (!tech.trim()) return '';
                const className = getBadgeClass(tech);
                // index.css의 .badge 클래스 사용
                return `<span class="badge ${className}" style="margin-right:5px; margin-bottom:5px;">${tech.trim()}</span>`;
            }).join('');

            previewBox.innerHTML = badgesHtml;
        });
    }
}

// 전역 노출
window.toggleEndDate = toggleEndDate;
window.submitProject = submitProject;
window.deleteProject = deleteProject;
window.startEdit = startEdit;
window.resetForm = resetForm;