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

(async () => {
    await app.start(process.env.PORT || 3000);

    console.log('Bolt app is running');
})();