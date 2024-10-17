const core = require('@actions/core');
const github = require('@actions/github');
const { google } = require('googleapis');

async function run() {
  try {
    const token = core.getInput('github-token', { required: true });
    const sheetId = core.getInput('sheet-id', { required: true });
    const googleCredentials = core.getInput('google-credentials', { required: true });

    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;
    const pull_number = github.context.payload.pull_request.number;

    // Fetch all comments on the pull request
    const { data: comments } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: pull_number,
    });

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
    const closedAtUTC = new Date(github.context.payload.pull_request.closed_at);
    const closedAtNZT = new Intl.DateTimeFormat('en-NZ', {
      timeZone: 'Pacific/Auckland',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(closedAtUTC);

    // Format as dd-mm-YYYY
    const [day, month, year] = closedAtNZT.split('/');
    const formattedClosedDate = `${day}/${month}/${year}`;

    // Store the response and feedback in Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(googleCredentials),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'PR Data!A1',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [
          [
            `${owner}/${repo}`,
            pull_number,
            formattedClosedDate,
            github.context.payload.pull_request.user.login,
            tddResponse,
            feedback
          ]
        ]
      }
    });

    console.log('Data appended to Google Sheets successfully.');
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();