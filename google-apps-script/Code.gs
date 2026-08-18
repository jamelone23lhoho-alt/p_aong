const DB_SHEET = "_database";
const TZ = "Asia/Bangkok";

const OPT_START_COL = 1;
const OPT_COLS = 2;
const REC_START_COL = 4;
const REC_COLS = 12;

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
  "เวลาเช็คอิน"
];

const DEFAULT_TIERS = ["STANDARD", "GOLD", "PLATINUM"];
const DEFAULT_ROLES = ["ผู้เข้าพักหลัก", "ผู้เข้าร่วมพัก"];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("ระบบลงทะเบียน")
    .addItem("Initialize ชีท", "initialize")
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
  sheet
    .getRange(1, OPT_START_COL, optBlock.length, OPT_COLS)
    .setValues(optBlock);

  sheet
    .getRange(1, REC_START_COL, 1, REC_COLS)
    .setValues([REC_HEADERS.slice()]);

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
      r.checkinTime || ""
    ],
    REC_COLS
  );

  sheet.getRange(target, REC_START_COL, 1, REC_COLS).setValues([row]);

  return jsonOut_({ ok: true, row: target });
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
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
