import express from 'express';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import * as yaml from 'js-yaml';

const require = createRequire(import.meta.url);
const { registerLocalFs } = require('decap-server/dist/middlewares');
export const ADMIN_PATH = '/admin123';
const COOKIE = 'rcbs_admin';
const hash = value => createHash('sha256').update(value).digest('hex');
const safeEqual = (a, b) => timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
const escape = value => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export async function createApp({ root, username, password, origin, now = Date.now, loginLimit = 5, sessionLifetime = 30 * 60_000 }) {
  if (!username || !password || password.length < 20 || /^(change|replace|example)/i.test(password)) throw new Error('Set a unique ADMIN_USERNAME and ADMIN_PASSWORD of at least 20 characters.');
  const url = new URL(origin);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) throw new Error('SITE_ORIGIN must use HTTPS outside localhost.');
  if (url.origin !== origin) throw new Error('SITE_ORIGIN must contain only the origin, without a trailing slash.');
  const secure = url.protocol === 'https:';
  const salt = randomBytes(32);
  const expected = scryptSync(password, salt, 64);
  const sessions = new Map();
  const attempts = new Map();
  const app = express();
  app.disable('x-powered-by');
  // Do not trust forwarded IP headers supplied by clients. A reverse proxy shares its limit.
  app.set('trust proxy', false);
  app.use((_req, res, next) => {
    res.set({'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'same-origin', 'X-Frame-Options':'DENY'});
    if (secure) res.set('Strict-Transport-Security', 'max-age=31536000');
    next();
  });
  const cookie = token => `${COOKIE}=${token}; Path=${ADMIN_PATH}; HttpOnly; SameSite=Strict${secure ? '; Secure' : ''}; Max-Age=${Math.floor(sessionLifetime / 1000)}`;
  function session(req) {
    const token = req.headers.cookie?.split(';').map(x => x.trim()).find(x => x.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
    const key = hash(token), data = sessions.get(key);
    if (!data || data.expires <= now()) { sessions.delete(key); return null; }
    return {key, ...data};
  }
  function prune() {
    for (const [key, data] of sessions) if (data.expires <= now()) sessions.delete(key);
    for (const [key, data] of attempts) if (data.until <= now()) attempts.delete(key);
  }
  function sameOrigin(req, res, next) {
    if (req.get('origin') !== origin) return res.status(403).json({error:'Request origin rejected.'});
    next();
  }
  function requireSession(req, res, next) {
    if (session(req)) return next();
    if (req.method === 'GET' && !req.path.includes('/api/')) return res.redirect(`${ADMIN_PATH}/login`);
    return res.status(401).json({error:'Authentication required.'});
  }
  function loginPage(message = '') {
    return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Yönetici girişi | Business Society</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#181818;color:white;font:18px Arial,sans-serif}main{width:min(360px,85vw)}h1{font:32px Georgia,serif}label{display:block;margin:22px 0 8px}input,button{box-sizing:border-box;width:100%;padding:13px;font:inherit;border:1px solid #555;border-radius:3px}input{background:#242424;color:white}button{margin-top:24px;cursor:pointer;background:white;color:#181818}a{color:#ddd}p{line-height:1.5}.error{color:#ff9ca3}</style></head><body><main><h1>Business Society</h1><p>İçerik yönetimi</p>${message ? `<p class="error" role="alert">${escape(message)}</p>` : ''}<form action="${ADMIN_PATH}/login" method="post"><label for="username">Kullanıcı adı</label><input id="username" name="username" autocomplete="username" required maxlength="200"><label for="password">Şifre</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="1024"><button type="submit">Giriş yap</button></form><p><a href="/">Siteye dön</a></p></main></body></html>`;
  }
  app.use(ADMIN_PATH, (_req, res, next) => {
    res.set({'Cache-Control':'no-store', 'X-Robots-Tag':'noindex, nofollow'});
    next();
  });
  app.get(`${ADMIN_PATH}/login`, (req, res) => {
    if (session(req)) return res.redirect(ADMIN_PATH + '/');
    res.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
    res.type('html').send(loginPage());
  });
  app.post(`${ADMIN_PATH}/login`, sameOrigin, express.urlencoded({extended:false, limit:'4kb'}), (req, res) => {
    prune();
    const key = req.socket.remoteAddress ?? 'unknown';
    const attempt = attempts.get(key);
    if (attempt && attempt.count >= loginLimit && attempt.until > now()) return res.status(429).type('html').send(loginPage('Çok fazla deneme. 15 dakika sonra tekrar deneyin.'));
    if (attempts.size >= 1000 && !attempts.has(key)) return res.sendStatus(429);
    const user = typeof req.body.username === 'string' ? req.body.username : '';
    const supplied = typeof req.body.password === 'string' ? req.body.password : '';
    const valid = timingSafeEqual(scryptSync(supplied, salt, 64), expected) && safeEqual(user, username);
    if (!valid) {
      attempts.set(key, {count:(attempt?.count ?? 0) + 1, until:attempt?.until ?? now() + 15 * 60_000});
      return res.status(401).type('html').send(loginPage('Kullanıcı adı veya şifre yanlış.'));
    }
    attempts.delete(key);
    const previous = session(req); if (previous) sessions.delete(previous.key);
    if (sessions.size >= 100) sessions.delete(sessions.keys().next().value);
    const token = randomBytes(32).toString('hex');
    sessions.set(hash(token), {expires:now() + sessionLifetime});
    res.set('Set-Cookie', cookie(token));
    res.redirect(303, ADMIN_PATH + '/');
  });
  app.post(`${ADMIN_PATH}/logout`, sameOrigin, requireSession, (req, res) => {
    sessions.delete(session(req).key);
    res.set('Set-Cookie', `${COOKIE}=; Path=${ADMIN_PATH}; HttpOnly; SameSite=Strict${secure ? '; Secure' : ''}; Max-Age=0`);
    res.redirect(303, ADMIN_PATH + '/login');
  });
  app.use(ADMIN_PATH, requireSession);
  app.get([ADMIN_PATH, ADMIN_PATH + '/'], (_req, res) => res.sendFile(path.join(root, 'server/admin.html')));
  const config = yaml.load(fs.readFileSync(path.join(root,'server/cms.yml'),'utf8'));
  const dataFiles = new Set(config.collections.flatMap(c => (c.files ?? []).map(f => f.file)));
  const contentFolders = config.collections.map(c => c.folder).filter(Boolean);
  const mediaTypes = new Set(['.jpg','.jpeg','.png','.webp','.gif','.avif','.heic','.pdf']);
  function containsSymlink(directory, depth = 0) {
    if (!fs.existsSync(directory)) return false;
    if (depth > 4) return true;
    return fs.readdirSync(directory, {withFileTypes:true}).some(entry =>
      entry.isSymbolicLink() || (entry.isDirectory() && containsSymlink(path.join(directory, entry.name), depth + 1)));
  }
  function permitted(file, folder = false) {
    if (typeof file !== 'string' || file.includes('\\') || file.includes('\0') || file.startsWith('/') || file.split('/').some(p => !p || p === '.' || p === '..')) return false;
    const allowed = folder
      ? file === 'public/uploads' || contentFolders.includes(file)
      : dataFiles.has(file) || contentFolders.some(f => file.startsWith(f + '/') && file.endsWith('.md')) || (file.startsWith('public/uploads/') && mediaTypes.has(path.extname(file).toLowerCase()));
    if (!allowed) return false;
    let current = root;
    for (const piece of file.split('/')) {
      current = path.join(current, piece);
      if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) return false;
    }
    if (folder && containsSymlink(current)) return false;
    return true;
  }
  app.get(`${ADMIN_PATH}/config.yml`, (_req, res) => {
    const output = {...config, backend:{name:'proxy', proxy_url:origin + ADMIN_PATH + '/api/v1'}, local_backend:false};
    res.type('text/yaml').send(yaml.dump(output));
  });
  const actions = new Set(['info','entriesByFolder','entriesByFiles','getEntry','persistEntry','getMedia','getMediaFile','persistMedia','deleteFile','deleteFiles','getDeployPreview']);
  app.use(`${ADMIN_PATH}/api`, sameOrigin, express.json({limit:'16mb'}), (req, res, next) => {
    if (!actions.has(req.body?.action)) return res.status(422).json({error:'Unsupported content action.'});
    function valid(value) {
      if (!value || typeof value !== 'object') return true;
      for (const [key, field] of Object.entries(value)) {
        if (['path','newPath','folder','mediaFolder'].includes(key) && !permitted(field, ['folder','mediaFolder'].includes(key))) return false;
        if (key === 'paths' && (!Array.isArray(field) || !field.every(p => permitted(p)))) return false;
        if (key === 'depth' && (!Number.isInteger(field) || field < 1 || field > 3)) return false;
        if (field && typeof field === 'object' && !valid(field)) return false;
      }
      return true;
    }
    if (!valid(req.body.params)) return res.status(403).json({error:'File access outside editable content rejected.'});
    next();
  });
  process.env.GIT_REPO_DIRECTORY = root;
  const api = express();
  await registerLocalFs(api, {logger:{debug(){}, info(){}, error(){ console.error('Content operation failed.'); }}});
  app.use(ADMIN_PATH, api);
  // Block old editor files even if an earlier build left them in dist.
  app.use('/admin', (_req, res) => res.sendStatus(404));
  app.use((req, res, next) => {
    if (req.path.startsWith('/uploads/') && !mediaTypes.has(path.extname(req.path).toLowerCase())) return res.sendStatus(404);
    next();
  });
  app.use(express.static(path.join(root,'dist'), {dotfiles:'deny', index:'index.html'}));
  app.use((_req, res) => res.sendStatus(404));
  app.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.status === 413 ? 413 : error.status === 400 ? 400 : 500;
    res.status(status).json({error:status === 413 ? 'Request too large.' : 'Request failed.'});
  });
  return app;
}
