/* Checks the unlisted dashboard query allowlist and production scope. No network. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');
const { NextRequest } = require('next/server');
const root = path.resolve(__dirname, '..');
const modules = new Map();
function load(relative) {
  const full = path.join(root, relative);
  if (modules.has(full)) return modules.get(full).exports;
  const mod = new Module(full); modules.set(full, mod); mod.filename = full; mod.paths = Module._nodeModulePaths(path.dirname(full));
  const native = Module.createRequire(full);
  mod.require = id => id === '@/scripts/posthog-insights.cjs' ? require('./posthog-insights.cjs') : native(id);
  mod._compile(ts.transpileModule(fs.readFileSync(full, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, full);
  return mod.exports;
}
(async () => {
  const request = query => new NextRequest(`http://localhost/analytics/data?${query}`);
  const route = load('app/analytics/data/route.ts');
  delete process.env.POSTHOG_PERSONAL_API_KEY;
  assert.equal((await route.GET(request(''))).status, 503);
  process.env.POSTHOG_PERSONAL_API_KEY = 'phx_local_test_only';
  assert.equal((await route.GET(request('tile=14'))).status, 400);
  assert.equal((await route.GET(request('days=1%20OR%201%3D1'))).status, 400);
  const queries = [];
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://us.posthog.com/api/projects/317586/query/');
    assert.equal(options.cache, 'no-store');
    queries.push(JSON.parse(options.body).query);
    return Response.json({ results: [], columns: [] });
  };
  for (let tile = 0; tile < 14; tile++) {
    const response = await route.GET(request(`tile=${tile}&days=7`));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
    const q = queries.at(-1);
    if (q.kind === 'HogQLQuery') {
      for (const scope of ["properties.app_name = 'drdollyprasad'", "properties.analytics_environment = 'production'", 'properties.is_test = false', 'INTERVAL 7 DAY']) assert.ok(q.query.includes(scope));
    } else {
      assert.deepEqual(q.properties.map(p => [p.key, p.value]), [['app_name', ['drdollyprasad']], ['analytics_environment', ['production']], ['is_test', ['false']]]);
      assert.equal(q.dateRange.date_from, '-7d');
    }
  }
  await route.GET(request('tile=summary&days=90'));
  assert.ok(queries.at(-1).query.includes('INTERVAL 90 DAY'));
  global.fetch = async () => Response.json({}, { status: 429 });
  assert.equal((await route.GET(request('tile=0'))).status, 502);
  global.fetch = async () => Response.json({ query_status: { complete: false } });
  assert.equal((await route.GET(request('tile=0'))).status, 503);
  console.log('Analytics query checks pass: no login required, query allowlist, production scope, date ranges and upstream failures.');
})().catch(e => { console.error(e); process.exitCode = 1; });
