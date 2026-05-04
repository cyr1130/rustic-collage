// Vercel Serverless Function — site-config.json 을 GitHub에 커밋
// POST /api/save-site-config
// Body: { password: string, config: object }

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

  const body = typeof req.body === 'string' ? safeJSON(req.body) : (req.body || {});
  const { password, config } = body;

  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'Server misconfigured: ADMIN_PASSWORD not set' });
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  if (!config || typeof config !== 'object') {
    return res.status(400).json({ error: 'Invalid config data' });
  }

  const owner = (process.env.GITHUB_REPO_OWNER || '').trim();
  const repo = (process.env.GITHUB_REPO_NAME || '').trim();
  const branch = (process.env.GITHUB_BRANCH || 'main').trim();
  const path = 'site-config.json';
  const token = (process.env.GITHUB_TOKEN || '').trim();

  if (!owner || !repo || !token) {
    return res.status(500).json({
      error: 'Server misconfigured: GITHUB_REPO_OWNER / GITHUB_REPO_NAME / GITHUB_TOKEN required',
    });
  }
  const NAME_RE = /^[\w.\-]+$/;
  if (!NAME_RE.test(owner)) return res.status(500).json({ error: `Invalid GITHUB_REPO_OWNER: "${owner}"` });
  if (!NAME_RE.test(repo)) return res.status(500).json({ error: `Invalid GITHUB_REPO_NAME: "${repo}"` });

  const octokit = new Octokit({ auth: token });

  try {
    let sha;
    try {
      const { data: existing } = await octokit.repos.getContent({ owner, repo, path, ref: branch });
      sha = existing.sha;
    } catch (e) {
      if (e.status && e.status !== 404) throw e;
    }

    const newContent = JSON.stringify(config, null, 2) + '\n';
    const encoded = Buffer.from(newContent, 'utf-8').toString('base64');

    const result = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      branch,
      message: 'chore(content): update site-config via admin (' + new Date().toISOString() + ')',
      content: encoded,
      sha,
    });

    return res.status(200).json({
      ok: true,
      commit: result.data.commit && result.data.commit.sha,
    });
  } catch (err) {
    console.error('Site config commit failed:', {
      message: err.message,
      status: err.status,
      response: err.response && err.response.data,
    });
    return res.status(500).json({
      error: err.message || 'Failed to commit to GitHub',
      status: err.status || null,
      detail: err.response && err.response.data && err.response.data.message,
    });
  }
};

function safeJSON(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
