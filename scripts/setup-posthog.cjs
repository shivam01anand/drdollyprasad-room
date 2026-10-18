/* Run with a server-side phx_ personal key; never import this file into the application. */
const fs = require('node:fs');
const path = require('node:path');
const views = require('./posthog-insights.cjs');
const host = (process.env.POSTHOG_UI_HOST || 'https://us.posthog.com').replace(/\/$/, '');
const project = (process.env.POSTHOG_PROJECT_ID || '317586').trim();
const prefix = `${host}/project/${project}`;
const name = 'Dr Dolly Prasad — Visitor journeys';
const tag = 'managed:drdollyprasad-analytics';

function insightLink(query) {
  if (query.kind === 'DataTableNode') return `${prefix}/sql?open_query=${encodeURIComponent(JSON.stringify(query))}`;
  return `${prefix}/insights/new#q=${encodeURIComponent(JSON.stringify(query))}`;
}
function writeLinks() {
  const out = path.resolve(__dirname, '../docs/analytics-views.md');
  fs.writeFileSync(out, [
    '# Open the analytics views', '',
    'These links open **prepared, unsaved views** in PostHog project 317586. Sign in with the account that has access to the existing Book2Kindle project. They are not a saved dashboard, and their queries have not yet been executed through the authenticated API.', '',
    'Every query includes `app_name = drdollyprasad`, `analytics_environment = production`, and `is_test = false`. The default date range is the last 30 days. This excludes Book2Kindle traffic, previews and marked verification sessions.', '',
    ...views.map((v) => `- [${v.name}](${insightLink(v.query)}) — ${v.description}`), '',
    'For a saved dashboard, run `node --env-file=.env.local scripts/setup-posthog.cjs` with a valid `POSTHOG_PERSONAL_API_KEY` (`phx_…`). Keep that key server-side and out of Git. See [analytics.md](analytics.md) for the event definitions and verification limits.', '',
  ].join('\n'));
  console.log(`Wrote ${views.length} prepared view links to docs/analytics-views.md`);
}

async function main() {
  if (process.argv.includes('--links')) { writeLinks(); return; }
  const key = (process.env.POSTHOG_PERSONAL_API_KEY || '').trim();
  if (!key.startsWith('phx_')) throw new Error('A phx_ personal API key is required to save dashboards. A phc_ public capture token cannot do this.');
  async function api(route, method = 'GET', body) {
    const response = await fetch(`${host}/api/projects/${project}/${route}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(60000),
    });
    if (!response.ok) throw new Error(`PostHog ${method} ${route.split('?')[0]} returned HTTP ${response.status}`);
    return response.json();
  }
  // Validate the actual queries before making any saved objects.
  for (const view of views) {
    const query = view.query.kind === 'InsightVizNode' ? view.query.source : view.query;
    await api('query/', 'POST', { query });
    console.log(`Validated: ${view.name}`);
  }
  const dashboards = await api(`dashboards/?search=${encodeURIComponent(name)}`);
  let dashboard = dashboards.results.find((d) => d.name === name && d.tags?.includes(tag));
  if (!dashboard) dashboard = await api('dashboards/', 'POST', {
    name, tags: [tag], pinned: true,
    description: 'Dolly-only production visitors, paintings, location/device/source, enquiry funnels and observed exits. Test and preview traffic excluded. Contact handoffs are not confirmed sent messages.',
  });
  const existing = await api(`insights/?search=${encodeURIComponent('Dr Dolly —')}&limit=100`);
  for (const view of views) {
    const title = `Dr Dolly — ${view.name}`;
    const found = existing.results.find((i) => i.name === title && i.tags?.includes(tag));
    const body = { name: title, description: view.description, tags: [tag], saved: true, dashboards: [dashboard.id], query: view.query };
    const insight = found ? await api(`insights/${found.id}/`, 'PATCH', body) : await api('insights/', 'POST', body);
    console.log(`${view.name}: ${prefix}/insights/${insight.short_id}`);
  }
  console.log(`Dashboard: ${prefix}/dashboard/${dashboard.id}`);
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
