/* =========================================================
   [1] 기본 설정 및 라이브러리 로드
========================================================= */
const express = require('express');
const mysql = require('mysql2');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const PORT = 3000;

// 세션 미들웨어 설정
app.use(session({
    secret: 'my_secret_key', 
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 업로드 파일 정적 경로 설정
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


/* =========================================================
   [2] Multer 설정 (파일 업로드)
========================================================= */
// 업로드 폴더 존재 확인 및 생성
try {
    fs.readdirSync('uploads');
} catch (error) {
    console.error('uploads 폴더가 없어 생성합니다.');
    fs.mkdirSync('uploads');
}

// 파일 저장 방식 및 파일명 규칙 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


/* =========================================================
   [3] MySQL 연결 (메인 데이터베이스)
========================================================= */
const db = mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1', 
    user: 'root',
    password: 'root@1234', 
    database: 'my_portfolio'
});

db.connect((err) => {
    if (err) console.error('MySQL 연결 실패:', err);
    else console.log('MySQL 연결 성공!');
});


/* =========================================================
   [4] MongoDB 연결 (방문자 로그 데이터베이스)
========================================================= */
const mongoHost = process.env.MONGO_HOST || 'localhost';

mongoose.connect(`mongodb://${mongoHost}:27017/portfolio_log`)
    .then(() => console.log('MongoDB 연결 성공!'))
    .catch(err => console.log('MongoDB 연결 실패:', err));

// 방문자 정보 데이터 모델 정의
const visitorSchema = new mongoose.Schema({
    ip: String,
    date: { type: Date, default: Date.now }
});

const Visitor = mongoose.model('Visitor', visitorSchema);


/* =========================================================
   [5] API 라우트 정의
========================================================= */

// 로그인 여부 확인 미들웨어
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ message: '로그인이 필요합니다.' });
    }
};

// --- 5-0. 회원 관리 API ---

// 회원가입
app.post('/api/register', async (req, res) => {
    const { user_id, password, nickname } = req.body;
    if (!user_id || !password || !nickname) return res.status(400).json({ message: '모든 항목을 입력해주세요.' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (user_id, password, nickname) VALUES (?, ?, ?)';
        db.query(sql, [user_id, hashedPassword, nickname], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: '이미 존재하는 아이디입니다.' });
                return res.status(500).json({ message: '서버 에러' });
            }
            res.json({ message: '회원가입 성공!' });
        });
    } catch (error) { res.status(500).json({ message: '암호화 오류' }); }
});

// 로그인 및 세션 생성
app.post('/api/login', (req, res) => {
    const { user_id, password } = req.body;
    const sql = 'SELECT * FROM users WHERE user_id = ?';
    db.query(sql, [user_id], async (err, results) => {
        if (err) return res.status(500).json({ message: '서버 에러' });
        if (results.length === 0) return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        
        if (match) {
            req.session.user = { id: user.id, user_id: user.user_id, nickname: user.nickname };
            req.session.save(() => { res.json({ message: '로그인 성공', user: req.session.user }); });
        } else {
            res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
        }
    });
});

// 로그아웃 및 세션 파기
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).send('로그아웃 실패');
        res.clearCookie('connect.sid'); 
        res.json({ message: '로그아웃 성공' });
    });
});

// 현재 로그인 상태 조회
app.get('/api/auth/status', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// --- 5-1. 방문자 통계 API (MongoDB) ---

// 방문 로그 저장 및 전체/오늘 방문자 수 조회
app.get('/api/visit', async (req, res) => {
    try {
        await Visitor.create({ ip: req.ip });

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

// 특정 테스트의 조회수 증가
app.post('/api/tests/:id/visit', (req, res) => {
    const { id } = req.params;
    const sql = 'UPDATE tests SET visit_count = visit_count + 1 WHERE id = ?';
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("조회수 증가 실패:", err);
            return res.status(500).send(err);
        }
        res.json({ message: 'Visit count incremented' });
    });
});


// --- 5-2. 프로젝트 관리 API (MySQL) ---

// 프로젝트 전체 목록 조회
app.get('/api/projects', (req, res) => {
    const sortOrder = req.query.sort === 'asc' ? 'ASC' : 'DESC';
    const sql = `SELECT * FROM projects ORDER BY is_current DESC, end_date ${sortOrder}, start_date ${sortOrder}`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 새 프로젝트 등록
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

// 기존 프로젝트 정보 수정
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


// --- 5-3. 심리테스트 관리 API ---

// 전체 심리테스트 목록 조회
app.get('/api/tests', (req, res) => {
    const sql = 'SELECT * FROM tests ORDER BY id DESC';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 검색어 기준 심리테스트 필터링 조회
app.get('/api/tests/search', (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    const sql = `SELECT * FROM tests WHERE title LIKE ? OR description LIKE ? OR category LIKE ? ORDER BY id DESC`;
    const searchTerm = `%${q}%`;
    
    db.query(sql, [searchTerm, searchTerm, searchTerm], (err, results) => {
        if (err) {
            console.error("검색 오류:", err);
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// 조회수 기준 상위 3개 테스트 조회
app.get('/api/tests/recent', (req, res) => {
    const sql = 'SELECT id, title, thumbnail, category, visit_count FROM tests ORDER BY visit_count DESC, id DESC LIMIT 3'; 
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 가장 최신 등록 테스트 1개 조회
app.get('/api/tests/latest', (req, res) => {
    const sql = 'SELECT id, title, description, thumbnail FROM tests ORDER BY created_at DESC LIMIT 1'; 
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("최신 테스트 로드 실패:", err);
            return res.status(500).send({ message: "데이터베이스 오류" });
        }
        if (results.length === 0) return res.json({});
        res.json(results[0]);
    });
});

// 특정 테스트 정보 및 관련 질문 목록 조회
app.get('/api/tests/:id', (req, res) => {
    const { id } = req.params;
    const testSql = 'SELECT * FROM tests WHERE id = ?';
    const questionsSql = 'SELECT * FROM questions WHERE test_id = ? ORDER BY question_order ASC';
    
    db.query(testSql, [id], (err, testResult) => {
        if (err) return res.status(500).send(err);
        if (testResult.length === 0) return res.status(404).json({ message: '해당 테스트를 찾을 수 없습니다.' });

        db.query(questionsSql, [id], (err, questionsResult) => {
            if (err) return res.status(500).send(err);
            res.json({ info: testResult[0], questions: questionsResult });
        });
    });
});

// 새 심리테스트 등록
app.post('/api/tests', upload.single('thumbnail'), (req, res) => {
    const { title, description, category } = req.body;
    const thumbnail = req.file ? `/uploads/${req.file.filename}` : null;
    const sql = 'INSERT INTO tests (title, description, thumbnail, category) VALUES (?, ?, ?, ?)';
    const categoryValue = category || '성격';

    db.query(sql, [title, description, thumbnail, categoryValue], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Test Created', id: result.insertId });
    });
});

// 심리테스트 정보 수정
app.put('/api/tests/:id', upload.single('thumbnail'), (req, res) => {
    const { title, description, category } = req.body; 
    const { id } = req.params;
    const categoryValue = category || '성격';

    let sql = '';
    let params = [];

    if (req.file) {
        const thumbnail = `/uploads/${req.file.filename}`;
        sql = `UPDATE tests SET title=?, description=?, thumbnail=?, category=? WHERE id=?`;
        params = [title, description, thumbnail, categoryValue, id];
    } else {
        sql = `UPDATE tests SET title=?, description=?, category=? WHERE id=?`;
        params = [title, description, categoryValue, id]; 
    }

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Test Updated' });
    });
});

// 심리테스트 삭제
app.delete('/api/tests/:id', (req, res) => {
    db.query('DELETE FROM tests WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Test Deleted' });
    });
});


// --- 5-4. 질문 및 결과 구성 API ---

// 특정 테스트의 질문 목록 조회
app.get('/api/questions/:testId', (req, res) => {
    const sql = 'SELECT * FROM questions WHERE test_id = ? ORDER BY question_order ASC';
    db.query(sql, [req.params.testId], (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 질문 항목 추가
app.post('/api/questions', (req, res) => {
    const { test_id, question_text, question_order, option_a, option_b, score_a, score_b } = req.body;
    if (!test_id || !question_text || question_order === undefined) {
        return res.status(400).json({ message: 'Missing required question fields' });
    }

    const sql = `INSERT INTO questions (test_id, question_text, question_order, option_a, option_b, score_a, score_b) VALUES (?, ?, ?, ?, ?, ?, ?)`; 
    db.query(sql, [test_id, question_text, question_order, option_a, option_b, score_a, score_b], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Question Added', id: result.insertId });
    });
});

// 질문 항목 삭제
app.delete('/api/questions/:id', (req, res) => {
    db.query('DELETE FROM questions WHERE id=?', [req.params.id], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Question Deleted' });
    });
});

// 특정 테스트의 결과 유형 목록 조회
app.get('/api/results/:testId', (req, res) => {
    const sql = 'SELECT * FROM results WHERE test_id = ?';
    db.query(sql, [req.params.testId], (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 결과 유형 추가
app.post('/api/results', (req, res) => {
    const { test_id, result_title, result_desc, min_score, max_score } = req.body;
    const sql = 'INSERT INTO results (test_id, result_title, result_desc, min_score, max_score) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [test_id, result_title, result_desc, min_score, max_score], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Result Added', id: result.insertId });
    });
});

// 결과 유형 삭제
app.delete('/api/results/:id', (req, res) => {
    db.query('DELETE FROM results WHERE id=?', [req.params.id], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Result Deleted' });
    });
});

// 테스트 완료 결과 저장
app.post('/api/test/submit', isAuthenticated, (req, res) => {
    const userId = req.session.user.id; 
    const { test_id, score, result_id, result } = req.body;
    
    if (!test_id) return res.status(400).json({ message: '테스트 ID는 필수 항목입니다.' });

    const resultText = result ? result : null;
    const finalScore = score !== undefined ? score : 0;
    const sql = `INSERT INTO test_history (user_id, test_id, score, result_id, result_title, completed_at) VALUES (?, ?, ?, ?, ?, NOW())`;
    
    db.query(sql, [userId, test_id, finalScore, result_id || null, resultText], (err, dbResult) => {
        if (err) return res.status(500).json({ message: '결과 저장 중 서버 오류 발생' });
        res.json({ message: '성공적으로 기록되었습니다.', historyId: dbResult.insertId });
    });
});

// --- 5-5. 마이페이지 API ---

// 사용자 통계 정보 조회
app.get('/api/mypage/stats', isAuthenticated, (req, res) => {
    const userId = req.session.user.id;
    const nickname = req.session.user.nickname;
    
    const likesSql = 'SELECT COUNT(*) AS like_count FROM likes WHERE user_id = ?';
    db.query(likesSql, [userId], (err, likesResult) => {
        if (err) return res.status(500).json({ message: '서버 에러' });

        const historySql = 'SELECT COUNT(*) AS history_count FROM test_history WHERE user_id = ?';
        db.query(historySql, [userId], (err, historyResult) => {
            if (err) return res.status(500).json({ message: '서버 에러' });
            res.json({ nickname, likeCount: likesResult[0].like_count, historyCount: historyResult[0].history_count });
        });
    });
});

// 사용자가 좋아요 한 테스트 목록 조회
app.get('/api/mypage/liked', isAuthenticated, (req, res) => {
    const userId = req.session.user.id;
    const sql = `SELECT t.id, t.title, t.thumbnail, t.category FROM tests t JOIN likes l ON t.id = l.test_id WHERE l.user_id = ? ORDER BY l.created_at DESC`;
        
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ message: '서버 에러' });
        res.json(results);
    });
});

// 사용자의 테스트 참여 내역 조회
app.get('/api/mypage/history', isAuthenticated, (req, res) => {
    const userId = req.session.user.id;
    const sql = `
        SELECT h.id AS history_id, h.completed_at, t.id AS test_id, t.title, t.thumbnail, t.category, 
               COALESCE(r.result_title, h.result_title) AS result_title
        FROM test_history h JOIN tests t ON h.test_id = t.id LEFT JOIN results r ON h.result_id = r.id
        WHERE h.user_id = ? ORDER BY h.completed_at DESC`;
        
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ message: '서버 에러' });
        res.json(results);
    });
});

// 닉네임 변경 및 중복 확인
app.put('/api/mypage/nickname', isAuthenticated, (req, res) => {
    const userId = req.session.user.id;
    const { nickname } = req.body;

    if (!nickname) return res.status(400).json({ message: '닉네임을 입력해주세요.' });

    const checkSql = 'SELECT id FROM users WHERE nickname = ?';
    db.query(checkSql, [nickname], (err, rows) => {
        if (err) return res.status(500).json({ message: 'DB 오류' });
        if (rows.length > 0) return res.status(409).json({ message: '이미 사용 중인 닉네임입니다.' });

        const updateSql = 'UPDATE users SET nickname = ? WHERE id = ?';
        db.query(updateSql, [nickname, userId], (err, result) => {
            if (err) return res.status(500).json({ message: '변경 실패' });
            req.session.user.nickname = nickname;
            req.session.save(() => { res.json({ message: '닉네임 변경 성공' }); });
        });
    });
});

// 현재 비밀번호 확인 후 새 비밀번호로 변경
app.put('/api/mypage/password', isAuthenticated, (req, res) => {
    const userId = req.session.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) return res.status(400).json({ message: '모든 항목을 입력해주세요.' });

    db.query('SELECT password FROM users WHERE id = ?', [userId], async (err, results) => {
        if (err) return res.status(500).json({ message: '서버 에러' });
        
        const user = results[0];
        const match = await bcrypt.compare(currentPassword, user.password);

        if (!match) return res.status(401).json({ message: '현재 비밀번호가 틀렸습니다.' });

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        db.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId], (updateErr) => {
            if (updateErr) return res.status(500).json({ message: '비밀번호 변경 실패' });
            res.json({ message: '비밀번호 변경 성공' });
        });
    });
});


// --- 5.6 좋아요 기능 (상태 조회 및 토글) ---

// 특정 테스트에 대한 현재 사용자의 좋아요 상태 확인
app.get('/api/tests/:id/like/status', (req, res) => {
    if (!req.session.user) return res.json({ liked: false });

    const userId = req.session.user.id;
    const testId = req.params.id;
    const sql = 'SELECT * FROM likes WHERE user_id = ? AND test_id = ?';

    db.query(sql, [userId, testId], (err, results) => {
        if (err) return res.status(500).send('DB Error');
        res.json({ liked: results.length > 0 });
    });
});

// 좋아요 추가 또는 취소 처리 (토글 방식)
app.post('/api/tests/:id/like', (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: '로그인이 필요합니다.' });
    
    const userId = req.session.user.id;
    const testId = req.params.id;
    const checkSql = 'SELECT * FROM likes WHERE user_id = ? AND test_id = ?';

    db.query(checkSql, [userId, testId], (err, results) => {
        if (err) return res.status(500).json({ message: 'DB Error' });

        if (results.length > 0) {
            const deleteSql = 'DELETE FROM likes WHERE user_id = ? AND test_id = ?';
            db.query(deleteSql, [userId, testId], () => res.json({ liked: false, message: '좋아요 취소' }));
        } else {
            const insertSql = 'INSERT INTO likes (user_id, test_id) VALUES (?, ?)';
            db.query(insertSql, [userId, testId], () => res.json({ liked: true, message: '좋아요 성공' }));
        }
    });
});


/* =========================================================
   [6] 페이지 라우팅 및 서버 실행
========================================================= */
// 기본 메인 페이지 제공
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

// 포트폴리오 정적 파일 서빙
app.use('/Portfolio', express.static(path.join(__dirname, 'Portfolio')));

// 지정된 포트에서 서버 대기 시작
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});