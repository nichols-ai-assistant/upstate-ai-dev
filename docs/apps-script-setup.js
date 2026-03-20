/**
 * AI Readiness Assessment - Google Apps Script
 * 
 * Receives POST requests from the assessment form, appends data to a
 * Google Sheet, and sends an email notification to ben@up-state-ai.com.
 *
 * DEPLOYMENT:
 * 1. Go to https://script.google.com and create a new project
 * 2. Name it "AI Readiness Assessment Handler"
 * 3. Paste this entire file into Code.gs (replace default content)
 * 4. Click Deploy > New deployment
 * 5. Select type: "Web app"
 * 6. Execute as: "Me" (nichols.ai.assistant@gmail.com)
 * 7. Who has access: "Anyone"
 * 8. Click Deploy, authorize when prompted
 * 9. Copy the Web app URL and update js/assessment.js
 */

var SHEET_ID = '1xgzHu4_fDIiPgNkbuucdNunC_CtiGIu-svHyurvHDpY';
var NOTIFY_EMAIL = 'ben@up-state-ai.com';
var SHEET_NAME = 'Sheet1';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Append row to sheet
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name || '',
      data.email || '',
      data.company || '',
      data.industry || '',
      data.companySize || '',
      data.totalScore || '',
      data.tier || '',
      data.recommendedService || '',
      data.servicePrice || '',
      data.strongest || '',
      data.weakest || '',
      JSON.stringify(data.dimensionScores || {}),
      JSON.stringify(data.answers || {})
    ]);

    // Send email notification
    sendNotification(data);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
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

function sendNotification(data) {
  var tier = data.tier || 'Unknown';
  var service = data.recommendedService || 'Unknown';
  var score = data.totalScore || 0;

  var subject = 'New AI Readiness Assessment Lead: ' + (data.company || 'Unknown Company') + ' (' + tier + ' Tier)';

  var dimensionText = '';
  if (data.dimensionScores) {
    var dims = data.dimensionScores;
    for (var key in dims) {
      dimensionText += '  - ' + key + ': ' + dims[key] + '/10\n';
    }
  }

  var body = [
    'New AI Readiness Assessment submission received.',
    '',
    '--- Lead Details ---',
    'Name: ' + (data.name || ''),
    'Email: ' + (data.email || ''),
    'Company: ' + (data.company || ''),
    'Industry: ' + (data.industry || ''),
    'Company Size: ' + (data.companySize || ''),
    '',
    '--- Assessment Results ---',
    'Total Score: ' + score + '/60',
    'Tier: ' + tier,
    'Recommended Service: ' + service + ' (' + (data.servicePrice || '') + ')',
    'Strongest Dimension: ' + (data.strongest || ''),
    'Biggest Opportunity: ' + (data.weakest || ''),
    '',
    '--- Dimension Scores ---',
    dimensionText,
    '--- Next Steps ---',
    'Reach out to ' + (data.name || 'the lead') + ' at ' + (data.email || '') + ' to schedule a ' + service + '.',
    '',
    'View all submissions: https://docs.google.com/spreadsheets/d/' + SHEET_ID
  ].join('\n');

  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}
