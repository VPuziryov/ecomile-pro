const { google } = require("googleapis");

const SHEET_NAME = "Leads";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Content-Type": "application/json"
};

exports.handler = async (event) => {

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: "Method not allowed"
      })
    };
  }

  try {

    const body = JSON.parse(event.body || "{}");

    const {
      project,
      name,
      contact,
      company,
      website,
      message
    } = body;

    if (!project) {
      throw new Error("Project is required");
    }

    if (!name || !contact) {
      throw new Error("Name and Contact are required");
    }

    const sheetsConfig = JSON.parse(process.env.SHEETS_CONFIG);

    const spreadsheetId = sheetsConfig[project];

    if (!spreadsheetId) {
      throw new Error(`Unknown project: ${project}`);
    }

    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets"
      ]
    });

    const client = await auth.getClient();

    const sheets = google.sheets({
  version: "v4",
  auth: client
});



    const row = [
      new Date().toISOString(),
      name || "",
      contact || "",
      company || "",
      website || "",
      message || ""
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_NAME}!A:F`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [row]
      }
    });

    const projects = {
  da: "🌊 DiveAds",
  ea: "🚀 EasyAds",
  io: "🤿 iScuba"
};

const telegramText =
`🔔 Новый лид

Проект: ${projects[project] || project}

👤 ${name}
📞 ${contact}
🏢 ${company || "-"}

🌐 ${website || "-"}

💬
${message || "-"}`;

try {

  const tg = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: telegramText
      })
    }
  );

  if (!tg.ok) {
    console.error("Telegram API error:", await tg.text());
  }

} catch (err) {
  console.error("Telegram notification failed:", err);
}

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true
      })
    };

  } catch (err) {

    console.error(err);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: err.message
      })
    };

  }

};