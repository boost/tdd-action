const fetch = require('node-fetch');
const { google } = require('googleapis');

(async () => {
  const prNumber = process.env.GITHUB_PR_NUMBER;
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;

  // Fetch all comments on the pull request
  const response = await fetch(`https://api.github.com/repos/${repo}/issues/${prNumber}/comments`, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  const comments = await response.json();

  // Find the comment with TDD feedback
  const tddComment = comments.find(comment => comment.body.includes('Was any Test-Driven Development (TDD) used while working on this pull request?'));

  let tddResponse = '';
  let feedback = '';

  if (tddComment) {
    const commentBody = tddComment.body;

    // Parse the TDD response
    if (commentBody.includes('[x] Yes')) {
      tddResponse = 'Yes';
    } else if (commentBody.includes('[x] No')) {
      tddResponse = 'No';
    } else if (commentBody.includes('[x] Doesn\'t apply')) {
      tddResponse = 'Doesn\'t apply';
    }

    const feedbackArray = commentBody.split(/Did you encounter any challenges or find it particularly helpful\?[\s\n]*/);
    feedback = feedbackArray[1] ? feedbackArray[1].trim() : 'No feedback provided';
  }

  // Convert the closed date to New Zealand Time (NZT) and format as dd-mm-YYYY
  const closedAtUTC = new Date(process.env.GITHUB_CLOSED_AT);
  const closedAtNZT = new Intl.DateTimeFormat('en-NZ', {
    timeZone: 'Pacific/Auckland',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(closedAtUTC);

  // Format as dd-mm-YYYY (Intl.DateTimeFormat defaults to mm/dd/YYYY)
  const [month, day, year] = closedAtNZT.split('/');
  const formattedClosedDate = day + '-' + month + '-' + year;

  // Store the response and feedback in Google Sheets
  const sheets = google.sheets('v4');
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const authClient = await auth.getClient();
  const sheetId = process.env.SHEET_ID;

  const request = {
    spreadsheetId: sheetId,
    range: 'PR Data!A1',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [
        [
          process.env.GITHUB_REPOSITORY,         // Repository
          process.env.GITHUB_PR_NUMBER,          // PR Number
          formattedClosedDate,                   // PR Closed Date
          process.env.GITHUB_ACTOR,              // Opened By
          tddResponse,                           // TDD Used?
          feedback                               // Comment
        ]
      ]
    },
    auth: authClient,
  };

  await sheets.spreadsheets.values.append(request);
  console.log('Data appended to Google Sheets successfully.');
})();
