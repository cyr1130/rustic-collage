// Vercel Serverless Function — 이미지를 GitHub repo의 images/projects/ 폴더에 커밋
// POST /api/upload-image
// Body: { password: string, filename: string, contentBase64: string }
// Returns: { ok: true, path: "./images/projects/<file>", url: "raw github url" }

const { Octokit } = require('@octokit/rest');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vercel 기본 body limit ~4.5MB. 이미지 압축은 클라이언트에서 처리됨.
  const body = typeof req.body === 'string' ? safeJSON(req.body) : (req.body || {});
  const { password, filename, contentBase64 } = body;

  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'Server misconfigured: ADMIN_PASSWORD not set' });
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  if (!filename || !contentBase64) {
    return res.status(400).json({ error: 'Missing filename or content' });
  }

  // 환경변수 trim — Vercel 입력 시 공백/줄바꿈 섞이는 사고 방지
  const owner = (process.env.GITHUB_REPO_OWNER || '').trim();
  const repo = (process.env.GITHUB_REPO_NAME || '').trim();
  const branch = (process.env.GITHUB_BRANCH || 'main').trim();
  const token = (process.env.GITHUB_TOKEN || '').trim();

  if (!owner || !repo || !token) {
    return res.status(500).json({
      error: 'Server misconfigured: GITHUB_REPO_OWNER / GITHUB_REPO_NAME / GITHUB_TOKEN required',
    });
  }

  // GitHub owner/repo 패턴 검증 (Octokit이 OpenAPI 스펙으로 같은 검사를 함)
  const NAME_RE = /^[\w.\-]+$/;
  if (!NAME_RE.test(owner)) {
    return res.status(500).json({ error: `Invalid GITHUB_REPO_OWNER: "${owner}" — 영문/숫자/점/하이픈/언더스코어만 허용됩니다.` });
  }
  if (!NAME_RE.test(repo)) {
    return res.status(500).json({ error: `Invalid GITHUB_REPO_NAME: "${repo}" — 영문/숫자/점/하이픈/언더스코어만 허용됩니다.` });
  }

  // 파일명 sanitize: 영숫자, 점, 하이픈, 언더스코어만 허용. 길이 제한.
  let baseName = String(filename)
    .replace(/[^\w.\-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(-80);
  if (!baseName || baseName === '_') baseName = 'upload.png';
  const timestamp = Date.now();
  const path = `images/projects/${timestamp}-${baseName}`;

  const octokit = new Octokit({ auth: token });

  try {
    const result = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      branch,
      message: `chore(media): upload ${baseName} via admin`,
      content: contentBase64, // base64 인코딩된 바이너리
    });

    return res.status(200).json({
      ok: true,
      path: `./${path}`,
      url: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`,
      commit: result.data.commit && result.data.commit.sha,
    });
  } catch (err) {
    console.error('Image upload failed:', {
      message: err.message,
      status: err.status,
      response: err.response && err.response.data,
      owner, repo, branch, path,
    });
    return res.status(500).json({
      error: err.message || 'Upload failed',
      status: err.status || null,
      detail: err.response && err.response.data && err.response.data.message,
      hint: err.message && err.message.includes('expected pattern')
        ? 'Vercel 환경변수 GITHUB_REPO_OWNER / GITHUB_REPO_NAME / GITHUB_TOKEN 에 공백·따옴표·줄바꿈이 섞여있는지 확인해 주세요. Vercel → Settings → Environment Variables에서 값을 다시 확인 후 Redeploy.'
        : undefined,
    });
  }
};

function safeJSON(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
