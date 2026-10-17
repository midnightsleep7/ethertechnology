import fs from 'node:fs';

const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
if (!repository || !token || !process.env.GITHUB_OUTPUT) {
  throw new Error('Run this check from GitHub Actions.');
}
const response = await fetch(`https://api.github.com/repos/${repository}/pages`, {
  headers: {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28'
  }
});
if (!response.ok && ![403, 404].includes(response.status)) {
  throw new Error(`GitHub Pages status check failed: HTTP ${response.status}`);
}
const enabled = response.ok;
fs.appendFileSync(process.env.GITHUB_OUTPUT, `enabled=${enabled}\n`);
if (!enabled) {
  const message = 'Website checks passed. GitHub Pages is not enabled or is unavailable for this repository. In repository Settings → Pages, select GitHub Actions as the publishing source, then rerun this workflow. Private repository hosting requires a supported GitHub plan.';
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, message + '\n');
}
