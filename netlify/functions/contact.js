const { google } = require("googleapis");

const mySiteContact = require("../../assets/js/mysite-contact.js");

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

  let isMySite = false;
  try {

    const body = JSON.parse(event.body || "{}");

    let {
      project,
      name,
      contact,
      company,
      website,
      message
    } = body;

    isMySite = project === "mysite";
    if (isMySite) {
      const limits = {name:120, contact:500, email:254, messenger:200, company:200, website:2048, message:3000};
      for (const [field, limit] of Object.entries(limits)) {
        if (body[field] != null && (typeof body[field] !== "string" || body[field].length > limit)) {
          return {statusCode:400, headers:corsHeaders, body:JSON.stringify({success:false, error:"Invalid enquiry"})};
        }
      }
      name = (name || "").trim(); contact = (contact || "").trim();
      company = (company || "").trim(); website = (website || "").trim(); message = (message || "").trim();
      // Cached older forms still send one contact field; apply the same format rules.
      const separateFields = Object.prototype.hasOwnProperty.call(body, 'email') || Object.prototype.hasOwnProperty.call(body, 'messenger');
      const email = separateFields ? (body.email || '').trim() : (contact.includes('@') && !contact.startsWith('@') && !contact.includes('/') ? contact : '');
      const messenger = separateFields ? (body.messenger || '').trim() : (email ? '' : contact);
      const contactError = mySiteContact.validate(email, messenger);
      if (contactError) return {statusCode:400, headers:corsHeaders, body:JSON.stringify({success:false, code:contactError, error:'Invalid contact'})};
      contact = mySiteContact.combine(email, messenger);
      if (!name) return {statusCode:400, headers:corsHeaders, body:JSON.stringify({success:false, error:'Name is required'})};
    }

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
      valueInputOption: isMySite ? "RAW" : "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [row]
      }
    });

    const projects = {
  mysite: "MY SITE",
  da: "🌊 DiveAds",
  ea: "🚀 EasyAds",
  eaa: "🌴 EasyAdsAsia",
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
        error: isMySite ? "Unable to save enquiry. Please try again later." : err.message
      })
    };

  }

};
