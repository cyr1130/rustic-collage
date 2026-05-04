// Vercel Serverless Function — projects-data.json 을 GitHub에 커밋
// POST /api/save-projects
// Body: { password: string, projects: array }

const { Octokit } = require('@octokit/rest');

module.exports = async function handler(req, res) {
  // CORS preflight (필요 시)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = typeof req.body === 'string' ? safeJSON(req.body) : (req.body || {});
  const { password, projects } = body;

  // 비밀번호 검증
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'Server misconfigured: ADMIN_PASSWORD not set' });
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  // 데이터 검증
  if (!Array.isArray(projects)) {
    return res.status(400).json({ error: 'Invalid projects data' });
  }

  // GitHub 설정 — 환경변수 trim
  const owner = (process.env.GITHUB_REPO_OWNER || '').trim();
  const repo = (process.env.GITHUB_REPO_NAME || '').trim();
  const branch = (process.env.GITHUB_BRANCH || 'main').trim();
  const path = 'projects-data.json';
  const token = (process.env.GITHUB_TOKEN || '').trim();

  if (!owner || !repo || !token) {
    return res.status(500).json({
      error: 'Server misconfigured: GITHUB_REPO_OWNER / GITHUB_REPO_NAME / GITHUB_TOKEN required',
    });
  }
  const NAME_RE = /^[\w.\-]+$/;
  if (!NAME_RE.test(owner)) {
    return res.status(500).json({ error: `Invalid GITHUB_REPO_OWNER: "${owner}"` });
  }
  if (!NAME_RE.test(repo)) {
    return res.status(500).json({ error: `Invalid GITHUB_REPO_NAME: "${repo}"` });
  }

  const octokit = new Octokit({ auth: token });

  try {
    // 기존 파일의 SHA 가져오기 (업데이트 시 필요)
    let sha;
    try {
      const { data: existing } = await octokit.repos.getContent({ owner, repo, path, ref: branch });
      sha = existing.sha;
    } catch (e) {
      if (e.status && e.status !== 404) throw e;
      // 파일이 아직 없으면 새로 생성
    }

    const newContent = JSON.stringify({ projects }, null, 2) + '\n';
    const encoded = Buffer.from(newContent, 'utf-8').toString('base64');

    const result = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      branch,
      message: 'chore(content): update projects via admin (' + new Date().toISOString() + ')',
      content: encoded,
      sha,
    });

    return res.status(200).json({
      ok: true,
      commit: result.data.commit && result.data.commit.sha,
    });
  } catch (err) {
    console.error('GitHub commit failed:', err);
    return res.status(500).json({ error: err.message || 'Failed to commit to GitHub' });
  }
};

function safeJSON(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
