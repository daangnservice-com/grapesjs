require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const db = require('./database');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'daangn-careers-secret';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'daangn1234!';

// Body parser & session middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Serve static assets from app/public
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database
db.initDb()
  .then(() => console.log('✅ SQLite Database initialized successfully.'))
  .catch((err) => console.error('❌ Database init error:', err));

app.get('/favicon.ico', (req, res) => res.sendFile(path.join(__dirname, 'public/images/favicon-192.png')));

// ==========================================
// 1. Health Check Endpoint (ALB Health Check)
// ==========================================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// 2. Authentication Routes
// ==========================================
app.get('/login', (req, res) => {
  if (req.session && req.session.authenticated) {
    return res.redirect('/admin');
  }
  res.sendFile(path.join(__dirname, 'views/login.html'));
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
    req.session.authenticated = true;
    req.session.username = username;
    return res.json({ success: true });
  }
  res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// ==========================================
// 3. Admin Protected Routes
// ==========================================
app.get('/admin', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'views/admin.html'));
});

app.get('/api/admin/current-page', requireAuth, async (req, res) => {
  try {
    const page = await db.getLatestPage();
    res.json({ page });
  } catch (err) {
    res.status(500).json({ error: '페이지 불러오기 실패' });
  }
});

app.post('/api/admin/save', requireAuth, async (req, res) => {
  try {
    const { html, css, componentsJson, seoTitle, seoDescription, faviconUrl, versionName } = req.body;
    const result = await db.savePageDraft({ html, css, componentsJson, seoTitle, seoDescription, faviconUrl, versionName });
    res.json({ success: true, id: result.id });
  } catch (err) {
    res.status(500).json({ error: '저장 실패' });
  }
});

app.post('/api/admin/publish', requireAuth, async (req, res) => {
  try {
    const { id } = req.body;
    await db.publishPage(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '배포 실패' });
  }
});

app.get('/api/admin/versions', requireAuth, async (req, res) => {
  try {
    const versions = await db.getAllVersions();
    res.json({ versions });
  } catch (err) {
    res.status(500).json({ error: '버전 목록 불러오기 실패' });
  }
});

app.post('/api/admin/rollback/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.publishPage(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '롤백 실패' });
  }
});

app.post('/api/admin/reset-template', requireAuth, async (req, res) => {
  try {
    await db.getRichTemplateData();
    const page = await db.getLatestPage();
    res.json({ success: true, page });
  } catch (err) {
    res.status(500).json({ error: '템플릿 적용 실패' });
  }
});

// ==========================================
// 4. Public Recruitment Page Route (careers.daangnservice.com/)
// ==========================================
app.get('/', async (req, res) => {
  try {
    const publishedPage = await db.getPublishedPage();
    const template = fs.readFileSync(path.join(__dirname, 'views/public.html'), 'utf-8');
    
    if (!publishedPage) {
      return res.send('<h1>페이지 준비 중입니다.</h1>');
    }

    const faviconUrl = publishedPage.favicon_url || '/images/favicon-192.png';
    const rendered = template
      .replace(/<%= seoTitle %>/g, publishedPage.seo_title || '당근서비스 채용')
      .replace(/<%= seoDescription %>/g, publishedPage.seo_description || '당근서비스에서 새로운 동료를 찾습니다.')
      .replace(/<%= faviconUrl %>/g, faviconUrl)
      .replace(/<%- pageCss %>/g, publishedPage.css || '')
      .replace(/<%- pageHtml %>/g, publishedPage.html || '');

    res.send(rendered);
  } catch (err) {
    console.error('Public page render error:', err);
    res.status(500).send('서버 오류가 발생했습니다.');
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Careers Web App running on http://localhost:${PORT}`);
  console.log(`📌 Public Page: http://localhost:${PORT}/`);
  console.log(`📌 Admin Page: http://localhost:${PORT}/admin`);
  console.log(`📌 Health Check: http://localhost:${PORT}/health`);
});
