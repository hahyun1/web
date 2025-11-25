const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path'); 

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); 

// DB 연결 설정
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root@1234', 
    database: 'my_portfolio'
});

db.connect((err) => {
    if (err) console.error('DB 연결 실패:', err);
    else console.log('DB 연결 성공!');
});

// ---------------- API ----------------

// [GET] 목록 가져오기 (READ)
app.get('/api/projects', (req, res) => {
    const sortOrder = req.query.sort === 'asc' ? 'ASC' : 'DESC';
    
    // 정렬 기준: (1) 진행 중인 것 우선 (2) 종료일 최신순 (3) 시작일 최신순
    const sql = `
        SELECT * FROM projects 
        ORDER BY is_current DESC, end_date ${sortOrder}, start_date ${sortOrder}
    `;
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 저장하기 
app.post('/api/projects', (req, res) => {
    const { 
        title, summary, start_date, end_date, is_current, 
        tech_stack, team_size, link, link_text, detail_content 
    } = req.body;

    const techStackStr = Array.isArray(tech_stack) ? tech_stack.join(',') : tech_stack;

    const sql = `INSERT INTO projects 
        (title, summary, start_date, end_date, is_current, tech_stack, team_size, link, link_text, detail_content) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.query(sql, [
        title, summary, start_date, end_date, is_current, 
        techStackStr, team_size, link, link_text, detail_content
    ], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Success', id: result.insertId });
    });
});

// 수정하기 
app.put('/api/projects/:id', (req, res) => {
    const { 
        title, summary, start_date, end_date, is_current, 
        tech_stack, team_size, link, link_text, detail_content 
    } = req.body;
    const { id } = req.params;
    const techStackStr = Array.isArray(tech_stack) ? tech_stack.join(',') : tech_stack;

    const sql = `UPDATE projects SET 
        title=?, summary=?, start_date=?, end_date=?, is_current=?, 
        tech_stack=?, team_size=?, link=?, link_text=?, detail_content=? 
        WHERE id=?`;

    db.query(sql, [
        title, summary, start_date, end_date, is_current, 
        techStackStr, team_size, link, link_text, detail_content, id
    ], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Updated' });
    });
});

// 삭제하기 
app.delete('/api/projects/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM projects WHERE id=?', [id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Deleted' });
    });
});

// 라우팅 (메인, 관리자 페이지)
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });
app.get('/admin', (req, res) => { res.sendFile(path.join(__dirname, 'admin.html')); });

// 서버 시작
app.listen(PORT, () => { console.log(`서버가 3000번 포트에서 실행 중입니다.`); });