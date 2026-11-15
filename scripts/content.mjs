import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const ignored = new Set(['node_modules', 'dist', '.vercel', '.git', 'src', 'public', 'scripts', 'tests', 'notes', 'papers']);
const privateFiles = new Set(['PERSONAL_PATH.md', 'PROGRESS.md', 'APP.md']);
export function cleanMarkdown(text) {
  return text.replace(/```[\s\S]*?```/g, ' ').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[#*_`>|]/g, ' ').replace(/\s+/g, ' ').trim();
}
export function documentRoute(id, anchor = '') {
  return `/read/${id}${anchor ? `#${anchor}` : ''}`;
}
export function linkTarget(fromId, href, ids) {
  if (/^(https?:|mailto:)/.test(href)) return { kind: 'external', href };
  if (href.startsWith('#')) return { kind: 'anchor', href };
  const [rawPath, anchor = ''] = href.split('#');
  const decoded = decodeURIComponent(rawPath);
  const target = path.posix.normalize(path.posix.join(path.posix.dirname(fromId), decoded));
  if (target.startsWith('notes/') || decoded.startsWith('notes/') || decoded.includes('/notes/')) return { kind: 'notes', href: '/notes' };
  if (target === 'PERSONAL_PATH.md' || decoded.endsWith('PERSONAL_PATH.md')) return { kind: 'path', href: '/path' };
  if (target === 'PROGRESS.md' || decoded.endsWith('PROGRESS.md')) return { kind: 'progress', href: '/' };
  if (ids.has(target)) return { kind: 'document', href: documentRoute(target, anchor) };
  const codeMatch = target.match(/(?:^|\/)sympleq\/sympleq-rust\/(.+)$/);
  if (codeMatch) return { kind: 'external', href: `https://github.com/ricott1/sympleq-rust/blob/main/${codeMatch[1]}${anchor ? `#${anchor}` : ''}` };
  return { kind: 'unavailable', href, label: rawPath };
}
async function walk(dir = root) {
  let result = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && !ignored.has(entry.name)) result.push(...await walk(path.join(dir, entry.name)));
    else if (entry.isFile() && entry.name.endsWith('.md') && !privateFiles.has(entry.name)) result.push(path.join(dir, entry.name));
  }
  return result;
}
export async function generateContent() {
  const paths = (await walk()).sort();
  const ids = new Set(paths.map(file => path.relative(root, file).replaceAll('\\', '/')));
  const documents = await Promise.all(paths.map(async file => {
    const id = path.relative(root, file).replaceAll('\\', '/');
    const body = await fs.readFile(file, 'utf8');
    const title = body.match(/^#\s+(.+)$/m)?.[1] || path.basename(file, '.md');
    const text = cleanMarkdown(body);
    const session = id.match(/^sessions\/(\d+)-/);
    const kind = id.endsWith('/theory.md') ? 'theory' : id.endsWith('/exercises.md') ? 'exercises' : id.endsWith('/code-tour.md') ? 'code' : id.startsWith('templates/') ? 'template' : 'guide';
    const links = Object.fromEntries([...body.matchAll(/\]\(([^)]+)\)/g)].map(match => [match[1], linkTarget(id, match[1], ids)]));
    return { id, title, body, text, kind, session: session ? Number(session[1]) : null, minutes: Math.max(2, Math.ceil(text.split(/\s+/).length / 180)), links };
  }));
  await fs.mkdir(path.join(root, 'src/generated'), { recursive: true });
  await fs.writeFile(path.join(root, 'src/generated/content.json'), JSON.stringify({ documents }, null, 2));
  console.log(`Prepared ${documents.length} study pages. Personal notes and path files stay local.`);
  return documents;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await generateContent();