const DB_SHEET = "_database";
const TZ = "Asia/Bangkok";

const OPT_START_COL = 1;
const OPT_COLS = 2;
const REC_START_COL = 4;
const REC_COLS = 15;

const EVENT_NAME = "Energy on the Rocks · Tamca Night Party";
const SEND_CONFIRMATION = true;
const CHECKIN_PIN = "1150";

const MAILGUN_DOMAIN = "javaoutrunners.com";
const MAILGUN_REGION = "us";
const MAIL_FROM = "temcaparty@javaoutrunners.com";
const MAIL_FROM_NAME = "TemcaParty";
const REPLY_TO = "temcaparty@gmail.com";

const QR_API = "https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=";
const BANNER_URL = "https://raw.githubusercontent.com/jamelone23lhoho-alt/p_aong/main/public/assets/email-banner.jpg";
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
  "สถานะส่งประกาศ",
  "เวลาสแกนเข้างาน"
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
    from: MAIL_FROM_NAME ? MAIL_FROM_NAME + " <" + MAIL_FROM + ">" : MAIL_FROM,
    to: recipients.join(","),
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
  const code = r.cardNo + "-" + token;
  const qr = QR_API + encodeURIComponent(code);
  return (
    '<div style="margin:0;padding:0;background:#eef1f4;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f4;padding:0 0 26px;"><tr><td align="center">' +
    '<table role="presentation" width="460" cellpadding="0" cellspacing="0" style="max-width:460px;width:100%;background:#ffffff;border-radius:0 0 16px 16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">' +
    '<tr><td style="padding:0;"><img src="' + BANNER_URL + '" width="460" style="display:block;width:100%;height:auto;border:0;" alt="Energy on the Rocks"/></td></tr>' +
    '<tr><td align="center" style="padding:28px 24px 6px;"><div style="font-size:24px;font-weight:bold;color:#2fbf71;">Registration Success !</div></td></tr>' +
    '<tr><td align="center" style="padding:2px 24px 4px;"><div style="font-size:18px;color:#1f6fb2;"><b>Welcome</b>, you are registered of :</div></td></tr>' +
    '<tr><td align="center" style="padding:14px 24px 2px;"><div style="font-size:18px;font-weight:bold;color:#1a2330;">TEMCA NIGHT PARTY 2026</div></td></tr>' +
    '<tr><td align="center" style="padding:6px 24px 2px;"><div style="font-size:15px;color:#3a4653;line-height:1.7;">22 August 2026 18:00-22:00<br/>Garden in the Sky ( Hall 1 )</div></td></tr>' +
    '<tr><td align="center" style="padding:12px 24px 2px;"><div style="font-size:13px;color:#8b93a0;">บัตรเลขที่ ' + r.cardNo + " · " + r.tier + '</div></td></tr>' +
    '<tr><td align="center" style="padding:16px 24px 8px;"><img src="' + qr + '" width="180" height="180" style="display:block;border:0;" alt="QR"/></td></tr>' +
    '<tr><td align="center" style="padding:2px 24px 4px;"><div style="font-size:13px;color:#3a4653;">Your reference <b>ID : ' + code + '</b></div></td></tr>' +
    '<tr><td align="center" style="padding:10px 24px 28px;"><div style="font-size:16px;font-weight:bold;color:#1a2330;">' + r.firstName + " " + r.lastName + '</div></td></tr>' +
    '</table></td></tr></table></div>'
  );
}

function sendConfirmation_(r, token) {
  if (!SEND_CONFIRMATION) return;
  try {
    mailgunSend_([String(r.email).trim()], "Temca Night Party", confirmationHtml_(r, token));
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

function checkin(code, pin) {
  if (String(pin || "") !== CHECKIN_PIN) return jsonOut_({ ok: false, error: "PIN ไม่ถูกต้อง" });

  const raw = String(code || "").trim();
  const dash = raw.indexOf("-");
  if (dash < 1) return jsonOut_({ ok: true, result: "invalid" });
  const cardNo = raw.slice(0, dash).trim();
  const token = raw.slice(dash + 1).trim();

  const sheet = getDbSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonOut_({ ok: true, result: "invalid" });

  const data = sheet.getRange(2, REC_START_COL, lastRow - 1, REC_COLS).getValues();
  const cardIdx = 1, tierIdx = 2, firstIdx = 3, lastIdx = 4, roleIdx = 5, hotelIdx = 9, tokenIdx = 12, scanIdx = 14;

  for (let i = 0; i < data.length; i++) {
    if (String(data[i][cardIdx]).trim() === cardNo && String(data[i][tokenIdx]).trim() === token) {
      const out = {
        ok: true,
        cardNo: cardNo,
        tier: data[i][tierIdx],
        name: (data[i][firstIdx] + " " + data[i][lastIdx]).trim(),
        role: data[i][roleIdx],
        hotel: data[i][hotelIdx]
      };
      const existing = String(data[i][scanIdx] || "").trim();
      if (existing) {
        out.result = "already";
        out.at = existing;
        return jsonOut_(out);
      }
      const now = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd HH:mm:ss");
      sheet.getRange(2 + i, REC_START_COL + scanIdx, 1, 1).setValue(now);
      out.result = "success";
      out.at = now;
      return jsonOut_(out);
    }
  }
  return jsonOut_({ ok: true, result: "invalid" });
}

function stats(pin) {
  if (String(pin || "") !== CHECKIN_PIN) return jsonOut_({ ok: false, error: "PIN ไม่ถูกต้อง" });
  const sheet = getDbSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonOut_({ ok: true, total: 0, checkedIn: 0 });

  const data = sheet.getRange(2, REC_START_COL, lastRow - 1, REC_COLS).getValues();
  const cardIdx = 1, scanIdx = 14;
  let total = 0;
  let checkedIn = 0;
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][cardIdx]).trim() === "") continue;
    total++;
    if (String(data[i][scanIdx] || "").trim()) checkedIn++;
  }
  return jsonOut_({ ok: true, total: total, checkedIn: checkedIn });
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : "";
  if (action === "init") return initialize();
  if (action === "options") return getOptions();
  if (action === "checkin") return checkin(e.parameter.code, e.parameter.pin);
  if (action === "stats") return stats(e.parameter.pin);
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
