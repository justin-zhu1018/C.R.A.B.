import dotenv from 'dotenv';
import { jokes } from "./crab-jokes.js";
import slackBolt from '@slack/bolt';

const { App } = slackBolt;

dotenv.config();

let members_dict = new Map();
let next_dict = new Map();
let temp_dict = new Map();

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN
});

const update_members_dict = (channel_id, members_list) => {
  members_dict.set(channel_id, members_list);
}
const update_next_dict = (channel_id, members_list) => {
  next_dict.set(channel_id, members_list);
}

const clear_temp_dict = (channel_id) => {
  temp_dict.set(channel_id, []);
}

app.message('!init', async ({ message, say}) => {
  const members_res = await app.client.conversations.members({
      channel: message.channel
  });
  // console.log(members_res);
  let filteredMemberList = [];
  members_res.members.forEach(async e => {
    const res = await app.client.users.info({user: e});
    // if(!res.user.is_bot)
      filteredMemberList.push(e);
  });
  const channel_id = message.channel;
  const members = filteredMemberList;
  update_members_dict(channel_id, members);
  update_next_dict(channel_id, members);
  await say(`Members are: `);
  for (const elem of members_dict.get(channel_id)) {
      await say(`<@${elem}>`);
  } 
});

app.message('!members', async ({ message, say}) => {
  const channel_id = message.channel;
  const members = members_dict.get(channel_id);
  if(!members) {
    say(`Please type the !init command to initialize the bot first 🦀`);
    return;
  }
  await say(`Members are: `);
  for (const elem of members) {
      await say(`<@${elem}>`);
  }
});

app.message('!next', async ({ message, say}) => {
  const channel_id = message.channel;
  const members = next_dict.get(channel_id);
  if(!members) {
    say(`Please type the !init command to initialize the bot first 🦀`);
    return;
  }
  await say(`Remaining available code reviewers are: `);
  for (const elem of members) {
      await say(`<@${elem}>`);
  }
});

app.message('!reviewers', async ({message, say, client}) => {
  const {channel, ts} = message;
  if( !members_dict.get(channel) || !next_dict.get(channel) ){
    say(`Please type the !init command to initialize the bot first 🦀`);
    return;
  }
  let members = next_dict.get(channel).slice();
  const requestor = message.user;
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
    await say('Please include the number of reviewers to select (i.e. `!reviewers 2` for 2 code reviewers)');
    return;
  }
  
  const groupSize = membersNum;
  clear_temp_dict(channel);
  
  while(membersNum > 0) {
    if(members.length == 0) {
      const all_members = members_dict.get(channel).slice();
      console.log(all_members);
      const rand = Math.floor(Math.random()*all_members.length);
      const member = all_members.splice(rand, 1)[0]; 
      if(member == requestor) continue;
      console.log(member);
      if((temp_dict.get(channel).includes(member))) {
        console.log(member + " in temp dictionary")
        continue;
      }
      else {
        temp_dict.get(channel).push(member);
        membersNum--;
      }
    } else {
      const rand = Math.floor(Math.random()*members.length);
      const member = members.splice(rand, 1)[0]; 
      if(member == requestor) continue;
      temp_dict.get(channel).push(member);
      membersNum--;
    }
  }
  const reviewers = temp_dict.get(channel);
  const confirmText = `Please confirm that these members are available for code review. Otherwise, reroll another combination!`;
  let reviewersText = "*Code Reviewers*\n";
  for(let i = 0; i < reviewers.length; i++) {
    reviewersText = reviewersText.concat(`<@${reviewers[i]}>\n`);
  }
  await client.chat.postMessage({channel, thread_ts: ts, text: `<@${message.user}> is selecting reviewers...`});
  const result = await client.chat.postEphemeral({
    channel,
    thread_ts: ts,
    user: message.user,
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
            "value": channel+':'+message.user+':'+ts,
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
            "value": channel+':'+message.user+':'+ts,
            "action_id": "confirm_cancel"
          },
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Reroll 🎲"
            },
            "value": channel+':'+message.user+':'+ts+':'+groupSize,
            "action_id": "confirm_reroll"
          },
        ]
      }
    ]
  });
});

app.message('!help', async ({ message, say}) => {
  const init = `*!init*\nInitialize rotation list of members to choose reviewers from.\n\n`;
  const reviewers = '*!reviewers `number`*\nRequest a code review. Replace {number} with the number of code reviewers you want.\n\n';
  const members = `*!members*\nLists all potential members for code reviews.\n\n`;
  const next = `*!next*\nLists the remaining members who have not done a code review yet in the current rotation.\n\n`;
  const crab = `*!feeling-crabby*\n🦀 🦀 🦀 🦀\n\n`;
  const help = `*!help*\nThis command right here.`
  const commands = init + reviewers + members + next + crab + help;
  const result = await say({
    blocks: [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": `List of Commands`,
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "section",
        "fields": [
          {
            "type": "mrkdwn",
            "text": commands
          }
        ],
      },
      {
        "type": "divider"
      },
      {
        "type": "context",
        "elements": [
          {
            "type": "mrkdwn",
            "text": "ℹ Want more info? Visit our <https://github.com/justin-zhu1018/C.R.A.B.|GitHub>!"
          }
        ]
      }
    ]
  });
});

app.action('confirm_approve', async ({ body, ack, say, client}) => {
  // Acknowledge the action
  const channel = body.container.channel_id;
  const reviewers = temp_dict.get(channel);
  const params = body.actions[0].value.split(':');
  const ts = params[2]
  try {
    await ack();
    // Start: If after approving and cr_dict is empty, refresh it with all members and let it get filtered by cr_temp_dict
    if(next_dict.get(channel).length == 0) {
      const members = members_dict.get(channel);
      update_next_dict(channel, members);
    }
    // End
    let message = "*Selected Code Reviewers*\n";
    for(let i = 0; i < reviewers.length; i++) {
      const reviewer = reviewers[i];
      message = message.concat(`<@${reviewer}>\n`);
      const filtered_array = next_dict.get(channel).filter(item => !reviewer.includes(item));
      update_next_dict(channel, filtered_array);
    }
    await client.chat.postMessage({channel, thread_ts: ts, text: message});
    // Start Edge Case: If all members participated in the code reviewers, dictionary will be empty, so refresh.
    if(next_dict.get(channel).length == 0) {
      const members = members_dict.get(channel);
      update_next_dict(channel, members);
    }
    // End
  } catch (error) {
    console.log(error);
  }
  // await say(`Approved <@${body.user.id}>!`);
});

app.action('confirm_cancel', async ({ body, ack, say, client}) => {
  const channel = body.container.channel_id;
  // Acknowledge the action
  await ack();
  const params = body.actions[0].value.split(':'); 
  clear_temp_dict(body.container.channel_id);
  // await say(`C.R.A.B. cancelling`);
  const ts = params[2]
  await client.chat.postMessage({channel, thread_ts: ts, text: 'C.R.A.B cancelling'});
});

app.action('confirm_reroll', async ({ body, ack, say, client }) => {

  // Acknowledge the action
  await ack();

  // console.log(body);
  // Start of copy of reviewers method
  const channel = body.container.channel_id;
  let members = next_dict.get(channel).slice();
  const params = body.actions[0].value.split(':');
  let membersNum = params[3];
  let ts = params[2];
  let user = params[1]
  const requestor = user;
  members = members.filter(item => item !== user);
  console.log(members);
  const groupSize = membersNum;

  clear_temp_dict(channel);
  
  while(membersNum > 0) {
    if(members.length == 0 || members.length == groupSize) {
      const all_members = members_dict.get(channel).slice();
      const rand = Math.floor(Math.random()*all_members.length);
      const member = all_members.splice(rand, 1)[0]; 
      if(member == requestor) continue;
      // console.log(member);
      // console.log(temp_dict.get(channel));
      if((temp_dict.get(channel).includes(member))) {
        console.log(member + " in temp dictionary");
        continue;
      }
      else {
        membersNum--;
        temp_dict.get(channel).push(member);
      }
    } else {
      const rand = Math.floor(Math.random()*members.length);
      const member = members.splice(rand, 1)[0]; 
      if(member == requestor) continue;
      temp_dict.get(channel).push(member);
      // console.log("Temp: " + temp_dict.get(channel));
      membersNum--;
    }
  }
  const reviewers = temp_dict.get(channel);
  const confirmText = `Please confirm that these members are available for code review. Otherwise, reroll another combination!`;
  let reviewersText = "*Code Reviewers*\n";
  for(let i = 0; i < reviewers.length; i++) {
    reviewersText = reviewersText.concat(`<@${reviewers[i]}>\n`);
  }
  const result = await client.chat.postEphemeral({
    channel,
    thread_ts: ts,
    user: user,
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
            "value": channel+':'+user+':'+ts,
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
            "value": channel+':'+user+':'+ts,
            "action_id": "confirm_cancel"
          },
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Reroll 🎲"
            },
            "value": channel+':'+user+':'+ts+':'+groupSize,
            "action_id": "confirm_reroll"
          },
        ]
      }
    ]
  });
});

app.message('!feeling-crabby', async ({ message, say}) => {
  const channel = message.channel;
  const rand = Math.floor(Math.random()*jokes.length)+1+"";
  console.log(rand);
  await say(jokes[rand]);
});

(async () => {
    await app.start(process.env.PORT || 3000);

    console.log('Bolt app is running');
})();