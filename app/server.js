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

app.get('/api/admin/pages', requireAuth, async (req, res) => {
  try {
    const pages = await db.getAllPages();
    res.json({ pages });
  } catch (err) {
    res.status(500).json({ error: '페이지 목록 불러오기 실패' });
  }
});

app.get('/api/admin/current-page', requireAuth, async (req, res) => {
  try {
    const targetPath = req.query.path || '/';
    const page = await db.getLatestPage(targetPath);
    res.json({ page });
  } catch (err) {
    res.status(500).json({ error: '페이지 불러오기 실패' });
  }
});

app.post('/api/admin/pages', requireAuth, async (req, res) => {
  try {
    const { pageName, pagePath, templateType } = req.body;
    if (!pageName || !pagePath) {
      return res.status(400).json({ error: '페이지 이름과 경로(URL)를 입력해주세요.' });
    }
    const result = await db.createSubPage({ pageName, pagePath, templateType });
    res.json({ success: true, page: result });
  } catch (err) {
    res.status(400).json({ error: err.message || '페이지 생성 실패' });
  }
});

app.put('/api/admin/pages', requireAuth, async (req, res) => {
  try {
    const { oldPath, newPath, pageName } = req.body;
    if (!oldPath || !newPath || !pageName) {
      return res.status(400).json({ error: '잘못된 요청입니다.' });
    }
    await db.updatePageSettings({ oldPath, newPath, pageName });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message || '페이지 설정 변경 실패' });
  }
});

app.delete('/api/admin/pages', requireAuth, async (req, res) => {
  try {
    const { pagePath } = req.body;
    if (!pagePath || pagePath === '/') {
      return res.status(400).json({ error: '메인 페이지는 삭제할 수 없습니다.' });
    }
    await db.deletePage(pagePath);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message || '페이지 삭제 실패' });
  }
});

app.post('/api/admin/save', requireAuth, async (req, res) => {
  try {
    const { html, css, componentsJson, seoTitle, seoDescription, faviconUrl, versionName, pagePath, pageName } = req.body;
    const result = await db.savePageDraft({
      html,
      css,
      componentsJson,
      seoTitle,
      seoDescription,
      faviconUrl,
      versionName,
      pagePath: pagePath || '/',
      pageName: pageName || '메인 페이지'
    });
    res.json({ success: true, id: result.id, pagePath: result.pagePath });
  } catch (err) {
    res.status(500).json({ error: '저장 실패' });
  }
});

app.post('/api/admin/publish', requireAuth, async (req, res) => {
  try {
    const { id } = req.body;
    const result = await db.publishPage(id);
    res.json({ success: true, pagePath: result.pagePath });
  } catch (err) {
    res.status(500).json({ error: '배포 실패' });
  }
});

app.get('/api/admin/versions', requireAuth, async (req, res) => {
  try {
    const targetPath = req.query.path || '/';
    const versions = await db.getAllVersions(targetPath);
    res.json({ versions });
  } catch (err) {
    res.status(500).json({ error: '버전 목록 불러오기 실패' });
  }
});

app.post('/api/admin/rollback/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.publishPage(id);
    res.json({ success: true, pagePath: result.pagePath });
  } catch (err) {
    res.status(500).json({ error: '롤백 실패' });
  }
});

app.post('/api/admin/reset-template', requireAuth, async (req, res) => {
  try {
    const targetPath = req.body.pagePath || '/';
    if (targetPath === '/') {
      await db.getRichTemplateData();
    }
    const page = await db.getLatestPage(targetPath);
    res.json({ success: true, page });
  } catch (err) {
    res.status(500).json({ error: '템플릿 적용 실패' });
  }
});

// ── Admin Article Management & Tiptap CMS Routes ─────────────────

// Image upload config for article inline images & thumbnails
const multer = require('multer');
const articleStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'public/uploads/articles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, 'article-' + uniqueSuffix + ext);
  }
});
const uploadArticleImage = multer({
  storage: articleStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드할 수 있습니다.'));
    }
  }
});

app.post('/api/admin/upload-image', requireAuth, uploadArticleImage.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '이미지 파일이 전송되지 않았습니다.' });
  }
  const imageUrl = `/uploads/articles/${req.file.filename}`;
  res.json({ success: true, url: imageUrl });
});

// Admin Article Pages
app.get('/admin/articles', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'views/admin-articles.html'));
});

app.get('/admin/articles/new', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'views/admin-article-editor.html'));
});

app.get('/admin/articles/:id/edit', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'views/admin-article-editor.html'));
});

// Admin Article REST APIs
app.get('/api/admin/articles', requireAuth, async (req, res) => {
  try {
    const { status, tag } = req.query;
    const articles = await db.getAllArticles({ status, tag });
    res.json({ articles });
  } catch (err) {
    console.error('API get articles error:', err);
    res.status(500).json({ error: '아티클 목록 조회 실패' });
  }
});

app.get('/api/admin/articles/:id', requireAuth, async (req, res) => {
  try {
    const article = await db.getArticleById(req.params.id);
    if (!article) return res.status(404).json({ error: '아티클을 찾을 수 없습니다.' });
    res.json({ article });
  } catch (err) {
    res.status(500).json({ error: '아티클 조회 실패' });
  }
});

app.post('/api/admin/articles', requireAuth, async (req, res) => {
  try {
    const { slug, title, subtitle, thumbnail_url, author, content, content_html, tags, status, published_at } = req.body;
    if (!title || !slug) {
      return res.status(400).json({ error: '제목과 슬러그(URL 주소)는 필수입니다.' });
    }
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const existing = await db.getArticleBySlug(cleanSlug);
    if (existing) {
      return res.status(400).json({ error: '이미 사용 중인 슬러그(URL)입니다.' });
    }
    const result = await db.createArticle({
      slug: cleanSlug,
      title,
      subtitle,
      thumbnail_url,
      author,
      content,
      content_html,
      tags,
      status: status || 'draft',
      published_at: published_at || null
    });
    res.json({ success: true, id: result.id, slug: cleanSlug });
  } catch (err) {
    console.error('Create article error:', err);
    res.status(500).json({ error: '아티클 생성 실패' });
  }
});

app.put('/api/admin/articles/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { slug, title, subtitle, thumbnail_url, author, content, content_html, tags, status, published_at } = req.body;
    if (!title || !slug) {
      return res.status(400).json({ error: '제목과 슬러그는 필수입니다.' });
    }
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const existing = await db.getArticleBySlug(cleanSlug);
    if (existing && existing.id !== parseInt(id, 10)) {
      return res.status(400).json({ error: '다른 아티클에서 이미 사용 중인 슬러그입니다.' });
    }
    await db.updateArticle(id, {
      slug: cleanSlug,
      title,
      subtitle,
      thumbnail_url,
      author,
      content,
      content_html,
      tags,
      status,
      published_at: published_at || null
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Update article error:', err);
    res.status(500).json({ error: '아티클 수정 실패' });
  }
});

app.post('/api/admin/articles/:id/toggle', requireAuth, async (req, res) => {
  try {
    const result = await db.toggleArticleStatus(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: '상태 변경 실패' });
  }
});

app.delete('/api/admin/articles/:id', requireAuth, async (req, res) => {
  try {
    await db.deleteArticle(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '아티클 삭제 실패' });
  }
});

// ==========================================
// 4. Public Recruitment & Article Routes
// ==========================================

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Public Articles API
app.get('/api/articles', async (req, res) => {
  try {
    const { tag } = req.query;
    const articles = await db.getAllArticles({ status: 'published', tag });
    res.json({ articles });
  } catch (err) {
    res.status(500).json({ error: '아티클 목록 조회 실패' });
  }
});

// Public Articles List Page
app.get('/articles', async (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'views/articles.html'));
  } catch (err) {
    res.status(500).send('서버 오류가 발생했습니다.');
  }
});

// Public Article Detail Page (with SEO metadata injection)
app.get('/articles/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const article = await db.getArticleBySlug(slug);

    if (!article || (article.status !== 'published' && (!req.session || !req.session.authenticated))) {
      return res.status(404).send('<h1>아티클을 찾을 수 없습니다.</h1><p><a href="/articles">아티클 목록으로 이동</a></p>');
    }

    const template = fs.readFileSync(path.join(__dirname, 'views/article-detail.html'), 'utf-8');
    const displayDate = article.published_at || article.created_at;
    const createdDate = new Date(displayDate).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '.').replace(/\.$/, '');

    const tagsHtml = (article.tags || []).map(t => `<span class="article-badge">${escapeHtml(t)}</span>`).join(' ');
    const subtitleHtml = article.subtitle ? `<p class="article-subtitle">${escapeHtml(article.subtitle)}</p>` : '';
    const heroThumbHtml = (article.thumbnail_url && !article.thumbnail_url.includes('daangn-service-logo'))
      ? `<div class="article-hero-thumb"><img src="${escapeHtml(article.thumbnail_url)}" alt="${escapeHtml(article.title)}" /></div>`
      : '';

    const rendered = template
      .replace(/<%= articleTitle %>/g, escapeHtml(article.title))
      .replace(/<%= articleSubtitle %>/g, escapeHtml(article.subtitle || ''))
      .replace(/<%- articleSubtitleHtml %>/g, subtitleHtml)
      .replace(/<%- articleHeroThumbHtml %>/g, heroThumbHtml)
      .replace(/<%= articleAuthor %>/g, escapeHtml(article.author || '당근서비스팀'))
      .replace(/<%= articleDate %>/g, createdDate)
      .replace(/<%= articleThumbnail %>/g, article.thumbnail_url || '/images/daangn-service-logo.png')
      .replace(/<%- articleTags %>/g, tagsHtml)
      .replace(/<%- articleContentHtml %>/g, article.content_html || '')
      .replace(/<%= articleSlug %>/g, escapeHtml(article.slug));

    res.send(rendered);
  } catch (err) {
    console.error('Article render error:', err);
    res.status(500).send('서버 오류가 발생했습니다.');
  }
});

async function renderPublicPage(req, res, pagePath = '/') {
  try {
    const publishedPage = await db.getPublishedPage(pagePath);
    if (!publishedPage) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="utf-8">
          <title>페이지를 찾을 수 없습니다 - 당근서비스</title>
          <link rel="icon" type="image/png" href="/images/favicon-192.png" />
          <link rel="stylesheet" href="/css/fonts.css" />
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 120px 24px; color: #212124;">
          <h1 style="font-size: 36px; font-weight: 800; margin-bottom: 12px;">페이지를 찾을 수 없습니다</h1>
          <p style="color: #868B94; font-size: 17px; margin-bottom: 32px;">요청하신 페이지가 아직 배포되지 않았거나 존재하지 않습니다.</p>
          <a href="/" style="display: inline-block; background-color: #FF6F0F; color: #ffffff; padding: 12px 28px; border-radius: 24px; text-decoration: none; font-weight: 700; font-size: 15px;">홈으로 이동하기 ➔</a>
        </body>
        </html>
      `);
    }

    const template = fs.readFileSync(path.join(__dirname, 'views/public.html'), 'utf-8');
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
}

app.get('/', (req, res) => renderPublicPage(req, res, '/'));
app.get('/apply', (req, res) => renderPublicPage(req, res, '/apply'));
app.get('/jobs', (req, res) => res.redirect('/apply'));
app.get('/teams/:slug', (req, res) => renderPublicPage(req, res, `/teams/${req.params.slug}`));

// Dynamic route for any other subpage (e.g. /teams/design, /culture 등)
app.get('*', async (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/admin') || req.path.startsWith('/articles') || req.path.startsWith('/images') || req.path.startsWith('/css') || req.path.startsWith('/js') || req.path.startsWith('/uploads')) {
    return next();
  }
  const publishedPage = await db.getPublishedPage(req.path);
  if (publishedPage) {
    return renderPublicPage(req, res, req.path);
  }
  next();
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Careers Web App running on http://localhost:${PORT}`);
  console.log(`📌 Public Page: http://localhost:${PORT}/`);
  console.log(`📌 Admin Page: http://localhost:${PORT}/admin`);
  console.log(`📌 Health Check: http://localhost:${PORT}/health`);
});
