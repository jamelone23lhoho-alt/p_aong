const DB_SHEET = "_database";
const TZ = "Asia/Bangkok";

const OPT_START_COL = 1;
const OPT_COLS = 2;
const REC_START_COL = 4;
const REC_COLS = 14;

const EVENT_NAME = "Energy on the Rocks · Tamca Night Party";
const SEND_CONFIRMATION = true;

const MAILGUN_DOMAIN = "javaoutrunners.com";
const MAILGUN_REGION = "us";
const MAIL_FROM = "noreply@javaoutrunners.com";
const MAIL_FROM_NAME = "Temca Night Party";
const REPLY_TO = "temcaparty@gmail.com";

const QR_API = "https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=";
const ANNOUNCE_BATCH = 100;

const ANNOUNCE_SUBJECT = "อัปเดตงาน Energy on the Rocks · Tamca Night Party";
const ANNOUNCE_HTML =
  "<div style='font-family:Arial,sans-serif;font-size:15px;color:#1f1a26;line-height:1.7'>" +
  "<p>สวัสดีทีมงานทุกคน</p>" +
  "<p>รายละเอียดงานปาร์ตี้อัปเดตแล้ว โปรดตรวจสอบวันเวลาและสถานที่อีกครั้ง แล้วเจอกันในงาน</p>" +
  "<p>เสาร์ 22 สิงหาคม 2569 · Garden in the Sky (Hall 1) สวนนงนุช</p>" +
  "<p>ขอบคุณครับ</p></div>";

const OPT_HEADERS = ["ประเภทบัตร", "สถานะการเข้าพัก"];
const REC_HEADERS = [
  "เวลาบันทึก",
  "หมายเลขบัตร",
  "ประเภทบัตร",
  "ชื่อ",
  "นามสกุล",
  "สถานะการเข้าพัก",
  "เบอร์โทร",
  "อีเมล",
  "บริษัท",
  "โรงแรม",
  "วันที่เข้าพัก",
  "เวลาเช็คอิน",
  "รหัส QR",
  "สถานะส่งประกาศ"
];

const DEFAULT_TIERS = ["STANDARD", "GOLD", "PLATINUM"];
const DEFAULT_ROLES = ["ผู้เข้าพักหลัก", "ผู้เข้าร่วมพัก"];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("ระบบลงทะเบียน")
    .addItem("Initialize ชีท", "initialize")
    .addItem("ตั้งค่า Mailgun API Key", "setupMailKey")
    .addItem("ส่งอีเมลประกาศถึงทุกคน", "sendAnnouncement")
    .addToUi();
}

function setupMailKey() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.prompt("Mailgun API Key", "วาง Private API Key ที่นี่", ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() === ui.Button.OK) {
    const key = resp.getResponseText().trim();
    PropertiesService.getScriptProperties().setProperty("MAILGUN_API_KEY", key);
    ui.alert(key ? "บันทึก API Key เรียบร้อย" : "ล้างค่า API Key แล้ว");
  }
}

function getDbSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(DB_SHEET);
  if (!sheet) sheet = ss.insertSheet(DB_SHEET);
  return sheet;
}

function pad_(arr, len) {
  const out = arr.slice(0, len);
  while (out.length < len) out.push("");
  return out;
}

function initialize() {
  const sheet = getDbSheet_();
  sheet.clear();

  const optRows = Math.max(DEFAULT_TIERS.length, DEFAULT_ROLES.length);
  const optBlock = [OPT_HEADERS.slice()];
  for (let i = 0; i < optRows; i++) {
    optBlock.push([DEFAULT_TIERS[i] || "", DEFAULT_ROLES[i] || ""]);
  }
  sheet.getRange(1, OPT_START_COL, optBlock.length, OPT_COLS).setValues(optBlock);
  sheet.getRange(1, REC_START_COL, 1, REC_COLS).setValues([REC_HEADERS.slice()]);

  const totalCols = REC_START_COL + REC_COLS - 1;
  sheet.getRange(1, 1, 1, totalCols).setFontWeight("bold");
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, totalCols);

  return jsonOut_({ ok: true, message: "initialized" });
}

function getOptions() {
  const sheet = getDbSheet_();
  const lastRow = Math.max(sheet.getLastRow(), 1);
  const values = sheet.getRange(1, OPT_START_COL, lastRow, OPT_COLS).getValues();

  const cols = [[], []];
  for (let r = 1; r < values.length; r++) {
    for (let c = 0; c < OPT_COLS; c++) {
      const v = String(values[r][c] || "").trim();
      if (v) cols[c].push(v);
    }
  }

  return jsonOut_({ ok: true, tiers: cols[0], roles: cols[1] });
}

function addRecord(record) {
  const sheet = getDbSheet_();
  const r = record || {};

  const required = ["cardNo", "tier", "firstName", "lastName", "role", "phone", "email", "company", "hotel", "checkinDate"];
  for (let i = 0; i < required.length; i++) {
    if (!String(r[required[i]] || "").trim()) {
      return jsonOut_({ ok: false, error: "ข้อมูลไม่ครบถ้วน" });
    }
  }

  const lastRow = Math.max(sheet.getLastRow(), 1);
  const stampCol = sheet.getRange(1, REC_START_COL, lastRow, 1).getValues();
  let target = 2;
  for (let i = 1; i < stampCol.length; i++) {
    if (String(stampCol[i][0]).trim() === "") {
      target = i + 1;
      break;
    }
    target = i + 2;
  }

  const stamp = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd HH:mm:ss");
  const token = String(r.token || "");
  const row = pad_(
    [
      stamp,
      r.cardNo,
      r.tier,
      r.firstName,
      r.lastName,
      r.role,
      "'" + String(r.phone),
      r.email,
      r.company,
      r.hotel,
      r.checkinDate,
      r.checkinTime || "",
      token,
      ""
    ],
    REC_COLS
  );

  sheet.getRange(target, REC_START_COL, 1, REC_COLS).setValues([row]);
  sendConfirmation_(r, token);

  return jsonOut_({ ok: true, row: target });
}

function mailgunSend_(recipients, subject, html) {
  const key = PropertiesService.getScriptProperties().getProperty("MAILGUN_API_KEY");
  if (!key) throw new Error("ยังไม่ได้ตั้งค่า Mailgun API Key");

  const base = MAILGUN_REGION === "eu" ? "https://api.eu.mailgun.net" : "https://api.mailgun.net";
  const endpoint = base + "/v3/" + MAILGUN_DOMAIN + "/messages";

  const payload = {
    from: MAIL_FROM_NAME + " <" + MAIL_FROM + ">",
    to: recipients,
    subject: subject,
    html: html
  };
  if (REPLY_TO) payload["h:Reply-To"] = REPLY_TO;

  const res = UrlFetchApp.fetch(endpoint, {
    method: "post",
    headers: { Authorization: "Basic " + Utilities.base64Encode("api:" + key) },
    payload: payload,
    muteHttpExceptions: true
  });

  const code = res.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error("Mailgun " + code + ": " + res.getContentText());
  }
  return true;
}

function confirmationHtml_(r, token) {
  const qr = QR_API + encodeURIComponent(r.cardNo + "-" + token);
  return (
    "<div style='font-family:Arial,sans-serif;max-width:480px;color:#1f1a26'>" +
    "<h2 style='margin:0 0 4px'>ยืนยันการลงทะเบียน</h2>" +
    "<p style='color:#55505d;margin:0 0 16px'>" + EVENT_NAME + "</p>" +
    "<table style='font-size:14px;line-height:1.9'>" +
    "<tr><td style='color:#8b8593'>บัตรเลขที่</td><td style='padding-left:16px'><b>" + r.cardNo + "</b> (" + r.tier + ")</td></tr>" +
    "<tr><td style='color:#8b8593'>ชื่อ</td><td style='padding-left:16px'>" + r.firstName + " " + r.lastName + "</td></tr>" +
    "<tr><td style='color:#8b8593'>โรงแรม</td><td style='padding-left:16px'>" + r.hotel + "</td></tr>" +
    "<tr><td style='color:#8b8593'>วันที่เข้าพัก</td><td style='padding-left:16px'>" + r.checkinDate + " " + (r.checkinTime || "") + "</td></tr>" +
    "</table>" +
    "<p style='margin:18px 0 8px;font-size:14px'>QR ประจำตัว (ใช้แสดงตอนเข้าที่พัก)</p>" +
    "<img src='" + qr + "' width='200' height='200' alt='QR' style='border:1px solid #e2dccd;border-radius:12px;padding:8px;background:#fff'/>" +
    "<p style='color:#8b8593;font-size:12px;margin-top:16px'>อีเมลฉบับนี้ส่งอัตโนมัติจากระบบลงทะเบียน</p>" +
    "</div>"
  );
}

function sendConfirmation_(r, token) {
  if (!SEND_CONFIRMATION) return;
  try {
    mailgunSend_([String(r.email).trim()], "ยืนยันการลงทะเบียน " + EVENT_NAME + " · บัตร " + r.cardNo, confirmationHtml_(r, token));
  } catch (err) {}
}

function sendAnnouncement() {
  const ui = SpreadsheetApp.getUi();
  const sheet = getDbSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    ui.alert("ยังไม่มีข้อมูลผู้ลงทะเบียน");
    return;
  }

  const rows = lastRow - 1;
  const data = sheet.getRange(2, REC_START_COL, rows, REC_COLS).getValues();
  const emailIdx = 7;
  const announceIdx = 13;
  const today = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd");
  const start = Date.now();

  let sent = 0;
  let batch = [];
  let batchRows = [];

  const flush = function () {
    if (!batch.length) return;
    mailgunSend_(batch, ANNOUNCE_SUBJECT, ANNOUNCE_HTML);
    for (let k = 0; k < batchRows.length; k++) {
      data[batchRows[k]][announceIdx] = "sent " + today;
    }
    sent += batch.length;
    batch = [];
    batchRows = [];
  };

  try {
    for (let i = 0; i < data.length; i++) {
      if (Date.now() - start > 280000) break;
      const email = String(data[i][emailIdx] || "").trim();
      const done = String(data[i][announceIdx] || "").trim();
      if (!email || done) continue;
      batch.push(email);
      batchRows.push(i);
      if (batch.length >= ANNOUNCE_BATCH) flush();
    }
    flush();
  } catch (err) {
    ui.alert("หยุดชั่วคราว: " + err.message + "\nส่งไปแล้ว " + sent + " ฉบับ ระบบจะข้ามคนที่ส่งแล้วเมื่อรันซ้ำ");
  }

  const flags = data.map(function (rw) {
    return [rw[announceIdx]];
  });
  sheet.getRange(2, REC_START_COL + announceIdx, flags.length, 1).setValues(flags);

  ui.alert("ส่งอีเมลรอบนี้ " + sent + " ฉบับ · ถ้ายังไม่ครบให้รันเมนูนี้อีกครั้ง (ระบบจะข้ามคนที่ส่งแล้ว)");
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : "";
  if (action === "init") return initialize();
  if (action === "options") return getOptions();
  return jsonOut_({ ok: true, message: "ready" });
}

function doPost(e) {
  let body = {};
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut_({ ok: false, error: "รูปแบบข้อมูลไม่ถูกต้อง" });
  }
  if (body.action === "submit") return addRecord(body.record);
  if (body.action === "init") return initialize();
  return jsonOut_({ ok: false, error: "ไม่รู้จักคำสั่ง" });
}
