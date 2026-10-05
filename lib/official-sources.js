const OFFICIAL_TARGET = 'cuhk-gastroenterology-2027';
const MAX_HTML_BYTES = 256 * 1024;
const CACHE_MS = 15 * 60 * 1000;
const PAGES = [
  { title: 'CUHK 胃肠病学硕士｜项目主页', url: 'https://www.idd.cuhk.edu.hk/mscgi/', kind: 'programme' },
  { title: 'CUHK 胃肠病学硕士｜申请说明', url: 'https://www.idd.cuhk.edu.hk/mscgi-application/', kind: 'application' },
  { title: 'CUHK 研究生院｜通用材料要求', url: 'https://www.gs.cuhk.edu.hk/admissions/documents-required', kind: 'general' }
];
let cache;

function permittedURL(candidate, page) {
  try {
    const url = new URL(candidate);
    const fixed = new URL(page.url);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && !url.search && !url.hash &&
      url.hostname === fixed.hostname && url.pathname.replace(/\/$/, '') === fixed.pathname.replace(/\/$/, '');
  } catch {
    return false;
  }
}

async function readHTML(page, signal) {
  let url = page.url;
  for (let redirects = 0; redirects <= 2; redirects++) {
    const response = await fetch(url, { method: 'GET', redirect: 'manual', signal, headers: { Accept: 'text/html' } });
    if (response.url && !permittedURL(response.url, page)) throw new Error('Unexpected official URL');
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location || redirects === 2) throw new Error('Official redirect failed');
      const next = new URL(location, url).href;
      if (!permittedURL(next, page)) throw new Error('Official redirect blocked');
      await response.body?.cancel();
      url = next;
      continue;
    }
    if (response.status !== 200 || !/^text\/html(?:\s*;|$)/i.test(response.headers.get('content-type') || '') ||
        Number(response.headers.get('content-length')) > MAX_HTML_BYTES || !response.body) {
      throw new Error('Official HTML unavailable');
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let bytes = 0;
    let html = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > MAX_HTML_BYTES) {
          await reader.cancel();
          throw new Error('Official HTML too large');
        }
        html += decoder.decode(value, { stream: true });
      }
      html += decoder.decode();
    } finally {
      reader.releaseLock();
    }
    if (!/<!doctype\s+html(?:\s[^>]*)?>/i.test(html)) throw new Error('Official HTML incomplete');
    return html;
  }
}

function bodyText(html) {
  const cleaned = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  const body = cleaned.match(/<body\b[^>]*>([\s\S]*)<\/body\s*>/i)?.[1];
  if (!body) throw new Error('Official body missing');
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—',
    hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };
  return body.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|nav|header|footer|aside)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(?:#(x[0-9a-f]+|\d+)|(amp|lt|gt|quot|apos|nbsp|ndash|mdash|hellip|rsquo|lsquo|rdquo|ldquo));/gi, (match, numeric, named) => {
      if (named) return entities[named.toLowerCase()];
      const point = numeric[0].toLowerCase() === 'x' ? parseInt(numeric.slice(1), 16) : Number(numeric);
      return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : match;
    }).replace(/\s+/g, ' ').trim();
}

function excerpts(page, text) {
  let parts;
  let year = null;
  if (page.kind === 'programme') {
    const intake = text.match(/Application\s+for\s+(20\d\d)\s+intake\s+is\s+now\s+open!?/i);
    const deadline = text.match(/Deadline:\s*\d{1,2}\s+[A-Za-z]+\s+(20\d\d)/i);
    if (!intake || !deadline) throw new Error('Programme intake not found');
    parts = [intake[0], deadline[0]];
    if (intake[1] !== '2027' || deadline[1] !== '2027') throw new Error('Programme intake year changed');
    year = 2027;
  } else if (page.kind === 'application') {
    const deadline = text.match(/Application\s+Deadline:\s*Full-time\s*(?:&|and)\s*Part-time:\s*\d{1,2}\s+[A-Za-z]+\s+(20\d\d)/i);
    const number = text.match(/Confidential\s+Recommendations\s+from\s+two\s+referees\s+respectively/i);
    const submission = text.match(/Confidential\s+Recommendations\s+must\s+reach\s+our\s+office[^.]{1,700}application\s+deadline\./i);
    if (!deadline || !number || !submission || !/sealed\s+envelopes/i.test(submission[0]) || !/two\s+weeks/i.test(submission[0])) {
      throw new Error('Programme recommendation terms not found');
    }
    parts = [deadline[0], number[0], submission[0]];
    if (deadline[1] !== '2027') throw new Error('Application year changed');
    year = 2027;
  } else {
    const number = text.match(/Other\s+programmes:\s*Two\s+referee\s+reports\s+are\s+required\./i);
    const submission = text.match(/Submit\s+referee\s+information\s+via\s+Online\s+Application\s+System\.?/i);
    if (!number || !submission) throw new Error('General recommendation terms not found');
    parts = [number[0], submission[0]];
  }
  return { text: parts.join('\n').slice(0, 1000), applicableYear: year };
}

async function getOfficialSources() {
  if (cache && cache.expires > Date.now()) return structuredClone(cache.result);
  const signal = AbortSignal.timeout(6000);
  const pages = await Promise.all(PAGES.map(async page => {
    const html = await readHTML(page, signal);
    const excerpt = excerpts(page, bodyText(html));
    return { title: page.title, url: page.url, retrievedAt: new Date(Date.now()).toISOString(), ...excerpt };
  }));
  const result = {
    sources: pages.map(({ text, ...source }) => source),
    evidence: pages.map(page => ({ ...page, scope: page.url.includes('www.gs.') ? '大学通用要求，未单列入学年度' : '该项目页面，年度只按本页正文标注' }))
  };
  cache = { expires: Date.now() + CACHE_MS, result };
  return structuredClone(result);
}

module.exports = { OFFICIAL_TARGET, getOfficialSources };
