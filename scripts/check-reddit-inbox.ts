import fs from "node:fs";
import path from "node:path";

const TOKEN_PATH = path.join(process.cwd(), ".reddit-tokens.json");

async function checkInbox() {
  if (!fs.existsSync(TOKEN_PATH)) {
    console.log("No Reddit token found.");
    return;
  }

  const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
  let accessToken = tokenData.accessToken;
  const refreshToken = tokenData.refreshToken;

  const clientId = process.env.REDDIT_CLIENT_ID || "TWTsqXa53CexlrYGBWaesQ";
  const clientSecret = ""; // Installed app

  // Refresh token
  const authHeader = "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const refreshResponse = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: authHeader,
      "User-Agent": "VaniEdge/1.0.0",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!refreshResponse.ok) {
    console.error("Failed to refresh token", await refreshResponse.text());
    return;
  }
  const refreshData = await refreshResponse.json();
  accessToken = refreshData.access_token;
  
  // Save new token
  tokenData.accessToken = accessToken;
  tokenData.updatedAt = new Date().toISOString();
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokenData, null, 2));

  // Fetch inbox
  const response = await fetch("https://oauth.reddit.com/message/inbox", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "VaniEdge/1.0.0 (by u/SamarthBuilds_)",
    },
  });

  if (!response.ok) {
    console.error("Failed to fetch inbox", await response.text());
    return;
  }

  const data = await response.json();
  const messages = data.data.children;
  console.log(`Found ${messages.length} messages in inbox.`);
  messages.forEach((m: any, i: number) => {
    console.log(`\n--- Message ${i + 1} ---`);
    console.log(`From: ${m.data.author}`);
    console.log(`Subject: ${m.data.subject}`);
    console.log(`Body: ${m.data.body}`);
  });
}

checkInbox()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error in checkInbox:", err);
    process.exit(1);
  });
