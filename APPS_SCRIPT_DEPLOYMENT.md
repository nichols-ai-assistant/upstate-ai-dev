# Google Apps Script Deployment Guide

## Overview

The Google Apps Script project has been created and is ready to deploy. The script automatically receives form submissions from the AI Readiness Assessment, appends data to a Google Sheet, and sends email notifications.

## Project Details

- **Script ID**: `1MHJba5dUWLQhboUI8NYkEELA4VPHK2otxjKD_pDNdIOAUgbKuZv4mjrI`
- **Script Editor URL**: https://script.google.com/d/1MHJba5dUWLQhboUI8NYkEELA4VPHK2otxjKD_pDNdIOAUgbKuZv4mjrI/edit
- **Target Sheet**: `1xgzHu4_fDIiPgNkbuucdNunC_CtiGIu-svHyurvHDpY` (AI Readiness Assessment - Lead Submissions)
- **Notification Email**: ben@up-state-ai.com

## What the Script Does

1. **Receives** POST requests with form submission data (JSON)
2. **Appends** a row to the Google Sheet with:
   - Timestamp
   - Lead name, email, company, industry, company size
   - Assessment score (total and by dimension)
   - Tier assignment and recommended service
   - Raw answer data
3. **Sends** an email notification to ben@up-state-ai.com with lead details and assessment results
4. **Returns** JSON success/error response with CORS headers

## Data Structure Received

```json
{
  "name": "string",
  "email": "string",
  "company": "string",
  "industry": "string",
  "companySize": "string",
  "totalScore": "number (12-60)",
  "tier": "Explorer|Builder|Accelerator|Leader",
  "recommendedService": "string",
  "servicePrice": "string",
  "strongest": "string (dimension name)",
  "weakest": "string (dimension name)",
  "dimensionScores": { "dimension": score, ... },
  "answers": { "1": value, ... },
  "timestamp": "ISO 8601 timestamp"
}
```

## Deployment Steps (Manual)

### 1. Open the Script Editor

Visit: https://script.google.com/d/1MHJba5dUWLQhboUI8NYkEELA4VPHK2otxjKD_pDNdIOAUgbKuZv4mjrI/edit

Sign in with: **nichols.ai.assistant@gmail.com**

### 2. Verify the Code

You should see two files in the editor:
- **Code.js** (or Code) - The main handler script
- **appsscript.json** - The project manifest

If they're not there, copy the code from `docs/apps-script-setup.js` into Code.js and update appsscript.json to:

```json
{
  "timeZone": "America/New_York",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE_ANONYMOUS"
  }
}
```

### 3. Deploy as a Web App

1. Click **Deploy** > **New deployment**
2. Select type: **Web app**
3. Set "Execute as": **Me** (nichols.ai.assistant@gmail.com)
4. Set "Who has access": **Anyone**
5. Click **Deploy**
6. Authorize the script when prompted (grant permissions for Sheets and Gmail)
7. Copy the **Web app URL** from the deployment window

### 4. Update the Assessment Form

Replace `YOUR_APPS_SCRIPT_WEB_APP_URL` in `js/assessment.js` with the actual deployed URL.

Example:
```javascript
var APPS_SCRIPT_URL = 'https://script.google.com/macros/d/1MHJba5dUWLQhboUI8NYkEELA4VPHK2otxjKD_pDNdIOAUgbKuZv4mjrI/userweb?v=VERSION';
```

### 5. Commit and Push

```bash
git add -A
git commit -m "Deploy Apps Script and update assessment form endpoint"
git push origin main
```

## Testing

### 1. Test the Endpoint

Once deployed, test with curl:

```bash
curl -X POST "https://script.google.com/macros/d/.../userweb" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "company": "Test Co",
    "industry": "Technology",
    "companySize": "50-100",
    "totalScore": 35,
    "tier": "Builder",
    "recommendedService": "AI Audit",
    "servicePrice": "$5,000",
    "strongest": "Data Maturity",
    "weakest": "Governance & Risk",
    "dimensionScores": { "data": 8, "process": 7 },
    "answers": { "1": 3, "2": 2 },
    "timestamp": "2026-03-20T10:25:00Z"
  }'
```

Expected response:
```json
{"status": "success"}
```

### 2. Check Google Sheet

Go to the sheet at: https://docs.google.com/spreadsheets/d/1xgzHu4_fDIiPgNkbuucdNunC_CtiGIu-svHyurvHDpY

You should see a new row with the test data.

### 3. Check Email

ben@up-state-ai.com should receive an email notification with the lead details.

## Troubleshooting

### "Insufficient Permission" Error

The Apps Script needs authorization. When you first deploy, Google will prompt you to grant permissions for:
- Google Sheets (to append rows)
- Gmail (to send emails)

Click "Allow" to authorize.

### Email Not Sending

Check the Script Execution Log:
1. Open Script Editor
2. Click **Execution log** (bottom of page)
3. Look for errors from the `sendNotification()` function

Common issues:
- Ben's email address might be different
- Spam filter blocking automated emails

### No Data in Sheet

Check the Script Execution Log for errors appending rows. Verify:
- Sheet ID is correct: `1xgzHu4_fDIiPgNkbuucdNunC_CtiGIu-svHyurvHDpY`
- Sheet name is correct: `Sheet1`
- You have write access to the sheet

## GitHub Pages Staging URL

Once deployed and committed:
- Visit: https://[username].github.io/upstate-ai-dev/ai-readiness-assessment.html

The form will submit to the deployed Apps Script endpoint.

## Notes

- The Apps Script uses "Execute as me" with "Anyone" access, so anyone can submit data but data goes to the shared sheet
- No authentication is required to call the endpoint (no API key needed)
- CORS mode is set to `no-cors` in the JavaScript, so responses won't be readable by the browser
- Submissions are fire-and-forget; the form displays results immediately while the data uploads in the background
