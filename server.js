const express = require('express');
const fetch = require('node-fetch');

const app = express();

app.get('/', async (req, res) => {
  // Your TikTok access token
  const accessToken = 'YOUR_ACCESS_TOKEN';

  // Request to get follower count
  const response = await fetch('https://open.tiktokapis.com/v2/user/info/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'username': 'XStarWake',
      'fields': 'follower_count',
    }),
  });

  const data = await response.json();
  if (data.data && data.data.follower_count) {
    res.send(`XStarWake has ${data.data.follower_count} followers!`);
  } else {
    res.send('Failed to retrieve follower count.');
  }
});

// Listen for requests
const listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
