// Which Amplitude chart feeds which field of the page's data, for each of the three bot-filter views.
// Chart IDs come from Mike's dashboards: Strong = lm29400h (>=70), Maximum = 5ec1pe2j (>=90), Moderate = bsjj5vr9 (>=30).
// Last year (tpLY) is NOT listed: it is complete through 2025-12-31 and never refreshed.
import { canon } from './paths.js';

const TP_CHANNELS = Object.fromEntries(['Paid Search', 'Direct', 'Paid Social', 'Organic Search', 'Email'].map((k) => [k, k]));
const RB_CHANNELS = { cpc: 'Paid Search (cpc)', paid_social: 'Paid Social', email: 'Email', organic: 'Organic', '(none)': 'Direct (none)' };
const DEVICES = { mobile: 'Mobile', desktop: 'Desktop' };
const GEO3 = { US: 'US', CA: 'Canada', AU: 'Australia' };
const FUNNEL = { atc: 'Add to cart rate', fc: 'Funnel completion rate', cc: 'Checkout completion rate' };
export const TP_PAYMENT_LABELS = { credit_card: 'Card', apple_pay_card: 'Apple Pay', paypal_account: 'PayPal', android_pay_card: 'Google Pay' };

// Chart IDs per view and site. Roles: cvr/sess = sitewide; chCvr/chSess = by channel; devCvr/devSess = by device; atc/fc/cc = funnel rates;
// gUS/gCA/gAU/gEU = CVR by region; geo3/geoEU = sessions by region; pay = payment mix (TeePublic, Strong only).
const IDS = {
  strong: {
    tp: { cvr: 't50lzd6f', sess: 'ebr0nnlc', chCvr: 'qhto4t7e', chSess: 'j2b9hj77', devCvr: '6u97stef', devSess: 'vro9klf8', atc: 'jbpkevmk', fc: '4pmgjkdy', cc: 'r72vauky', gUS: 'd45gja14', gCA: 'o82am7t0', gAU: 'uwl6mwt2', gEU: 'g4cj9vi7', geo3: 'v5smbr37', geoEU: 'oz5kf11y', pay: '5fvpbsdb' },
    rb: { cvr: 'hv3jdftd', sess: 'rb9kh9uz', chCvr: 'bjjgl1uu', chSess: 'gb97mum4', devCvr: 'ucllwnls', devSess: 'onzi2ij9', atc: 'ir369hds', fc: 'o6krg9lp', cc: 'nhhy4cjn', gUS: 'ti3044dw', gCA: 'qvklmiq4', gAU: '7z0c5rjm', gEU: 'pycd0esz', geo3: '79ww2qlz', geoEU: 'd6oq45gw' },
  },
  max: { // region charts added by Mike on 2026-11-07 (TeePublic Europe = GB; Redbubble Europe = GB + DE + FR, scraper JA4 excluded)
    tp: { cvr: 'sij6sjzl', sess: 'nxqyfr5s', chCvr: 'bkyp384a', chSess: 'irxdsgxg', devCvr: 'idhqxu31', devSess: 'ut6dmgl3', atc: 'bov1b5rq', fc: 'sydsccj1', cc: '00ez5hda', gUS: 'i5ypmeih', gCA: '7xf9k119', gAU: 'rwmysnde', gEU: 'hvv9sb3c', geo3: 'tcqrlq8u', geoEU: 'wnpv5uu7' },
    rb: { cvr: 'eotq1vlp', sess: 'e6iym0kj', chCvr: 'a3ptpewu', chSess: 'h4yxkna9', devCvr: 'zgfkixsf', devSess: '142c9aqp', atc: 'dcciy910', fc: '37yoz8p3', cc: '7h271vlc', gUS: '5cxeanpf', gCA: 'g184msvl', gAU: '4o6vvmlq', gEU: 'sp4pudmk', geo3: '0oaro53e', geoEU: 'caxl62yg' },
  },
  mod: { // matched to the Strong dashboard by position (it is a clone); the dry run checks every chart against the stored numbers
    tp: { cvr: 'qmmqr11h', sess: 'iofuutuj', chCvr: 'pzujnrms', chSess: 'kqp8touz', gUS: 'x8dwvuwd', gCA: 'hkmgaxbl', gAU: 'k689jd2w', gEU: '82z900np', geo3: 'x0ha2872', geoEU: '7qr3a8gs', devCvr: 'xrz3clve', devSess: '5082z1hf', atc: '831g3x0p', fc: '1xebu7m4', cc: 'bq3agyy3' },
    rb: { cvr: 'g0lpaznx', sess: 'ysd0bcjq', chCvr: '7p5xz3le', chSess: '0ui9ig3x', gUS: '2255irqx', gCA: 'spuo0n8k', gAU: 'm9vmuwz8', gEU: 'vfc1pzmq', geo3: 'zm8j8b4s', geoEU: 'lix34qc5', devCvr: 'm3oiypd5', devSess: '8bh04keq', atc: '37elxv9j', fc: 'jmfgglmg', cc: 'nx8kl36x' },
  },
};
const PREFIX = { strong: { D: 'D', L: 'L' }, max: { D: 'MAX.D', L: 'MAX.L' }, mod: { D: 'STD.D', L: 'STD.L' } };

export function savedCharts() {
  const out = [];
  for (const [view, sites] of Object.entries(IDS)) for (const [b, ids] of Object.entries(sites)) {
    const { D, L } = PREFIX[view], chan = b === 'tp' ? TP_CHANNELS : RB_CHANNELS;
    const add = (role, targets) => ids[role] && out.push({ id: ids[role], view, brand: b, role, targets: Object.fromEntries(Object.entries(targets).map(([k, v]) => [k, canon(v)])) });
    const grouped = (labels, dim, f) => Object.fromEntries(Object.entries(labels).map(([lab, key]) => [lab, `${L}.${b}.${dim}['${key}'].${f}`]));
    add('cvr', { default: `${D}.${b}.cvr` }); add('sess', { default: `${D}.${b}.sess` });
    add('chCvr', grouped(chan, 'channel', 'v')); add('chSess', grouped(chan, 'channel', 's'));
    add('devCvr', grouped(DEVICES, 'device', 'v')); add('devSess', grouped(DEVICES, 'device', 's'));
    for (const [r, name] of Object.entries(FUNNEL)) add(r, { default: `${L}.${b}.funnel['${name}'].v` });
    for (const [r, key] of [['gUS', 'US'], ['gCA', 'Canada'], ['gAU', 'Australia'], ['gEU', 'Europe']]) add(r, { default: `${L}.${b}.geo['${key}'].v` });
    add('geo3', grouped(GEO3, 'geo', 's')); add('geoEU', { default: `${L}.${b}.geo['Europe'].s` });
    if (ids.pay) add('pay', Object.fromEntries(Object.entries(TP_PAYMENT_LABELS).map(([lab, key]) => [lab, `D.pay.tp['${key}']`])));
  }
  return out;
}

// Ad-hoc queries (no saved chart): revenue, orders and Redbubble payments, as documented in the data files and confirmed against the page.
export const ADHOC = [
  { key: 'revTp', brand: 'tp', metric: 'sums', event: { event_type: 'order_completed', group_by: [{ type: 'event', value: 'total_revenue_usd' }] }, targets: { default: 'R.tp' } },
  { key: 'ordTp', brand: 'tp', metric: 'totals', event: { event_type: 'order_completed' }, targets: { default: 'ORD.tp' } },
  { key: 'revRb', brand: 'rb', metric: 'sums', event: { event_type: 'order_completed', group_by: [{ type: 'event', value: 'transaction_amount_usd' }] }, targets: { default: 'R.rb' } },
  { key: 'ordRb', brand: 'rb', metric: 'totals', event: { event_type: 'order_completed' }, targets: { default: 'ORD.rb' } },
  { key: 'payRb', brand: 'rb', metric: 'totals', event: { event_type: 'order_completed', group_by: [{ type: 'event', value: 'payment_type' }, { type: 'event', value: 'wallet_type' }] }, payments: true,
    targets: Object.fromEntries(['Card', 'Apple Pay', 'Google Pay', 'PayPal', 'Klarna, Afterpay'].map((k) => [k, canon(`D.pay.rb['${k}']`)])) },
];