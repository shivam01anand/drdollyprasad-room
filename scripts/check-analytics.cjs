/* Browser-DOM journeys using the real React components and event handlers; no live visitor data. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { JSDOM, VirtualConsole } = require('jsdom');

process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_automated_test_only';
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'https://drdollyprasad.com/works?analytics_test=1',
  pretendToBeVisual: true,
  virtualConsole: new VirtualConsole(),
});
for (const key of ['window', 'document', 'location', 'history', 'sessionStorage', 'Element', 'HTMLElement', 'HTMLVideoElement', 'HTMLInputElement', 'Event', 'MouseEvent']) {
  global[key] = key === 'window' ? dom.window : dom.window[key];
}
Object.defineProperty(global, 'navigator', { configurable: true, value: dom.window.navigator });
global.IS_REACT_ACT_ENVIRONMENT = true;
global.addEventListener = window.addEventListener.bind(window);
global.removeEventListener = window.removeEventListener.bind(window);
global.innerHeight = 900;
global.scrollY = 0;
global.matchMedia = window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
window.open = () => null;
const clipboard = [];
Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text) => { clipboard.push(text); } } });

const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
const captures = [];
let config;
let superProperties = {};
const recordingOverrides = [];
let sessionListener;
const sdk = {
  onSessionId(listener) { sessionListener = listener; listener('test-session', 'test-window'); return () => {}; },
  has_opted_out_capturing() { return false; },
  startSessionRecording(override) { recordingOverrides.push(override); },
  register(props) { superProperties = { ...superProperties, ...props }; },
  capture(event, properties, options) {
    const result = config.before_send({ event, properties: { ...superProperties, ...properties } });
    if (result) captures.push({ ...result, options });
  },
  init(key, options) { config = options; options.loaded(sdk); },
};
let pathname = '/works';
const rootDir = path.resolve(__dirname, '..');
const modules = new Map();
function load(file) {
  const full = path.join(rootDir, file);
  if (modules.has(full)) return modules.get(full).exports;
  const mod = new Module(full);
  modules.set(full, mod);
  mod.filename = full;
  mod.paths = Module._nodeModulePaths(path.dirname(full));
  const native = Module.createRequire(full);
  mod.require = (id) => {
    if (id === 'posthog-js') return { __esModule: true, default: sdk };
    if (id === 'next/navigation') return { usePathname: () => pathname };
    if (id === 'next/link') return { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) };
    if (id.startsWith('.') || id.startsWith('@/')) {
      const base = id.startsWith('@/') ? path.join(rootDir, id.slice(2)) : path.resolve(path.dirname(full), id);
      const target = ['', '.ts', '.tsx', '.json'].map((ext) => base + ext).find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
      if (target?.endsWith('.json')) return JSON.parse(fs.readFileSync(target, 'utf8'));
      if (target) return load(path.relative(rootDir, target));
    }
    return native(id);
  };
  mod._compile(ts.transpileModule(fs.readFileSync(full, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, full);
  return mod.exports;
}

const analytics = load('lib/analytics.ts');
const { observeAnalyticsInteractions } = load('lib/analytics-interactions.ts');
const Analytics = load('components/Analytics.tsx').default;
const WorksBrowser = load('components/site/WorksBrowser.tsx').default;
const EnquireForm = load('components/site/EnquireForm.tsx').default;
const Share = load('components/Share.tsx').default;
const byEvent = (name) => captures.filter((e) => e.event === name);
const click = async (el) => act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); });

(async () => {
  // A fast first click must survive the deferred SDK import with its original URL/time.
  const stop = observeAnalyticsInteractions();
  const link = document.createElement('a');
  link.href = '/work/temple-bells';
  link.textContent = 'Threads of Faith';
  document.body.append(link);
  link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  history.replaceState(null, '', '/about');
  await analytics.initAnalytics();
  assert.deepEqual(recordingOverrides, [{ url_trigger: true }], 'Dolly must override the shared Book2Kindle-only recording URL trigger');
  sessionListener('test-session', 'test-window');
  assert.equal(recordingOverrides.length, 1, 'The recording override must not loop for the same session');
  sessionListener('next-session', 'test-window');
  assert.equal(recordingOverrides.length, 2, 'Recording must also start after an idle session rotates');
  assert.equal(byEvent('painting_clicked').length, 1);
  assert.equal(byEvent('painting_clicked')[0].properties.painting_title, 'Threads of Faith');
  assert.equal(byEvent('painting_clicked')[0].properties.$pathname, '/works');
  assert.equal(byEvent('painting_clicked')[0].properties.is_test, true);
  assert.ok(byEvent('painting_clicked')[0].options.timestamp instanceof Date);
  stop(); link.remove(); captures.length = 0;

  const view = createRoot(document.getElementById('root'));
  sessionStorage.removeItem('dolly-analytics-test');
  history.replaceState(null, '', '/works?analytics_test=1&utm_source=instagram');
  await act(async () => { view.render(React.createElement(React.Fragment, null, React.createElement(Analytics), React.createElement(WorksBrowser))); });
  assert.equal(byEvent('$pageview').length, 1);
  assert.equal(byEvent('$pageview')[0].properties.is_test, true, 'Catalogue URL updates must preserve the first-visit verification flag');
  assert.ok(byEvent('$pageview')[0].properties.$current_url.includes('utm_source=instagram'), 'Campaign attribution must survive initial catalogue URL setup');
  const status = document.querySelectorAll('.filters select')[1];
  status.value = 'available';
  await act(async () => status.dispatchEvent(new Event('change', { bubbles: true })));
  assert.equal(byEvent('works_filter_changed').at(-1).properties.value, 'available');
  assert.equal(byEvent('$pageview').length, 1, 'Changing filters must not inflate pageview counts');

  // A painting-to-enquiry journey must retain the painting, even after the route changes.
  history.replaceState(null, '', '/work/temple-bells'); pathname = '/work/temple-bells';
  await act(async () => { view.render(React.createElement(React.Fragment, null, React.createElement(Analytics), React.createElement('a', { href: '/enquire?work=temple-bells' }, 'Enquire'))); });
  assert.equal(byEvent('painting_viewed').at(-1).properties.painting_id, 'temple-bells');
  assert.equal(byEvent('page_engagement')[0].properties.$pathname, '/works');
  await click(document.querySelector('#root a'));
  assert.equal(byEvent('enquiry_clicked').at(-1).properties.painting_title, 'Threads of Faith');

  history.replaceState(null, '', '/enquire?work=temple-bells'); pathname = '/enquire';
  await act(async () => { view.render(React.createElement(React.Fragment, null, React.createElement(Analytics), React.createElement(EnquireForm))); });
  assert.equal(byEvent('enquiry_viewed').at(-1).properties.painting_id, 'temple-bells');
  await act(async () => document.getElementById('q-name').focus());
  await act(async () => document.getElementById('q-reply').focus());
  assert.equal(byEvent('enquiry_started').length, 1);
  for (const [id, value] of [['q-name', 'Private Visitor Name'], ['q-reply', 'private-visitor@example.com'], ['q-msg', 'PRIVATE MESSAGE THAT MUST NEVER REACH ANALYTICS']]) {
    const input = document.getElementById(id);
    const prototype = id === 'q-msg' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    await act(async () => {
      Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
  await act(async () => document.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  assert.equal(byEvent('enquiry_handoff').at(-1).properties.painting_id, 'temple-bells');
  assert.equal(byEvent('enquiry_handoff').at(-1).properties.source, 'enquiry_form');
  assert.ok(!captures.some((e) => e.event === 'enquiry_sent'), 'Opening another app is not a confirmed sent enquiry');
  await click([...document.querySelectorAll('button')].find((b) => b.textContent === 'Copy the message'));
  assert.ok(clipboard.at(-1).includes('PRIVATE MESSAGE'), 'The actual form must still produce the visitor’s message');
  assert.equal(byEvent('enquiry_message_copied').length, 1);

  // The message in a direct WhatsApp/mail link must never become an event property.
  const direct = document.createElement('a');
  direct.href = 'https://wa.me/911234567890?text=PRIVATE%20MESSAGE%20private-visitor%40example.com';
  document.body.append(direct);
  await click(direct);
  assert.equal(byEvent('enquiry_handoff').at(-1).properties.method, 'whatsapp');
  assert.ok(!JSON.stringify(captures).includes('private-visitor@example.com'));
  assert.ok(!JSON.stringify(captures).includes('Private Visitor Name'));
  assert.ok(!JSON.stringify(captures).includes('PRIVATE MESSAGE'));
  direct.remove();

  assert.equal(analytics.analyticsUrl('https://drdollyprasad.com/enquire?work=temple-bells&email=private-visitor%40example.com&message=secret&utm_source=instagram#name'),
    'https://drdollyprasad.com/enquire?work=temple-bells&utm_source=instagram');
  assert.equal(analytics.analyticsUrl('mailto:private-visitor@example.com?body=secret'), '');
  const scrubbed = config.before_send({ event: '$pageview', properties: { $referrer: 'https://example.com/?email=private-visitor%40example.com', $session_entry_url: 'https://drdollyprasad.com/?email=private-visitor%40example.com', $set_once: { $initial_current_url: 'https://drdollyprasad.com/?token=private-secret' } } });
  assert.ok(!JSON.stringify(scrubbed).includes('private-visitor'));
  assert.ok(!JSON.stringify(scrubbed).includes('private-secret'));
  assert.equal(config.session_recording.maskAllInputs, true);
  assert.equal(config.session_recording.recordBody, false);
  assert.equal(config.session_recording.captureCanvas.recordCanvas, false);

  await act(async () => { view.render(React.createElement(React.Fragment, null, React.createElement(Analytics), React.createElement(Share, { title: 'Threads of Faith', path: '/work/temple-bells' }))); });
  await click(document.querySelector('#root button'));
  assert.equal(byEvent('painting_shared').at(-1).properties.painting_id, 'temple-bells');
  assert.equal(byEvent('painting_shared').at(-1).properties.method, 'copy_link');
  const originalCapture = sdk.capture;
  const copiesBeforeFailure = clipboard.length;
  sdk.capture = () => { throw new Error('Simulated unavailable analytics'); };
  await click(document.querySelector('#root button'));
  assert.equal(clipboard.length, copiesBeforeFailure + 1, 'Sharing must keep working if analytics capture fails');
  sdk.capture = originalCapture;

  for (const view of require('./posthog-insights.cjs')) {
    if (view.query.kind === 'DataTableNode') {
      assert.ok(view.query.source.query.includes("properties.app_name = 'drdollyprasad'"));
      assert.ok(view.query.source.query.includes('properties.is_test = false'));
    } else {
      const filters = view.query.source.properties;
      assert.deepEqual(filters.find((p) => p.key === 'app_name').value, ['drdollyprasad']);
      assert.deepEqual(filters.find((p) => p.key === 'analytics_environment').value, ['production']);
      assert.deepEqual(filters.find((p) => p.key === 'is_test').value, [false]);
    }
  }
  await act(async () => view.unmount());
  const before = captures.length;
  document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  assert.equal(captures.length, before, 'Unmount must remove delegated listeners');
  dom.window.close();
  console.log('Analytics journeys pass: deferred first click, SPA/filter pageviews, painting → enquiry, private inputs, handoff accuracy, sharing during analytics failure, site/test filtering and listener cleanup.');
})().catch((error) => { console.error(error); dom.window.close(); process.exitCode = 1; });
