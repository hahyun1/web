const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = 3000;

// 프론트엔드에서 오는 요청 허용
app.use(cors());
app.use(express.json());

// ★ [중요] DB 연결 설정 (본인 비밀번호로 바꾸세요!)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'YOUR_PASSWORD', // ★ 여기에 DBeaver 로그인할 때 쓴 비밀번호 입력!
    database: 'my_portfolio'
});

db.connect((err) => {
    if (err) console.error('❌ DB 연결 실패:', err);
    else console.log('✅ DB 연결 성공!');
});

// ==========================================
// API (메뉴판) 만들기
// ==========================================

// 1. 프로젝트 목록 달라는 주문 (GET /api/projects)
app.get('/api/projects', (req, res) => {
    // 손님이 '정렬(sort)'을 'oldest'로 요청했는지 확인
    const sortOrder = req.query.sort === 'oldest' ? 'ASC' : 'DESC';
    
    // DB에 보낼 SQL 주문서 (date_str 기준으로 정렬)
    // DESC: 내림차순 (최신순), ASC: 오름차순 (오래된순)
    const sql = `SELECT * FROM projects ORDER BY date_str ${sortOrder}`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results); // 찾은 데이터를 손님에게 줌
    });
});

// 2. 프로젝트 추가 주문 (POST /api/projects)
app.post('/api/projects', (req, res) => {
    const { title, summary, date_str, tech_stack, team_size, link, detail_content } = req.body;
    
    // 기술 스택 배열을 문자열로 변환
    const techStackStr = Array.isArray(tech_stack) ? tech_stack.join(',') : tech_stack;

    const sql = `INSERT INTO projects (title, summary, date_str, tech_stack, team_size, link, detail_content) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    db.query(sql, [title, summary, date_str, techStackStr, team_size, link, detail_content], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: '저장 완료', id: result.insertId });
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 서버가 3000번 포트에서 실행 중입니다.`);
});