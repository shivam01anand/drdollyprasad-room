/* PostHog query definitions. Every view is scoped to Dolly's production traffic. */
const properties = [
  { type: 'event', key: 'app_name', operator: 'exact', value: ['drdollyprasad'] },
  { type: 'event', key: 'analytics_environment', operator: 'exact', value: ['production'] },
  { type: 'event', key: 'is_test', operator: 'exact', value: [false] },
];
const scope = "properties.app_name = 'drdollyprasad' AND properties.analytics_environment = 'production' AND properties.is_test = false AND timestamp >= now() - INTERVAL 30 DAY";
const common = { dateRange: { date_from: '-30d', date_to: null }, properties };
const event = (name, custom_name, extra = {}) => ({ kind: 'EventsNode', event: name, custom_name, ...extra });
const viz = (source) => ({ kind: 'InsightVizNode', source });
const trends = (series, breakdown, display = 'ActionsBarValue') => viz({
  kind: 'TrendsQuery', ...common, interval: 'day', series,
  trendsFilter: { display, showLegend: true },
  ...(breakdown ? { breakdownFilter: { breakdown, breakdown_type: 'event', breakdown_limit: 15 } } : {}),
});
const funnel = (series) => viz({
  kind: 'FunnelsQuery', ...common, series,
  funnelsFilter: {
    funnelOrderType: 'ordered', funnelVizType: 'steps',
    funnelWindowInterval: 1, funnelWindowIntervalUnit: 'hour',
    funnelAggregateByHogQL: 'properties.$session_id',
  },
});
const sql = (query) => ({ kind: 'DataTableNode', source: { kind: 'HogQLQuery', query } });

module.exports = [
  { name: 'Visitors over time', description: 'Unique anonymous browsers per day. A browser is not a verified person.', query: trends([event('$pageview', 'Visitors', { math: 'dau' })], null, 'ActionsLineGraph') },
  { name: 'Countries', description: 'Sessions by approximate IP-derived country.', query: trends([event('$pageview', 'Sessions', { math: 'unique_session' })], '$geoip_country_name') },
  { name: 'Cities', description: 'Sessions by approximate IP-derived city; VPNs and mobile networks can change this.', query: trends([event('$pageview', 'Sessions', { math: 'unique_session' })], '$geoip_city_name') },
  { name: 'Devices', description: 'Desktop, mobile and tablet sessions.', query: trends([event('$pageview', 'Sessions', { math: 'unique_session' })], '$device_type') },
  { name: 'Browsers', description: 'Sessions by browser.', query: trends([event('$pageview', 'Sessions', { math: 'unique_session' })], '$browser') },
  { name: 'Traffic sources', description: 'Referring domains. Add utm_source/utm_medium/utm_campaign breakdowns for campaigns.', query: trends([event('$pageview', 'Sessions', { math: 'unique_session' })], '$referring_domain') },
  { name: 'Paintings opened', description: 'Unique visitors opening each painting, in its page or in the 3D studio lightbox.', query: trends([event('painting_viewed', 'Visitors', { math: 'dau' })], 'painting_title') },
  { name: 'Visit → painting → contact', description: 'Ordered funnel within one session and one hour. Contact means opening email/WhatsApp, not a confirmed sent message.', query: funnel([event('$pageview', 'Website visit'), event('painting_viewed', 'Opened a painting'), event('enquiry_handoff', 'Opened email or WhatsApp')]) },
  { name: 'Enquiry form drop-off', description: 'Opened the form → focused a field → handed off to email/WhatsApp. Copying a message is tracked separately.', query: funnel([event('enquiry_viewed', 'Opened enquiry form'), event('enquiry_started', 'Started enquiry'), event('enquiry_handoff', 'Opened email or WhatsApp', { properties: [{ type: 'event', key: 'source', operator: 'exact', value: ['enquiry_form'] }] })]) },
  { name: 'Studio loading → painting', description: 'Started the 3D studio → intro finished → opened a painting in its lightbox.', query: funnel([event('studio_load_started', 'Studio load started'), event('studio_ready', 'Studio ready'), event('painting_viewed', 'Opened a studio painting', { properties: [{ type: 'event', key: 'surface', operator: 'exact', value: ['studio_lightbox'] }] })]) },
  { name: 'Pages visitors follow', description: 'Page-to-page paths; the outgoing drop-offs show where no next page was observed.', query: viz({ kind: 'PathsQuery', ...common, pathsFilter: { includeEventTypes: ['$pageview'], stepLimit: 8, edgeLimit: 50, stripQueryString: true } }) },
  { name: 'Recent visitor sessions', description: 'Anonymous browser/session, approximate location, device and browser, first/last observation and paintings opened.', query: sql(`SELECT properties.$session_id AS session_id, distinct_id AS visitor_id,
  min(timestamp) AS first_seen, max(timestamp) AS last_seen,
  any(properties.$geoip_city_name) AS city, any(properties.$geoip_country_name) AS country,
  any(properties.$device_type) AS device, any(properties.$browser) AS browser, any(properties.$os) AS operating_system,
  argMin(properties.$pathname, timestamp) AS first_page,
  argMax(properties.$pathname, timestamp) AS last_page,
  groupUniqArrayIf(properties.painting_title, event = 'painting_viewed') AS paintings_opened,
  countIf(event = 'enquiry_handoff') AS contact_handoffs
FROM events WHERE ${scope} AND notEmpty(toString(properties.$session_id))
GROUP BY session_id, distinct_id ORDER BY last_seen DESC LIMIT 50`) },
  { name: 'Last observed pages', description: 'Last pageview seen in each session. It is an observation, not proof someone abandoned or closed the browser.', query: sql(`SELECT last_page, count() AS sessions FROM (
  SELECT properties.$session_id AS session_id, argMax(properties.$pathname, timestamp) AS last_page
  FROM events WHERE ${scope} AND event = '$pageview' AND notEmpty(toString(properties.$session_id))
  GROUP BY session_id
) GROUP BY last_page ORDER BY sessions DESC LIMIT 30`) },
  { name: 'Time with paintings visible', description: 'Foreground-tab seconds, deduplicated across visibility checkpoints per page visit. This estimates visibility, not attention.', query: sql(`SELECT painting_title, count() AS page_visits, round(avg(visible_seconds), 1) AS average_visible_seconds FROM (
  SELECT properties.page_view_id AS page_visit, any(properties.painting_title) AS painting_title,
    max(toFloat(properties.visible_seconds)) AS visible_seconds
  FROM events WHERE ${scope} AND event = 'page_engagement' AND properties.page_type = 'painting'
  GROUP BY page_visit
) GROUP BY painting_title ORDER BY page_visits DESC LIMIT 30`) },
];
