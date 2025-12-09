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
   [3] MySQL 연결 (프로젝트 & 심리테스트 데이터용)
========================================================= */
const db = mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1', 
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


// --- 5-2. MySQL API (포트폴리오 프로젝트 관리) ---

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
app.post('/api/projects', upload.single('project_file'), (req, res) => {
    const { title, summary, start_date, end_date, is_current, tech_stack, team_size, link, link_text, detail_content } = req.body;
    
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

// 프로젝트 수정
app.put('/api/projects/:id', upload.single('project_file'), (req, res) => {
    const { title, summary, start_date, end_date, is_current, tech_stack, team_size, link, link_text, detail_content } = req.body;
    const { id } = req.params;
    const techStackStr = Array.isArray(tech_stack) ? tech_stack.join(',') : tech_stack;

    let sql = '';
    let params = [];

    if (req.file) {
        const image_url = `/uploads/${req.file.filename}`;
        sql = `UPDATE projects SET title=?, summary=?, start_date=?, end_date=?, is_current=?, tech_stack=?, team_size=?, link=?, link_text=?, detail_content=?, image_url=? WHERE id=?`;
        params = [title, summary, start_date, end_date, is_current, techStackStr, team_size, link, link_text, detail_content, image_url, id];
    } else {
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


// --- 5-3. MySQL API (심리테스트 관리) ---

// 1. 전체 심리테스트 목록 조회
app.get('/api/tests', (req, res) => {
    const sql = 'SELECT * FROM tests ORDER BY id DESC';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 2. 심리테스트 검색 API 
app.get('/api/tests/search', (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    const sql = `SELECT * FROM tests WHERE title LIKE ? OR description LIKE ? ORDER BY id DESC`;
    const searchTerm = `%${q}%`;
    
    db.query(sql, [searchTerm, searchTerm], (err, results) => {
        if (err) {
            console.error("검색 오류:", err);
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// 3. 최신 등록 테스트 3개 가져오기 (Best 3 표시용)
app.get('/api/tests/recent', (req, res) => {
    // DB에 등록된 ID를 기준으로 최신순으로 정렬
    const sql = 'SELECT id, title, thumbnail FROM tests ORDER BY id DESC LIMIT 3'; 
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 4. 특정 심리테스트 상세 정보 & 질문 가져오기
app.get('/api/tests/:id', (req, res) => {
    const { id } = req.params;
    
    const testSql = 'SELECT * FROM tests WHERE id = ?';
    const questionsSql = 'SELECT * FROM questions WHERE test_id = ? ORDER BY question_order ASC';
    
    db.query(testSql, [id], (err, testResult) => {
        if (err) return res.status(500).send(err);
        
        if (testResult.length === 0) {
            return res.status(404).json({ error: 'Test not found', message: '해당 테스트를 찾을 수 없습니다.' });
        }

        db.query(questionsSql, [id], (err, questionsResult) => {
            if (err) return res.status(500).send(err);
            
            res.json({
                info: testResult[0],
                questions: questionsResult
            });
        });
    });
});

// 5. 심리테스트 등록
app.post('/api/tests', upload.single('thumbnail'), (req, res) => {
    const { title, description } = req.body;
    const thumbnail = req.file ? `/uploads/${req.file.filename}` : null;

    const sql = 'INSERT INTO tests (title, description, thumbnail) VALUES (?, ?, ?)';
    db.query(sql, [title, description, thumbnail], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Test Created', id: result.insertId });
    });
});

// 6. 심리테스트 수정
app.put('/api/tests/:id', upload.single('thumbnail'), (req, res) => {
    const { title, description } = req.body;
    const { id } = req.params;
    
    let sql = 'UPDATE tests SET title=?, description=? WHERE id=?';
    let params = [title, description, id];

    if (req.file) {
        const thumbnail = `/uploads/${req.file.filename}`;
        sql = 'UPDATE tests SET title=?, description=?, thumbnail=? WHERE id=?';
        params = [title, description, thumbnail, id];
    }

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Test Updated' });
    });
});

// 7. 심리테스트 삭제
app.delete('/api/tests/:id', (req, res) => {
    db.query('DELETE FROM tests WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Test Deleted' });
    });
});


// --- 5-4. MySQL API (질문 & 결과 관리) ---

// 1. 특정 테스트의 질문 목록 가져오기
app.get('/api/questions/:testId', (req, res) => {
    const sql = 'SELECT * FROM questions WHERE test_id = ? ORDER BY question_order ASC';
    db.query(sql, [req.params.testId], (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 2. 질문 등록하기
app.post('/api/questions', (req, res) => {
    const { 
        test_id, question_text, question_order, 
        option_a, option_b, score_a, score_b 
    } = req.body;

    // 필수값 검증 추가
    if (!test_id || !question_text || question_order === undefined) {
        return res.status(400).json({ message: 'Missing required question fields (test_id, text, order)' });
    }

    const sql = `INSERT INTO questions 
        (test_id, question_text, question_order, option_a, option_b, score_a, score_b) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`; 
    
    db.query(sql, [test_id, question_text, question_order, option_a, option_b, score_a, score_b], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Question Added', id: result.insertId });
    });
});

// 3. 질문 삭제
app.delete('/api/questions/:id', (req, res) => {
    db.query('DELETE FROM questions WHERE id=?', [req.params.id], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Question Deleted' });
    });
});

// 4. 특정 테스트의 결과 목록 가져오기
app.get('/api/results/:testId', (req, res) => {
    const sql = 'SELECT * FROM results WHERE test_id = ?';
    db.query(sql, [req.params.testId], (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 5. 결과 등록하기
app.post('/api/results', (req, res) => {
    const { test_id, result_title, result_desc, min_score, max_score } = req.body;
    const sql = 'INSERT INTO results (test_id, result_title, result_desc, min_score, max_score) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [test_id, result_title, result_desc, min_score, max_score], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Result Added', id: result.insertId });
    });
});

// 6. 결과 삭제
app.delete('/api/results/:id', (req, res) => {
    db.query('DELETE FROM results WHERE id=?', [req.params.id], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Result Deleted' });
    });
});


/* =========================================================
   [6] 페이지 라우팅 및 서버 시작
========================================================= */
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });
app.use('/Portfolio', express.static(path.join(__dirname, 'Portfolio')));

app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});