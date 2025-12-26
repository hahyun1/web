/* ==========================================================================
   [1] 초기화 및 테스트 목록 관리 (Test CRUD)
   ========================================================================== */

// 페이지 로드 시 테스트 목록 불러오기
document.addEventListener('DOMContentLoaded', loadTestList);

/**
 * 등록된 심리테스트 목록을 서버에서 가져와 렌더링
 */
async function loadTestList() {
    try {
        const res = await fetch('http://localhost:3000/api/tests');
        const tests = await res.json();
        const list = document.getElementById('admin-test-list');
        
        if(tests.length === 0) {
            list.innerHTML = '<li style="justify-content:center; color:#999;">등록된 테스트가 없습니다.</li>';
            return;
        }

        list.innerHTML = tests.map(t => 
            `<li>
                <span><strong>${t.title}</strong></span> 
                <div>
                    <button onclick="manageTest(${t.id}, '${t.title}')" style="margin-right:5px; border-color:#8F9F85; color:#8F9F85;">상세 관리</button>
                    <button onclick="editTest(${t.id})" style="color:#2196F3; margin-right:5px;">수정</button>
                    <button onclick="deleteTest(${t.id})" style="color:#F44336;">삭제</button>
                </div>
            </li>`
        ).join('');
    } catch (err) {
        console.error("목록 로드 실패:", err);
    }
}

/**
 * 테스트 등록 및 수정 (POST / PUT)
 */
async function uploadTest() {
    const id = document.getElementById('current-test-id').value; // 수정 시 ID 존재
    const title = document.getElementById('test_title').value;
    const desc = document.getElementById('test_desc').value;
    const category = document.getElementById('test_category').value;
    const file = document.getElementById('test_thumb').files[0];

    if (!title) return alert("제목을 입력해주세요.");

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', desc);
    formData.append('category', category);

    if(file) formData.append('thumbnail', file);

    let url = 'http://localhost:3000/api/tests';
    let method = 'POST';

    // ID가 있고 제목이 'Edit' 상태면 수정 모드
    if (id && document.getElementById('test-form-title').innerText.includes('Edit')) {
        url = `http://localhost:3000/api/tests/${id}`;
        method = 'PUT';
    }

    try {
        const response = await fetch(url, {
            method: method,
            body: formData
        });

        if(response.ok) {
            alert(method === 'POST' ? "등록 성공!" : "수정 성공!");
            resetTestForm(); // 폼 초기화
            loadTestList();  // 목록 갱신
        } else {
            alert("작업 실패");
        }
    } catch (err) {
        alert("서버 오류 발생");
    }
}

/**
 * 테스트 삭제 (DELETE)
 */
async function deleteTest(id) {
    if(!confirm("정말 삭제하시겠습니까? (관련된 질문과 결과도 모두 삭제됩니다)")) return;

    try {
        const res = await fetch(`http://localhost:3000/api/tests/${id}`, { method: 'DELETE' });
        if(res.ok) {
            alert("삭제되었습니다.");
            loadTestList();
            document.getElementById('detail-manager').style.display = 'none'; // 상세창 닫기
        }
    } catch (err) {
        alert("삭제 중 오류 발생");
    }
}

/**
 * 수정 모드 진입: 기존 데이터 폼에 채우기
 */
async function editTest(id) {
    const res = await fetch(`http://localhost:3000/api/tests/${id}`);
    const data = await res.json();
    const info = data.info; 

    // 폼 값 채우기
    document.getElementById('current-test-id').value = info.id;
    document.getElementById('test_title').value = info.title;
    document.getElementById('test_desc').value = info.description;

    // 기존 카테고리 값 선택 (없으면 기본값 '성격')
    document.getElementById('test_category').value = info.category || '성격';
    
    // UI 변경 (등록 모드 -> 수정 모드)
    document.getElementById('test-form-title').innerText = "Edit Test";
    const btn = document.querySelector('.submit-btn');
    btn.innerHTML = '<i class="fas fa-edit"></i> 테스트 수정하기';
    btn.onclick = uploadTest; 

    // 썸네일 미리보기
    if(info.thumbnail) {
        const preview = document.getElementById('test-preview-container');
        const img = document.getElementById('test-img-preview');
        preview.style.display = 'block';
        img.src = `http://localhost:3000${info.thumbnail}`;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 입력 폼 초기화 (등록 모드로 복귀)
 */
function resetTestForm() {
    document.getElementById('testForm').reset();
    document.getElementById('test_category').value = '성격';
    document.getElementById('current-test-id').value = '';
    document.getElementById('test-form-title').innerText = "Upload Test";
    
    const btn = document.querySelector('.view-detail.submit-btn');
    btn.innerHTML = '<i class="fas fa-check-circle"></i> 테스트 등록하기';
    
    document.getElementById('test-preview-container').style.display = 'none';
}


/* ==========================================================================
   [2] 상세 관리 공통 (탭 전환, 섹션 표시)
   ========================================================================== */

/**
 * '상세 관리' 버튼 클릭 시 실행
 */
function manageTest(id, title) {
    const section = document.getElementById('detail-manager');
    section.style.display = 'block';
    document.getElementById('managing-title').innerText = `[${title}] 상세 관리`;
    document.getElementById('current-test-id').value = id;
    
    // 데이터 로드
    loadQuestions(id);
    loadResults(id);
    
    // 스크롤 이동
    section.scrollIntoView({ behavior: 'smooth' });
}

/**
 * 탭 전환 (질문 관리 <-> 결과 관리)
 */
function showTab(type) {
    const qTab = document.getElementById('tab-questions');
    const rTab = document.getElementById('tab-results');
    const buttons = document.querySelectorAll('.project-info-col .btn-group button, .project-info-col button.submit-btn');

    if(type === 'q') {
        qTab.style.display = 'block';
        rTab.style.display = 'none';
    } else {
        qTab.style.display = 'none';
        rTab.style.display = 'block';
    }
}

/* ==========================================================================
   [3] 질문(Questions) 관리 로직
   ========================================================================== */

/**
 * 질문 목록 로드
 */
async function loadQuestions(testId) {
    const res = await fetch(`http://localhost:3000/api/questions/${testId}`);
    const data = await res.json();
    const list = document.getElementById('question-list');
    
    if(data.length === 0) {
        list.innerHTML = '<li style="color:#999;">등록된 질문이 없습니다.</li>';
        return;
    }

    list.innerHTML = data.map(q => 
        `<li>
            <div style="display:flex; flex-direction:column; gap:5px;">
                <span style="font-weight:bold; color:#4A3B32;">Q${q.question_order}. ${q.question_text}</span>
                <span style="font-size:0.85rem; color:#888;">
                    ${q.option_a} (${q.score_a}점) / ${q.option_b} (${q.score_b}점)
                </span>
            </div>
            <button onclick="deleteQuestion(${q.id})" style="color:red; border:1px solid #ffcdd2;">삭제</button>
        </li>`
    ).join('');
}

/**
 * 질문 등록 
 */
async function addQuestion() {
    const testId = document.getElementById('current-test-id').value;
    const order = document.getElementById('q_order').value;
    const text = document.getElementById('q_text').value;
    
    // 보기 및 점수 가져오기
    const optionA = document.getElementById('q_option_a').value; 
    const optionB = document.getElementById('q_option_b').value; 
    const scoreA = document.getElementById('q_score_a').value;   
    const scoreB = document.getElementById('q_score_b').value;   

    if(!testId) return alert("상세 관리할 테스트를 먼저 선택해주세요.");
    if(!order || !text || !optionA || !optionB) {
        return alert("모든 내용을 입력해주세요 (점수 제외 시 0 자동 입력)");
    }

    const res = await fetch('http://localhost:3000/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            test_id: testId, 
            question_order: order, 
            question_text: text,
            option_a: optionA,
            option_b: optionB,
            score_a: scoreA || 0, // 입력 없으면 0점
            score_b: scoreB || 0
        })
    });

    if(res.ok) {
        alert("질문이 등록되었습니다.");
        // 입력창 초기화
        document.getElementById('q_order').value = parseInt(order) + 1; // 다음 번호 자동 입력
        document.getElementById('q_text').value = '';
        document.getElementById('q_option_a').value = ''; 
        document.getElementById('q_option_b').value = '';
        document.getElementById('q_score_a').value = '';
        document.getElementById('q_score_b').value = '';
        
        loadQuestions(testId); 
    } else {
        alert("질문 등록 실패");
    }
}

/**
 * 질문 삭제
 */
async function deleteQuestion(id) {
    if(!confirm("이 질문을 삭제하시겠습니까?")) return;
    const testId = document.getElementById('current-test-id').value;
    
    await fetch(`http://localhost:3000/api/questions/${id}`, { method: 'DELETE' });
    loadQuestions(testId);
}


/* ==========================================================================
   [4] 결과(Results) 관리 로직
   ========================================================================== */

/**
 * 결과 목록 로드
 */
async function loadResults(testId) {
    const res = await fetch(`http://localhost:3000/api/results/${testId}`);
    const data = await res.json();
    const list = document.getElementById('result-list');
    
    if(data.length === 0) {
        list.innerHTML = '<li style="color:#999;">등록된 결과가 없습니다.</li>';
        return;
    }

    list.innerHTML = data.map(r => 
        `<li>
            <div style="display:flex; flex-direction:column;">
                <strong>${r.result_title}</strong>
                <span style="font-size:0.85rem; color:#888;">점수 범위: ${r.min_score} ~ ${r.max_score}점</span>
            </div>
            <button onclick="deleteResult(${r.id})" style="color:red; border:1px solid #ffcdd2;">삭제</button>
        </li>`
    ).join('');
}

/**
 * 결과 등록
 */
async function addResult() {
    const testId = document.getElementById('current-test-id').value;
    const title = document.getElementById('r_title').value;
    const desc = document.getElementById('r_desc').value;
    const min = document.getElementById('r_min').value;
    const max = document.getElementById('r_max').value;

    if(!testId) return alert("테스트를 선택해주세요.");
    if(!title || !min || !max) return alert("제목과 점수 범위를 입력해주세요.");

    const res = await fetch('http://localhost:3000/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            test_id: testId, 
            result_title: title, 
            result_desc: desc,
            min_score: min,
            max_score: max
        })
    });

    if(res.ok) {
        alert("결과가 등록되었습니다.");
        document.getElementById('r_title').value = ''; 
        document.getElementById('r_desc').value = '';
        document.getElementById('r_min').value = '';
        document.getElementById('r_max').value = '';
        loadResults(testId);
    } else {
        alert("결과 등록 실패");
    }
}

/**
 * 결과 삭제
 */
async function deleteResult(id) {
    if(!confirm("이 결과를 삭제하시겠습니까?")) return;
    const testId = document.getElementById('current-test-id').value;
    
    await fetch(`http://localhost:3000/api/results/${id}`, { method: 'DELETE' });
    loadResults(testId);
}