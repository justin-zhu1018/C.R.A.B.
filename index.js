const axios = require('axios');
const dotenv = require('dotenv');

const { App } = require('@slack/bolt');

dotenv.config();

let members_dict = new Map();
let cr_dict = new Map();
let cr_temp_dict = new Map();

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN
});

const update_members = (channel_id, members_list) => {
  members_dict.set(channel_id, members_list);
}
const update_cr = (channel_id, members_list) => {
  cr_dict.set(channel_id, members_list);
}

const clear_temp = (channel_id) => {
  cr_temp_dict.set(channel_id, []);
}

app.message('!initialize', async ({ message, say}) => {
  const members_res = await app.client.conversations.members({
      channel: message.channel
  });
  // console.log(members_res);
  const channel_id = message.channel;
  const members = members_res.members;
  update_members(channel_id, members);
  update_cr(channel_id, members);
  await say(`Members are: `);
  for (elem of members_dict.get(channel_id)) {
      await say(`<@${elem}>`);
  } 
});

app.message('!members', async ({ message, say}) => {
  await say(`Members are: `);
  const channel_id = message.channel;
  const members = members_dict.get(channel_id);
  for (elem of members) {
      await say(`<@${elem}>`);
  }
});

app.message('!next', async ({ message, say}) => {
  await say(`Remaining available code reviewers are: `);
  const channel_id = message.channel;
  const members = cr_dict.get(channel_id);
  for (elem of members) {
      await say(`<@${elem}>`);
  }
});

app.message('!reviewers', async ({message, say}) => {
  const channel = message.channel;
  let members = cr_dict.get(channel).slice();
  const total_max_members = members_dict.get(channel).length;
  const regex = /\d+$/;
  let membersNum;
  try {
    const messageMatch = message.text.match(regex)[0];
    // console.log(message.text.match(regex));

    membersNum = parseInt(messageMatch);
    if (membersNum < 1) {
      await say('Please input a number greater than 0');
      return;
    }

    if (membersNum > total_max_members) {
      await say('Number of reviewers to select is higher than the members count');
      return;
    }
  }
  catch (err) {
    say('Please input number of reviewers to select');
  }
  
  const groupSize = membersNum;
  clear_temp(channel);
  
  while(membersNum > 0) {
    if(members.length == 0) {
      const all_members = members_dict.get(channel).slice();
      console.log(all_members);
      const rand = Math.floor(Math.random()*all_members.length);
      const member = all_members.splice(rand, 1)[0]; 
      console.log(member);
      if(!(member in cr_temp_dict.get(channel))) {
        cr_temp_dict.get(channel).push(member);
        membersNum--;
      }
      else {
        continue;
      }
    } else {
      const rand = Math.floor(Math.random()*members.length);
      const member = members.splice(rand, 1)[0]; 
      cr_temp_dict.get(channel).push(member);
      membersNum--;
    }
  }
  const reviewers = cr_temp_dict.get(channel);
  const confirmText = `Please confirm that these members are available for code review. Otherwise, reroll another combination! <@${message.user}>`;
  let reviewersText = "*Code Reviewers*\n";
  for(let i = 0; i < reviewers.length; i++) {
    reviewersText = reviewersText.concat(`<@${reviewers[i]}>\n`);
  }
  const result = await say({
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
            "text": reviewersText,
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
              "text": "Cancel"
            },
            "style": "danger",
            "value": channel+':'+message.user,
            "action_id": "confirm_cancel"
          },
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Reroll 🎲"
            },
            "value": groupSize+"",
            "action_id": "confirm_reroll"
          },
        ]
      }
    ]
  });
});

app.action('confirm_approve', async ({ body, ack, say, client}) => {
  // Acknowledge the action
  const channel = body.container.channel_id;
  const reviewers = cr_temp_dict.get(channel);
  try {
    await ack();
    // Start: If after approving and cr_dict is empty, refresh it with all members and let it get filtered by cr_temp_dict
    if(cr_dict.get(channel).length == 0) {
      const members = members_dict.get(channel);
      update_cr(channel, members);
    }
    // End
    let message = "*Selected Code Reviewers*\n";
    for(let i = 0; i < reviewers.length; i++) {
      const reviewer = reviewers[i];
      message = message.concat(`<@${reviewer}>\n`);
      const filtered_array = cr_dict.get(channel).filter(item => !reviewer.includes(item));
      update_cr(channel, filtered_array);
    }
    await say(message);
    // Start Edge Case: If all members participated in the CR, dictionary will be empty, so refresh.
    if(cr_dict.get(channel).length == 0) {
      const members = members_dict.get(channel);
      update_cr(channel, members);
    }
    // End
  } catch (error) {
    console.log(error);
  }
  // await say(`Approved <@${body.user.id}>!`);
});

app.action('confirm_cancel', async ({ body, ack, say, client}) => {
  // Acknowledge the action
  await ack();
  const params = body.actions[0].value.split(':'); 
  clear_temp(body.container.channel_id);
  await say(`C.R.A.B. cancelling`);
});

app.action('confirm_reroll', async ({ body, ack, say, client }) => {
  // Acknowledge the action
  await ack();

  console.log(body);
  // Start of copy of reviewers method
  const channel = body.container.channel_id;
  let members = cr_dict.get(channel).slice();
  let membersNum = parseInt(body.actions[0].value);
  const groupSize = membersNum;

  clear_temp(channel);
  
  while(membersNum > 0) {
    if(members.length == 0) {
      const all_members = members_dict.get(channel).slice();
      console.log(all_members);
      const rand = Math.floor(Math.random()*all_members.length);
      const member = all_members.splice(rand, 1)[0]; 
      console.log(member);
      if(!(member in cr_temp_dict.get(channel))) {
        cr_temp_dict.get(channel).push(member);
        membersNum--;
      }
      else {
        continue;
      }
    } else {
      const rand = Math.floor(Math.random()*members.length);
      const member = members.splice(rand, 1)[0]; 
      cr_temp_dict.get(channel).push(member);
      console.log("Temp: " + cr_temp_dict.get(channel));
      membersNum--;
    }
  }
  const reviewers = cr_temp_dict.get(channel);
  const confirmText = `Please confirm that these members are available for code review. Otherwise, reroll another combination!`;
  let reviewersText = "*Code Reviewers*\n";
  for(let i = 0; i < reviewers.length; i++) {
    reviewersText = reviewersText.concat(`<@${reviewers[i]}>\n`);
  }
  const result = await say({
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
            "text": reviewersText,
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
            "value": "placeholder",
            "action_id": "confirm_approve"
          },
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Cancel"
            },
            "style": "danger",
            "value": "placeholder",
            "action_id": "confirm_cancel"
          },
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Reroll 🎲"
            },
            "value": groupSize+"",
            "action_id": "confirm_reroll"
          },
        ]
      }
    ]
  });
});

app.message('!feeling-crabby', async ({ message, say}) => {
  await say(`*Insert crab joke here*`);
});

(async () => {
    await app.start(process.env.PORT || 3000);

    console.log('Bolt app is running');
})();