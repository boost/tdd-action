# TDD Feedback Action

This GitHub Action suite adds a Test-Driven Development (TDD) feedback question to new pull requests and stores the responses in a Google Sheet upon PR closure. It helps track TDD usage and developer experiences across projects.

## Features

- Automatically adds a TDD feedback question to new pull requests
- Collects responses when a pull request is closed
- Stores feedback data in a Google Sheet for easy analysis

## Setup Instructions

### Make sure the Boost organisation has the correct secrets

In order to read and write from the [TDD Metrics Spreadsheet](https://docs.google.com/spreadsheets/d/1JxCmHpwnhe8vxGVAXP_vWxhfbDJQ4gZcpdmwVHK0tsM/edit?pli=1&gid=0#gid=0) the GitHub organistion or repository needs the following secrets:

- `GOOGLE_SHEETS_CREDENTIALS`
- `GOOGLE_SHEET_ID`

These have been added at the Boost organisation level, so you shouldn't need to do anything for this to work. If you need them for any reason, they are also stored in 1Password.

### Create Workflow Files

1. Create a new file `.github/workflows/tdd-question.yml` in your repository with the following content:

```yaml
name: Add TDD Question

on:
  pull_request:
    types: [opened]

jobs:
  add-tdd-question:
    if: github.event_name == 'pull_request' && github.event.action == 'opened'
    runs-on: boost-eks-github-runners
    
    steps:
    - name: Add TDD Question
      uses: boost/tdd-action/.github/actions/add-tdd-question@main
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
```

2. Create a new file `.github/workflows/tdd-feedback-capture.yml` in your repository with the following content:

```yaml
name: Capture TDD Feedback

on:
  pull_request:
    types: [closed]

jobs:
  store-tdd-data:
    if: github.event_name == 'pull_request' && github.event.action == 'closed' && github.event.pull_request.merged == true
    runs-on: boost-eks-github-runners

    steps:
    - name: Store TDD Data
      uses: boost/tdd-action/.github/actions/store-tdd-data@main
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
        google-credentials: ${{ secrets.GOOGLE_SHEETS_CREDENTIALS }}
        sheet-id: ${{ secrets.TDD_SHEET_ID }}
```


