/**
 * Gellings Training Academy - completion records
 *
 * Paste this into Extensions > Apps Script on a new Google Sheet,
 * run "setup" once, then Deploy > New deployment > Web app
 * (Execute as: Me, Who has access: Anyone).
 *
 * The portal sends a record here every time someone passes a course.
 * The private records page reads them back, but only with your admin key.
 */

const SHEET_NAME = 'Completions';
const HEADERS = ['Received', 'Date passed', 'Name', 'Workplace', 'Manager email', 'Course', 'Score %', 'Certificate no.'];

/** Run this once from the editor. It creates the sheet and your admin key. */
function setup() {
  const sheet = getSheet_();
  const props = PropertiesService.getScriptProperties();
  let key = props.getProperty('ADMIN_KEY');
  if (!key) {
    key = Utilities.getUuid().replace(/-/g, '').slice(0, 16);
    props.setProperty('ADMIN_KEY', key);
  }
  Logger.log('Sheet ready: ' + sheet.getName());
  Logger.log('Your admin key (keep it private): ' + key);
}

/** Receives a completion from the training portal. */
function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const cert = clean_(d.cert, 40);
    if (!/^GEL-[A-Z]+-\d{8}-[A-Z0-9]{4}$/.test(cert)) return json_({ ok: false, error: 'bad certificate number' });

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = getSheet_();
      // Don't store the same certificate twice
      const last = sheet.getLastRow();
      if (last > 1) {
        const certs = sheet.getRange(2, 8, last - 1, 1).getValues().flat();
        if (certs.indexOf(cert) !== -1) return json_({ ok: true, duplicate: true });
      }
      sheet.appendRow([
        new Date(),
        new Date(d.passed),
        clean_(d.name, 60),
        clean_(d.company, 80),
        clean_(d.manager, 120),
        clean_(d.course, 80),
        Math.max(0, Math.min(100, Number(d.score) || 0)),
        cert
      ]);
    } finally {
      lock.releaseLock();
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/** Returns all records to the private records page, if the admin key is right. */
function doGet(e) {
  const key = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  if (!key || !e.parameter || e.parameter.key !== key) return json_({ ok: false, error: 'wrong key' });
  const sheet = getSheet_();
  const last = sheet.getLastRow();
  const rows = last > 1 ? sheet.getRange(2, 1, last - 1, HEADERS.length).getValues() : [];
  const records = rows.map(r => ({
    received: iso_(r[0]), passed: iso_(r[1]), name: r[2], company: r[3],
    manager: r[4], course: r[5], score: r[6], cert: r[7]
  }));
  return json_({ ok: true, records: records });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#1a2340').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Trim, shorten, and stop anything being read as a spreadsheet formula. */
function clean_(v, max) {
  let s = String(v == null ? '' : v).trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function iso_(v) { return v instanceof Date ? v.toISOString() : String(v || ''); }

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
