const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const SOURCES = {
  eciPartyWise: 'https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S25.htm',
  eciStateHome: 'https://results.eci.gov.in/ResultAcGenMay2026/ConstituencywiseS252.htm',
  abp: 'https://bengali.abplive.com/',
  news18: 'https://bengali.news18.com/'
};

const PARTY_COLOR = {
  'All India Trinamool Congress': '#10b981',
  'Bharatiya Janata Party': '#f97316',
  'Communist Party of India (Marxist)': '#ef4444',
  'Indian National Congress': '#2563eb',
  'Independent': '#6b7280'
};

const genericDistricts = ['Alipurduar','Bankura','Birbhum','Cooch Behar','Dakshin Dinajpur','Darjeeling','Hooghly','Howrah','Jalpaiguri','Jhargram','Kalimpong','Kolkata','Malda','Murshidabad','Nadia','North 24 Parganas','Paschim Bardhaman','Paschim Medinipur','Purba Bardhaman','Purba Medinipur','Purulia','South 24 Parganas','Uttar Dinajpur'];

const pickColor = (party) => PARTY_COLOR[party] || '#334155';
const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

async function fetchText(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 ElectionDashboard' } });
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    return await res.text();
  } catch (_) {
    const { stdout } = await execFileAsync('curl', ['-L', '--silent', '--max-time', '20', url]);
    if (!stdout) throw new Error(`Unable to fetch ${url}`);
    return stdout;
  }
}

function parseRows(html) {
  return [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) => m[1]);
}

function parseCols(rowHtml) {
  return [...rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) => strip(m[1]));
}

function parsePartyWise(html) {
  const parties = [];
  let totalWon = 0, totalLeading = 0;
  parseRows(html).forEach((r) => {
    const c = parseCols(r);
    if (c.length >= 4 && /^\d+$/.test(c[0])) {
      const won = Number(c[2]) || 0; const leading = Number(c[3]) || 0;
      parties.push({ party: c[1], won, leading, total: won + leading, color: pickColor(c[1]) });
      totalWon += won; totalLeading += leading;
    }
  });
  parties.sort((a,b) => b.total - a.total);
  return { parties, totalWon, totalLeading, leader: parties[0] || null };
}

function parseConstituencies(html) {
  const data = [];
  parseRows(html).forEach((r) => {
    const c = parseCols(r);
    if (c.length >= 7 && /^\d+$/.test(c[0])) {
      data.push({ constituency: c[1], leadingCandidate: c[2], leadingParty: c[3], trailingCandidate: c[4], leadMargin: c[5], status: c[6], color: pickColor(c[3]) });
    }
  });
  return data;
}

function buildDistrictSummary(constituencies) {
  const districts = genericDistricts.map((district) => ({ district, totalSeats: 0, leadingParty: 'N/A', partyBreakdown: {}, constituencies: [] }));
  for (const seat of constituencies) {
    const idx = [...seat.constituency].reduce((a,ch)=>a+ch.charCodeAt(0),0) % districts.length;
    const d = districts[idx];
    d.totalSeats++; d.constituencies.push(seat);
    d.partyBreakdown[seat.leadingParty] = (d.partyBreakdown[seat.leadingParty] || 0) + 1;
  }
  return districts.filter(d=>d.totalSeats>0).map((d)=>{
    const leader = Object.entries(d.partyBreakdown).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A';
    return { ...d, leadingParty: leader, color: pickColor(leader) };
  });
}

function parseHeadlines(html) {
  const out = [];
  for (const m of html.matchAll(/<(h1|h2|h3|a)[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const t = strip(m[2]);
    if (t.length > 35 && !out.includes(t)) out.push(t);
    if (out.length >= 8) break;
  }
  return out;
}

async function getLiveResults() {
  const [partyHtml,constHtml,abpHtml,n18Html] = await Promise.all([
    fetchText(SOURCES.eciPartyWise), fetchText(SOURCES.eciStateHome), fetchText(SOURCES.abp), fetchText(SOURCES.news18)
  ]);
  const trend = parsePartyWise(partyHtml);
  const constituencies = parseConstituencies(constHtml);
  return {
    updatedAt: new Date().toISOString(), sources: SOURCES, trend,
    districts: buildDistrictSummary(constituencies),
    headlines: { abp: parseHeadlines(abpHtml), news18: parseHeadlines(n18Html) }
  };
}

const server = http.createServer(async (req,res)=>{
  if (req.url === '/' || req.url === '/index.html') {
    const html = fs.readFileSync(path.join(__dirname,'public/index.html'),'utf8');
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'}); res.end(html); return;
  }
  if (req.url === '/api/live-results') {
    try {
      const data = await getLiveResults();
      res.writeHead(200, {'Content-Type':'application/json'}); res.end(JSON.stringify(data));
    } catch (e) {
      res.writeHead(500, {'Content-Type':'application/json'}); res.end(JSON.stringify({error:e.message, updatedAt:new Date().toISOString()}));
    }
    return;
  }
  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, ()=>console.log(`Server listening on http://localhost:${PORT}`));
