const axios = require('axios');
const dotenv = require('dotenv');

const { App } = require('@slack/bolt');

dotenv.config();

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN
});

app.message('hello', async ({ message, say}) => {
    console.log(`user: ${message.user}`);
    await say({
        blocks: [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `Hey there <@${message.user}>!`
            },
            "accessory": {
              "type": "button",
              "text": {
                "type": "plain_text",
                "text": "Click Me"
              },
              "action_id": "button_click"
            }
          }
        ],
        text: `Hey there <@${message.user}>!`
    });
});
    
app.action('button_click', async ({ body, ack, say }) => {
    // Acknowledge the action
    await ack();
    await say(`<@${body.user.id}> clicked the button`);
});
    

app.message('sleep', async ({ message, say}) => {
    await say(`Sleep now <@${message.user}>!`);
});

app.message('members', async ({message, say}) => {
    const members_res = await app.client.conversations.members({
        channel: message.channel
    });
    console.log(members_res);
    const members = members_res.members;
    members.splice(members.indexOf(message.user), 1);
    await say(`Members are: `);
    for (elem of members_res.members) {
        await say(`<@${elem}>`);
    }
});

app.message('Confirm', async({message, client, logger}) => {
  try {
      const {channel, ts} = message;
      const confirmText = `Please confirm that these members are available for code review. Otherwise, reroll another combination! <@${message.user}>`
      const result = await client.chat.postEphemeral({
          channel,
          blocks: [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": confirmText,
              }
            },
            {
              "type": "section",
              "fields": [
                {
                  "type": "mrkdwn",
                  "text": "*Sample:*\nField"
                },
              ],
            },
            {
              "type": "actions",
              "elements": [
                {
                  "type": "button",
                  "text": {
                    "type": "plain_text",
                    "emoji": true,
                    "text": "Approve"
                  },
                  "style": "primary",
                  "value": channel+':'+message.user,
                  "action_id": "confirm_approve"
                },
                {
                  "type": "button",
                  "text": {
                    "type": "plain_text",
                    "emoji": true,
                    "text": "Deny"
                  },
                  "style": "danger",
                  "value": channel+':'+message.user,
                  "action_id": "confirm_deny"
                },
                {
                  "type": "button",
                  "text": {
                    "type": "plain_text",
                    "emoji": true,
                    "text": "Reroll 🎲"
                  },
                  "value": channel+':'+message.user,
                  "action_id": "confirm_reroll"
                },
              ]
            }
          ],
          user: message.user
      });
      logger.info(result);
  }
  catch (error) {
      logger.error(error);
  }
});

app.action('confirm_approve', async ({ body, ack, say, client}) => {
  // Acknowledge the action
  try {
    await ack();
    // console.log(body.actions[0]);
    const params = body.actions[0].value.split(':');
    // console.log(params);
    await client.chat.postEphemeral({
      channel: params[0],
      user: params[1],
      text: `Approve!`
    });
  } catch (error) {
    console.log(error);
  }
  // await say(`Approved <@${body.user.id}>!`);
});

app.action('confirm_deny', async ({ body, ack, say, client}) => {
  // Acknowledge the action
  await ack();
  const params = body.actions[0].value.split(':');
  // console.log(params);
  await client.chat.postEphemeral({
    channel: params[0],
    user: params[1],
    text: `Deny!`
  });
  // await say(`Deny <@${body.user.id}>!`);
});

app.action('confirm_reroll', async ({ body, ack, say, client }) => {
  // Acknowledge the action
  await ack();
  const params = body.actions[0].value.split(':');
  // console.log(params);
  await client.chat.postEphemeral({
    channel: params[0],
    user: params[1],
    text: `Reroll!`
  });
  // await say(`Reroll <@${body.user.id}>!`);
});

app.message('!reviewers', async ({message, say}) => {
  const membersRes = await app.client.conversations.members({
      channel: message.channel
  });
  console.log(message.text);
  console.log(membersRes);

  const regex = /\d+$/;
  try {
    const messageMatch = message.text.match(regex)[0];
    console.log(message.text.match(regex));

    const membersNum = parseInt(messageMatch);
    console.log(membersNum);
    if (membersNum < 1) {
      await say('Please input a number greater than 0');
      return;
    }

    const members = membersRes.members;

    if (membersNum > members.length) {
      await say('Number of reviewers to select is higher than the members count');
      return;
    }

    members.splice(members.indexOf(message.user), 1);
    await say(`Random members: `);
    for (let i=0; i<membersNum; i++) {
      const rand = Math.floor(Math.random()*members.length);
      await say(`<@${members[rand]}>`);
      members.splice(rand, 1);
    }

    await say({
      blocks: [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `Do you wish to reroll <@${message.user}>?`
          },
          "accessory": {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "Reroll"
            },
            "action_id": "reroll_click"
          }
        }
      ],
      text: `Do you wish to reroll <@${message.user}>?`
  });
}
catch (err) {
  say('Please input number of reviewers to select');
}
});

app.action('reroll_click', async ({ body, ack, say }) => {
// Acknowledge the action
await ack();
await say(`<@${body.user.id}> rerolled!`);
});

(async () => {
    await app.start(process.env.PORT || 3000);

    console.log('Bolt app is running');
})();