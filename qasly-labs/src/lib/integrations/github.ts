import fetch from 'node-fetch';

export async function createGithubIssue({
  repo,
  title,
  body,
  token
}: {
  repo: string; // e.g. "owner/repo"
  title: string;
  body: string;
  token: string;
}): Promise<{ url?: string; error?: string }> {
  const apiUrl = `https://api.github.com/repos/${repo}/issues`;
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'QaslyLabsBot'
    },
    body: JSON.stringify({ title, body })
  });
  if (!res.ok) {
    const error = await res.text();
    return { error };
  }
  const data = await res.json();
  return { url: data.html_url };
}
