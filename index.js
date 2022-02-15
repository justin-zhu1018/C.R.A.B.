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

app.message('!reviewers', async ({message, say}) => {
    const membersRes = await app.client.conversations.members({
        channel: message.channel
    });
    console.log(message.text);
    console.log(membersRes);

    const regex = /\d$/;

    const messageMatch = message.text.match(regex)[0];
    if (!messageMatch) {
      await say('Please input a number of reviewers to select');
      return;
    }

    const membersNum = parseInt(messageMatch);
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
});

(async () => {
    await app.start(process.env.PORT || 3000);

    console.log('Bolt app is running');
})();