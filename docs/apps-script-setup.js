/**
 * ============================================================
 *  Upstate AI - AI Readiness Assessment: Google Apps Script
 * ============================================================
 *
 *  PURPOSE:
 *  This script acts as a web app endpoint for the AI Readiness
 *  Assessment form on up-state-ai.com. It receives POST requests
 *  from the static site, logs submissions to a Google Sheet, and
 *  sends an email notification to ben@up-state-ai.com.
 *
 *  SETUP INSTRUCTIONS:
 *
 *  1. Go to https://script.google.com and create a new project.
 *     Name it "AI Readiness Assessment" or similar.
 *
 *  2. Delete the default Code.gs contents and paste this entire
 *     file's contents into Code.gs.
 *
 *  3. Update the SHEET_ID constant below with your Google Sheet ID.
 *     To get the Sheet ID:
 *       a. Create a new Google Sheet (or use an existing one).
 *       b. The ID is in the URL:
 *          https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
 *       c. Make sure the first sheet (tab) is named "Submissions"
 *          (the script will create headers automatically on first run).
 *
 *  4. Deploy as a web app:
 *       a. Click Deploy > New deployment
 *       b. Select type: Web app
 *       c. Description: "AI Readiness Assessment v1"
 *       d. Execute as: Me (your Google account)
 *       e. Who has access: Anyone
 *       f. Click Deploy
 *       g. Authorize the app when prompted (review permissions)
 *       h. Copy the Web app URL
 *
 *  5. Paste the Web app URL into the assessment.js file:
 *     Replace 'YOUR_APPS_SCRIPT_WEB_APP_URL' with the URL.
 *     The URL looks like:
 *     https://script.google.com/macros/s/AKfycb.../exec
 *
 *  6. Commit and push the updated assessment.js.
 *
 *  UPDATING THE SCRIPT:
 *  If you change the script, you must create a NEW deployment
 *  (Deploy > Manage deployments > Edit > New version) for changes
 *  to take effect. The URL stays the same if you edit the existing
 *  deployment.
 *
 *  TESTING:
 *  After deploying, you can test with curl:
 *
 *    curl -L -X POST \
 *      -H "Content-Type: application/json" \
 *      -d '{"name":"Test User","email":"test@example.com","company":"Test Corp","industry":"Manufacturing","companySize":"10-50 employees","totalScore":35,"tier":"Builder","recommendedService":"AI Audit","servicePrice":"$5,000","strongest":"Data Maturity","weakest":"Governance & Risk","dimensionScores":{"Data Maturity":7,"Process Documentation":6,"Technology Infrastructure":6,"Leadership & Strategy":5,"Workforce Readiness":6,"Governance & Risk":5},"answers":{"1":4,"2":3,"3":3,"4":3,"5":3,"6":3,"7":3,"8":2,"9":3,"10":3,"11":3,"12":2},"timestamp":"2026-03-20T12:00:00Z"}' \
 *      'YOUR_APPS_SCRIPT_WEB_APP_URL'
 *
 * ============================================================
 */

// ---- CONFIGURATION ----
var SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';
var NOTIFICATION_EMAIL = 'ben@up-state-ai.com';
var SHEET_NAME = 'Submissions';

// ---- WEB APP ENTRY POINTS ----

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    appendToSheet(data);
    sendNotificationEmail(data);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('doPost error: ' + err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'AI Readiness Assessment endpoint is live.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- SHEET LOGGING ----

function appendToSheet(data) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // Add headers if sheet is empty
  if (sheet.getLastRow() === 0) {
    var headers = [
      'Timestamp',
      'Name',
      'Email',
      'Company',
      'Industry',
      'Company Size',
      'Total Score',
      'Tier',
      'Recommended Service',
      'Service Price',
      'Strongest Dimension',
      'Weakest Dimension',
      'Data Maturity',
      'Process Documentation',
      'Technology Infrastructure',
      'Leadership & Strategy',
      'Workforce Readiness',
      'Governance & Risk',
      'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6',
      'Q7', 'Q8', 'Q9', 'Q10', 'Q11', 'Q12'
    ];
    sheet.appendRow(headers);

    // Bold and freeze header row
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  var dimScores = data.dimensionScores || {};
  var answers = data.answers || {};

  var row = [
    data.timestamp || new Date().toISOString(),
    data.name || '',
    data.email || '',
    data.company || '',
    data.industry || '',
    data.companySize || '',
    data.totalScore || 0,
    data.tier || '',
    data.recommendedService || '',
    data.servicePrice || '',
    data.strongest || '',
    data.weakest || '',
    dimScores['Data Maturity'] || 0,
    dimScores['Process Documentation'] || 0,
    dimScores['Technology Infrastructure'] || 0,
    dimScores['Leadership & Strategy'] || 0,
    dimScores['Workforce Readiness'] || 0,
    dimScores['Governance & Risk'] || 0,
    answers['1'] || 0, answers['2'] || 0,
    answers['3'] || 0, answers['4'] || 0,
    answers['5'] || 0, answers['6'] || 0,
    answers['7'] || 0, answers['8'] || 0,
    answers['9'] || 0, answers['10'] || 0,
    answers['11'] || 0, answers['12'] || 0
  ];

  sheet.appendRow(row);
}

// ---- EMAIL NOTIFICATION ----

function sendNotificationEmail(data) {
  var tierEmoji = {
    'Explorer': '\uD83E\uDDED',
    'Builder': '\uD83D\uDD27',
    'Accelerator': '\uD83D\uDE80',
    'Leader': '\u2B50'
  };

  var emoji = tierEmoji[data.tier] || '';
  var subject = emoji + ' New Assessment: ' + (data.name || 'Unknown') + ' at ' + (data.company || 'Unknown') + ' (' + (data.tier || '?') + ' - ' + (data.totalScore || '?') + '/60)';

  var dimScores = data.dimensionScores || {};
  var dimBreakdown = '';
  var dims = ['Data Maturity', 'Process Documentation', 'Technology Infrastructure', 'Leadership & Strategy', 'Workforce Readiness', 'Governance & Risk'];
  dims.forEach(function(dim) {
    var score = dimScores[dim] || 0;
    var bar = '';
    for (var i = 0; i < score; i++) bar += '\u2588';
    for (var j = score; j < 10; j++) bar += '\u2591';
    dimBreakdown += '  ' + dim + ': ' + bar + ' ' + score + '/10\n';
  });

  var body = '--- NEW AI READINESS ASSESSMENT ---\n\n' +
    'LEAD INFO\n' +
    '  Name:         ' + (data.name || '') + '\n' +
    '  Email:        ' + (data.email || '') + '\n' +
    '  Company:      ' + (data.company || '') + '\n' +
    '  Industry:     ' + (data.industry || '') + '\n' +
    '  Company Size: ' + (data.companySize || '') + '\n\n' +
    'RESULTS\n' +
    '  Score:        ' + (data.totalScore || 0) + '/60\n' +
    '  Tier:         ' + emoji + ' ' + (data.tier || '') + '\n' +
    '  Strongest:    ' + (data.strongest || '') + '\n' +
    '  Weakest:      ' + (data.weakest || '') + '\n\n' +
    'DIMENSION BREAKDOWN\n' +
    dimBreakdown + '\n' +
    'RECOMMENDED SERVICE\n' +
    '  ' + (data.recommendedService || '') + ' (Starting at ' + (data.servicePrice || '') + ')\n\n' +
    'SALES SIGNAL\n';

  // Add sales signal based on tier
  if (data.tier === 'Explorer' || data.tier === 'Builder') {
    body += '  Workshop/Audit funnel. Lower tier = focus on education and foundation.\n';
  } else {
    body += '  Execution/Advisory funnel. Higher tier = ready for project work.\n';
  }

  body += '\n  Tier + Industry + Size = Qualification signal for outreach prioritization.\n\n' +
    'Submitted: ' + (data.timestamp || new Date().toISOString()) + '\n' +
    '---\n';

  MailApp.sendEmail({
    to: NOTIFICATION_EMAIL,
    subject: subject,
    body: body
  });
}
