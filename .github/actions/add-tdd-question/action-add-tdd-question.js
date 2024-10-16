const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const token = core.getInput('github-token', { required: true });
    const octokit = github.getOctokit(token);

    const { owner, repo } = github.context.repo;
    const issue_number = github.context.issue.number;

    const questionBody = "## Test Driven Development Feedback \n\n Was any Test-Driven Development (TDD) used while working on this pull request? \n\n - [ ] Yes \n - [ ] No \n - [ ] Doesn't apply \n\n Share your experience with TDD on this PR. Did you encounter any challenges or find it particularly helpful? \n\n *Insert feedback here*";

    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number,
      body: questionBody
    });

    console.log('TDD question added successfully.');
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();