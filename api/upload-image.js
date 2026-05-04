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

  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const token = process.env.GITHUB_TOKEN;

  if (!owner || !repo || !token) {
    return res.status(500).json({
      error: 'Server misconfigured: GITHUB_REPO_OWNER / GITHUB_REPO_NAME / GITHUB_TOKEN required',
    });
  }

  // 파일명 sanitize: 영숫자, 점, 하이픈, 언더스코어만 허용. 길이 제한.
  const baseName = String(filename)
    .replace(/[^\w.\-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(-80);
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
    console.error('Image upload failed:', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
};

function safeJSON(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
