const express = require('express');
const fetch = require('node-fetch');
const app = express();

// Environment variables (set these in your Glitch project settings)
const CLIENT_KEY = process.env.CLIENT_KEY;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;  // Example: 'https://your-app-name.glitch.me/callback'

// In-memory storage for tokens (you should store tokens in a database in production)
let accessToken = '';
let refreshToken = '';

// Route to redirect user to TikTok for OAuth authorization
app.get('/authorize', (req, res) => {
    const tiktokAuthURL = `https://www.tiktok.com/auth/authorize/` +
                          `?client_key=${CLIENT_KEY}&response_type=code` +
                          `&scope=user.info.stats&redirect_uri=${REDIRECT_URI}&state=random_state`;
    res.redirect(tiktokAuthURL);
});

// Route to handle the callback from TikTok and exchange the authorization code for an access token
app.get('/callback', async (req, res) => {
    const authorizationCode = req.query.code;
    if (!authorizationCode) {
        return res.send('Error: No authorization code received.');
    }

    // Exchange the authorization code for an access token
    const tokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/';
    const params = new URLSearchParams();
    params.append('client_key', CLIENT_KEY);
    params.append('client_secret', CLIENT_SECRET);
    params.append('code', authorizationCode);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', REDIRECT_URI);

    try {
        const tokenResponse = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        });
        const tokenData = await tokenResponse.json();

        if (tokenData.access_token) {
            // Store the access token and refresh token
            accessToken = tokenData.access_token;
            refreshToken = tokenData.refresh_token;
            res.send(`Authorization complete! Access token acquired.`);
        } else {
            res.send(`Error: ${JSON.stringify(tokenData)}`);
        }
    } catch (error) {
        res.send(`Error exchanging authorization code: ${error.message}`);
    }
});

// Route to fetch follower count using the access token
app.get('/follower_count', async (req, res) => {
    if (!accessToken) {
        return res.send('Error: Access token is not available. Please authorize the app.');
    }

    const tiktokApiUrl = 'https://open.tiktokapis.com/v2/user/info/';
    const body = {
        username: 'XStarWake',
        fields: 'follower_count'
    };

    try {
        const response = await fetch(tiktokApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        const data = await response.json();

        if (data.data && data.data.follower_count) {
            res.send(`XStarWake has ${data.data.follower_count} followers!`);
        } else {
            res.send(`Error fetching follower count: ${JSON.stringify(data)}`);
        }
    } catch (error) {
        res.send(`Error: ${error.message}`);
    }
});

app.get('/refresh_token', async (req, res) => {
  if (!refreshToken) {
      return res.send('Error: No refresh token available.');
  }

  const refreshUrl = 'https://open.tiktokapis.com/v2/oauth/token/';
  const params = new URLSearchParams();
  params.append('client_key', CLIENT_KEY);
  params.append('client_secret', CLIENT_SECRET);
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);

  try {
      const refreshResponse = await fetch(refreshUrl, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params
      });
      const refreshData = await refreshResponse.json();

      if (refreshData.access_token) {
          accessToken = refreshData.access_token;
          refreshToken = refreshData.refresh_token;
          res.send('Access token refreshed successfully.');
      } else {
          res.send(`Error refreshing token: ${JSON.stringify(refreshData)}`);
      }
  } catch (error) {
      res.send(`Error: ${error.message}`);
  }
});

// Start the server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
