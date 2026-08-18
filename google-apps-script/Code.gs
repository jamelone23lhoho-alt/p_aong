const DB_SHEET = "_database";
const TZ = "Asia/Bangkok";

const OPT_START_COL = 1;
const OPT_COLS = 2;
const REC_START_COL = 4;
const REC_COLS = 14;

const EVENT_NAME = "Booth Crew Night";
const SEND_CONFIRMATION = true;
const QR_API = "https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=";

const ANNOUNCE_SUBJECT = "อัปเดตงานปาร์ตี้ Booth Crew Night";
const ANNOUNCE_HTML =
  "<div style='font-family:Arial,sans-serif;font-size:15px;color:#1f1a26;line-height:1.7'>" +
  "<p>สวัสดีทีมงานทุกคน</p>" +
  "<p>รายละเอียดงานปาร์ตี้อัปเดตแล้ว โปรดตรวจสอบวันเวลาและสถานที่อีกครั้ง แล้วเจอกันในงาน</p>" +
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
    .addItem("ส่งอีเมลประกาศถึงทุกคน", "sendAnnouncement")
    .addToUi();
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

function sendConfirmation_(r, token) {
  if (!SEND_CONFIRMATION) return;
  try {
    const qr = QR_API + encodeURIComponent(r.cardNo + "-" + token);
    const html =
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
      "</div>";
    MailApp.sendEmail({
      to: String(r.email).trim(),
      subject: "ยืนยันการลงทะเบียน " + EVENT_NAME + " · บัตร " + r.cardNo,
      htmlBody: html
    });
  } catch (err) {}
}

function sendAnnouncement() {
  const sheet = getDbSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert("ยังไม่มีข้อมูลผู้ลงทะเบียน");
    return;
  }

  const rows = lastRow - 1;
  const data = sheet.getRange(2, REC_START_COL, rows, REC_COLS).getValues();
  const emailIdx = 7;
  const announceIdx = 13;

  const start = Date.now();
  let quota = MailApp.getRemainingDailyQuota();
  let sent = 0;

  for (let i = 0; i < data.length; i++) {
    const email = String(data[i][emailIdx] || "").trim();
    const done = String(data[i][announceIdx] || "").trim();
    if (!email || done) continue;
    if (quota <= 0 || Date.now() - start > 300000) break;
    try {
      MailApp.sendEmail({ to: email, subject: ANNOUNCE_SUBJECT, htmlBody: ANNOUNCE_HTML });
      data[i][announceIdx] = "sent " + Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd");
      quota--;
      sent++;
    } catch (err) {}
  }

  const flags = data.map((r) => [r[announceIdx]]);
  sheet.getRange(2, REC_START_COL + announceIdx, flags.length, 1).setValues(flags);

  SpreadsheetApp.getUi().alert(
    "ส่งอีเมลรอบนี้ " + sent + " ฉบับ · โควตาคงเหลือวันนี้ " + MailApp.getRemainingDailyQuota() + "\nถ้ายังไม่ครบ ให้รันเมนูนี้อีกครั้งในวันถัดไป"
  );
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
