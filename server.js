/* =========================================================
    [1] 기본 설정 및 라이브러리 불러오기
========================================================= */
const express = require('express');
const mysql = require('mysql2');
const mongoose = require('mongoose'); // MongoDB 라이브러리
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/* =========================================================
    [2] MySQL 연결 (프로젝트 데이터용)
    ========================================================= */
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: 'root',
    password: 'root@1234',  // 본인 비밀번호 확인
    database: 'my_portfolio'
});

db.connect((err) => {
    if (err) console.error('MySQL 연결 실패:', err);
    else console.log('MySQL 연결 성공!');
});

/* =========================================================
    [3] MongoDB 연결 (방문자 로그용)
    ========================================================= */
const mongoHost = process.env.MONGO_HOST || 'localhost';

// [중요 수정] 따옴표(') 대신 백틱(`)을 써야 변수(${mongoHost})가 들어갑니다!
mongoose.connect(`mongodb://${mongoHost}:27017/portfolio_log`) 
    .then(() => console.log('MongoDB 연결 성공!'))
    .catch(err => console.log('MongoDB 연결 실패:', err));
    
// 방문자 스키마(모양) 정의
const visitorSchema = new mongoose.Schema({
    ip: String,
    date: { type: Date, default: Date.now }
});
    
// 모델 생성 (Visitor -> visitors 컬렉션)
const Visitor = mongoose.model('Visitor', visitorSchema);


/* =========================================================
    [4] API 라우트 정의
    ========================================================= */

// --- 4-1. MongoDB 관련 API (방문자 카운터) ---
app.get('/api/visit', async (req, res) => {
    try {
        // 1. 접속 로그 저장
        await Visitor.create({ ip: req.ip });

        // 2. 오늘 날짜(00시 00분) 구하기
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // 3. 전체 카운트
        const totalCount = await Visitor.countDocuments();

        // 4. 오늘 카운트
        const todayCount = await Visitor.countDocuments({
            date: { $gte: todayStart }
        });

        res.json({ total: totalCount, today: todayCount });
    } catch (err) {
        console.error("방문자 카운트 에러:", err);
        res.status(500).json({ total: 0, today: 0 });
    }
});


// --- 4-2. MySQL 관련 API (프로젝트 목록) ---

// 목록 가져오기
app.get('/api/projects', (req, res) => {
    const sortOrder = req.query.sort === 'asc' ? 'ASC' : 'DESC';
    const sql = `SELECT * FROM projects ORDER BY is_current DESC, end_date ${sortOrder}, start_date ${sortOrder}`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 프로젝트 저장
app.post('/api/projects', (req, res) => {
    const { title, summary, start_date, end_date, is_current, tech_stack, team_size, link, link_text, detail_content } = req.body;
    const techStackStr = Array.isArray(tech_stack) ? tech_stack.join(',') : tech_stack;

    const sql = `INSERT INTO projects (title, summary, start_date, end_date, is_current, tech_stack, team_size, link, link_text, detail_content) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [title, summary, start_date, end_date, is_current, techStackStr, team_size, link, link_text, detail_content], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Success', id: result.insertId });
    });
});

// 프로젝트 수정
app.put('/api/projects/:id', (req, res) => {
    const { title, summary, start_date, end_date, is_current, tech_stack, team_size, link, link_text, detail_content } = req.body;
    const { id } = req.params;
    const techStackStr = Array.isArray(tech_stack) ? tech_stack.join(',') : tech_stack;

    const sql = `UPDATE projects SET title=?, summary=?, start_date=?, end_date=?, is_current=?, tech_stack=?, team_size=?, link=?, link_text=?, detail_content=? WHERE id=?`;

    db.query(sql, [title, summary, start_date, end_date, is_current, techStackStr, team_size, link, link_text, detail_content, id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Updated' });
    });
});

// 프로젝트 삭제
app.delete('/api/projects/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM projects WHERE id=?', [id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Deleted' });
    });
});


/* =========================================================
    [5] 페이지 라우팅 및 서버 시작
    ========================================================= */
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });
app.get('/admin', (req, res) => { res.sendFile(path.join(__dirname, 'admin.html')); });

app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});