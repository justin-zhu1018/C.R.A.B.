# C.R.A.B.

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
