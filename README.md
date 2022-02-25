# C.R.A.B.
## Description
Slack bot for selecting random people for code review on based rotation.

## Getting Started
1. Create a Slack Bot and add it to your Slack Workspace. You can follow these instructions <a href='https://slack.dev/bolt-js/tutorial/getting-started'>here</a> from Slack's API themselves. Although feel free to skip the coding sections if you're planning on cloning our repository. Be sure to make note of the credentials (Tokens, Signing Secrets, etc.) as you will need them to run our code. One of the things to note is that our bot uses Slack's Socket Mode. There are also many additional Bot Token Scopes that we used. You can view those in the **Setup** section below.
2. Clone the repository.
3. Create a .env file with the environment variables listed below in the **Setup** section below. You got these tokens from Slack when you created your Slack bot.
4. Install Node.js. You can use the official link <a href='https://nodejs.org/en/'>here</a>.
5. Setup the code environment from the C.R.A.B. directory that you cloned to your local computer with `npm install`.
6. Assuming everything is good, you can run the code and start up the bot with `npm start`.
7. In order to interact with the bot via Slack, you will have to make sure you invite the bot to your Slack Workspace and the desired text channel.

## General Workflow
Assuming you have the bot set up and invited to your Slack Workspace/text channel, feel free to reference the general workflow for using our bot below:
1. Invite all code reviewers to the text channel (that you have your Slack bot in).
2. Use the `!help` command to familiarize yourself with the commands.
3. Going down the `!help` commands list, start by using `!init`. This will initialize the bot to load all human/non-bot members into the code review rotation.
4. From here, you're pretty much ready to start your code review selections. Do this with the `!reviewers x` command, where x is the number of reviewers you would like to assign for a code review. Assuming you have entered a valid number, the bot will start the process via a thread that is linked to your initial `!reviewers x` message.
5. Follow the prompts provided by the bot and decide if the proposed selection is okay. If not, either 'Cancel' the selection or 'Reroll' until you are able to come to a decision. Note that this prompt is only visible to you. A public message will be sent by the bot to announce your selection once you decide to 'Approve' it.
6. That's the basics of it! As for the rest of the commands, `!members` is used to show all the members available for a code review (basically all human users in the text channel), `!next` is used to show all members who have not done a code review this rotation (rotation resets once every member has done at least one  code review), and `!feeling-crabby` is a command that you can try for yourself :)

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
