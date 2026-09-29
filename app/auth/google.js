const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_ALLOWED_GROUP = process.env.GOOGLE_ALLOWED_GROUP || 'people_@daangnservice.com';
const GOOGLE_ADMIN_EMAIL = process.env.GOOGLE_ADMIN_EMAIL || 'laika@daangnservice.com';

function normalizePrivateKey(key) {
  if (!key) return undefined;
  return key.replace(/^"(.*)"$/, '$1').replace(/\\n/g, '\n').trim();
}

/**
 * 요청 기반 Redirect URI 생성
 */
function getRedirectUri(req) {
  if (process.env.GOOGLE_CALLBACK_URL) {
    return process.env.GOOGLE_CALLBACK_URL;
  }
  if (!req) return 'http://localhost:3000/auth/google/callback';
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  return `${proto}://${req.get('host')}/auth/google/callback`;
}

/**
 * Google OAuth2 Client 인스턴스 생성
 */
function getOAuth2Client(redirectUri) {
  const defaultCallback = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback';
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    redirectUri || defaultCallback
  );
}

/**
 * Google 로그인 페이지 URL 생성
 */
function getAuthUrl(redirectUri) {
  const oauth2Client = getOAuth2Client(redirectUri);
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'select_account',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'openid'
    ]
  });
}

/**
 * OAuth code를 통해 사용자 정보 조회
 */
async function getUserInfoFromCode(code, redirectUri) {
  const oauth2Client = getOAuth2Client(redirectUri);
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  return {
    id: data.id,
    email: data.email,
    name: data.name || data.email?.split('@')[0],
    picture: data.picture,
    hd: data.hd // Google Workspace 도메인 (예: daangnservice.com)
  };
}

/**
 * Google Directory API를 통해 사용자가 people_@daangnservice.com 그룹 구성원인지 검증
 */
async function checkGroupMembership(email) {
  if (!email) return { authorized: false, reason: '이메일 정보가 없습니다.' };

  const keyFilePath = path.join(process.cwd(), 'service-account.json');
  let authClient = null;

  // 1. service-account.json 파일 또는 환경변수로부터 서비스 계정 인증 생성
  if (fs.existsSync(keyFilePath)) {
    try {
      const keyData = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
      authClient = new google.auth.JWT({
        email: keyData.client_email,
        key: keyData.private_key,
        scopes: [
          'https://www.googleapis.com/auth/admin.directory.user.readonly',
          'https://www.googleapis.com/auth/admin.directory.group.readonly'
        ],
        subject: GOOGLE_ADMIN_EMAIL
      });
    } catch (err) {
      console.warn('[GoogleAuth] service-account.json 파싱 실패:', err.message);
    }
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    try {
      authClient = new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
        scopes: [
          'https://www.googleapis.com/auth/admin.directory.user.readonly',
          'https://www.googleapis.com/auth/admin.directory.group.readonly'
        ],
        subject: GOOGLE_ADMIN_EMAIL
      });
    } catch (err) {
      console.warn('[GoogleAuth] 환경변수 서비스 계정 인증 생성 실패:', err.message);
    }
  }

  // 서비스 계정 키가 없는 개발 환경이거나 설정 전인 경우 Fallback
  if (!authClient) {
    console.warn('[GoogleAuth] 서비스 계정 자격증명이 없습니다. 사내 도메인 체크로 대체합니다.');
    const isDomainMatch = email.toLowerCase().endsWith('@daangnservice.com');
    return {
      authorized: isDomainMatch,
      reason: isDomainMatch ? '도메인 일치 (Fallback)' : '당근서비스(@daangnservice.com) 계정만 접속 가능합니다.'
    };
  }

  try {
    const admin = google.admin({ version: 'directory_v1', auth: authClient });

    // 1. Super Admin 여부 확인
    try {
      const userRes = await admin.users.get({ userKey: email });
      if (userRes.data && userRes.data.isAdmin) {
        console.log(`[GoogleAuth] 관리자 확인 성공: ${email} -> Super Admin`);
        return { authorized: true, reason: 'Super Admin' };
      }
    } catch (userErr) {
      // 일반 유저는 users.get에서 403이 날 수도 있으므로 그룹 체크로 계속 진행
    }

    // 2. people_@daangnservice.com 그룹 멤버십 확인
    const groupKey = GOOGLE_ALLOWED_GROUP;
    const groupRes = await admin.members.hasMember({
      groupKey: groupKey,
      memberKey: email
    });

    if (groupRes.data && groupRes.data.isMember) {
      console.log(`[GoogleAuth] 그룹 확인 성공: ${email}는 ${groupKey} 그룹 구성원입니다.`);
      return { authorized: true, reason: `${groupKey} 멤버` };
    }

    console.warn(`[GoogleAuth] 접근 거부: ${email}는 ${groupKey} 그룹 구성원이 아닙니다.`);
    return {
      authorized: false,
      reason: `${groupKey} 그룹 구성원만 접근할 수 있습니다.`
    };
  } catch (apiError) {
    console.error(`[GoogleAuth] Google Directory API 호출 실패 (${email}):`, apiError.message);
    // API 에러 시 안전 장치: 회사 도메인이면 임시 허용 (로그 경고)
    if (email.toLowerCase().endsWith('@daangnservice.com')) {
      console.warn(`[GoogleAuth] API 호출 실패로 사내 도메인 확인 후 임시 허용: ${email}`);
      return { authorized: true, reason: '사내 도메인 임시 허용' };
    }
    return { authorized: false, reason: '그룹 권한 검증에 실패했습니다.' };
  }
}

module.exports = {
  getAuthUrl,
  getUserInfoFromCode,
  checkGroupMembership,
  getRedirectUri,
  GOOGLE_ALLOWED_GROUP
};
