# C.R.A.B.
## Getting Started
1. Create a Slack Bot and add it to your Slack Workspace. You can follow these instructions <a href='https://slack.dev/bolt-js/tutorial/getting-started'>here</a> from Slack's API themselves. Although feel free to skip the coding sections if you're planning on cloning our repository. Be sure to make note of the credentials (Tokens, Signing Secrets, etc.) as you will need them to run our code. One of the things to note is that our bot uses Slack's Socket Mode. There are also many additional Bot Token Scopes that we used. You can view those in the **Setup** section below.
2. Clone the repository
3. Create a .env file with the environment variables listed below in the **Setup** section below. You got these tokens from Slack when you created your Slack bot.
4. Install Node.js
5. Setup the code environment from the C.R.A.B. directory that you cloned to your local computer with `npm install`
6. Assuming everything is good, you can run the code and start up the bot with `npm start`

## Description

Slack bot for selecting random people for code review on based rotation.

## Commands

`!init`

Initialize rotation list of members to choose reviewers from

`!reviewers x`

Select x number of reviewers for code review.

Replace x with a number such as `!reviewers 2` to select 2 reviewers

`!members`

Shows all members that can be selected for code review in the current channel

`!next`

Shows all members that can be selected for code review in the current rotation

`!help`

Shows all commands for this slack bot

`!feeling-crabby`

Says a random crab joke


## Setup

Create a .env and fill in these details from your slack app:

```
SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=
SLACK_APP_TOKEN=
```

Bot token scopes used:
```
channels:history
channels:read
chat:write
groups:history
groups:read
im:history
im:read
mpim:history
mpim:read
users:read
```
