/* =========================================================
    [1] 기본 설정 및 라이브러리 불러오기
========================================================= */
const express = require('express');
const mysql = require('mysql2');
const mongoose = require('mongoose'); // MongoDB 라이브러리
const cors = require('cors');
const path = require('path');
const multer = require('multer'); // 파일 업로드 라이브러리
const fs = require('fs');       // 파일 시스템 라이브러리

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 정적 파일 라우팅: /uploads 경로로 uploads 폴더의 파일을 제공
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


/* =========================================================
    [2] Multer 설정 (파일 저장소)
========================================================= */
// uploads 폴더가 없으면 자동으로 생성
try {
    fs.readdirSync('uploads');
} catch (error) {
    console.error('uploads 폴더가 없어 생성합니다.');
    fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // 파일이 저장될 위치
    },
    filename: function (req, file, cb) {
        // 파일명 중복 방지를 위해 '현재시간-랜덤숫자.확장자' 형식으로 저장
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


/* =========================================================
    [3] MySQL 연결 (프로젝트 데이터용)
========================================================= */
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: 'root',
    password: 'root@1234', // 본인 비밀번호 확인
    database: 'my_portfolio'
});

db.connect((err) => {
    if (err) console.error('MySQL 연결 실패:', err);
    else console.log('MySQL 연결 성공!');
});


/* =========================================================
    [4] MongoDB 연결 (방문자 로그용)
========================================================= */
const mongoHost = process.env.MONGO_HOST || 'localhost';

mongoose.connect(`mongodb://${mongoHost}:27017/portfolio_log`)
    .then(() => console.log('MongoDB 연결 성공!'))
    .catch(err => console.log('MongoDB 연결 실패:', err));

// 방문자 스키마 및 모델 정의
const visitorSchema = new mongoose.Schema({
    ip: String,
    date: { type: Date, default: Date.now }
});

const Visitor = mongoose.model('Visitor', visitorSchema);


/* =========================================================
    [5] API 라우트 정의
========================================================= */

// --- 5-1. MongoDB API (방문자 카운터) ---
app.get('/api/visit', async (req, res) => {
    try {
        await Visitor.create({ ip: req.ip }); // 접속 로그 저장

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const totalCount = await Visitor.countDocuments();
        const todayCount = await Visitor.countDocuments({
            date: { $gte: todayStart }
        });

        res.json({ total: totalCount, today: todayCount });
    } catch (err) {
        console.error("방문자 카운트 에러:", err);
        res.status(500).json({ total: 0, today: 0 });
    }
});


// --- 5-2. MySQL API (프로젝트 관리) ---

// 목록 가져오기
app.get('/api/projects', (req, res) => {
    const sortOrder = req.query.sort === 'asc' ? 'ASC' : 'DESC';
    const sql = `SELECT * FROM projects ORDER BY is_current DESC, end_date ${sortOrder}, start_date ${sortOrder}`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 프로젝트 저장 (파일 업로드 포함)
app.post('/api/projects', upload.single('project_file'), (req, res) => {
    const { title, summary, start_date, end_date, is_current, tech_stack, team_size, link, link_text, detail_content } = req.body;
    
    // 파일이 있으면 경로 생성, 없으면 null
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    const techStackStr = Array.isArray(tech_stack) ? tech_stack.join(',') : tech_stack;

    const sql = `INSERT INTO projects 
        (title, summary, start_date, end_date, is_current, tech_stack, team_size, link, link_text, detail_content, image_url) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [title, summary, start_date, end_date, is_current, techStackStr, team_size, link, link_text, detail_content, image_url], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Success', id: result.insertId });
    });
});

// 프로젝트 수정 (파일 업로드 포함)
app.put('/api/projects/:id', upload.single('project_file'), (req, res) => {
    const { title, summary, start_date, end_date, is_current, tech_stack, team_size, link, link_text, detail_content } = req.body;
    const { id } = req.params;
    const techStackStr = Array.isArray(tech_stack) ? tech_stack.join(',') : tech_stack;

    let sql = '';
    let params = [];

    // 새 파일이 있는 경우 (이미지 교체)
    if (req.file) {
        const image_url = `/uploads/${req.file.filename}`;
        sql = `UPDATE projects SET title=?, summary=?, start_date=?, end_date=?, is_current=?, tech_stack=?, team_size=?, link=?, link_text=?, detail_content=?, image_url=? WHERE id=?`;
        params = [title, summary, start_date, end_date, is_current, techStackStr, team_size, link, link_text, detail_content, image_url, id];
    } 
    // 파일 변경이 없는 경우 (기존 이미지 유지)
    else {
        sql = `UPDATE projects SET title=?, summary=?, start_date=?, end_date=?, is_current=?, tech_stack=?, team_size=?, link=?, link_text=?, detail_content=? WHERE id=?`;
        params = [title, summary, start_date, end_date, is_current, techStackStr, team_size, link, link_text, detail_content, id];
    }

    db.query(sql, params, (err, result) => {
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
    [6] 페이지 라우팅 및 서버 시작
========================================================= */
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });
app.get('/admin', (req, res) => { res.sendFile(path.join(__dirname, 'admin.html')); });

app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});