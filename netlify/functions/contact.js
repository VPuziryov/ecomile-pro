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

    const spreadsheetId =
  project === "ea"
    ? "1XYeKNn1-H45vfut3bMdqapZQ5vIRlzVjVwJx7OAUx00"
    : sheetsConfig[project];

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

console.log("PROJECT:", project);
console.log("SPREADSHEET:", spreadsheetId);
console.log("SHEET:", SHEET_NAME);

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