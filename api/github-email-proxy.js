// api/github-email-proxy.js
// OneSpark 星火：留言代理伺服器 (Vercel Function)
// 具備 CORS、防呆、GitHub 寫入、可選寄信功能

export default async function handler(req, res) {
  // === 🧩 CORS 設定 ===
  const allowedOrigins = [
    "https://johnyuh.github.io",          // 你的 GitHub Pages 網址
    "https://genealogy-1.vercel.app"     // 你的 Vercel 網站
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 預檢請求（Preflight）
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 只允許 POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // === ✉️ 接收留言資料 ===
    const { name, email, message } = req.body || {};
    if (!name || !message) {
      return res.status(400).json({ error: "Missing name or message" });
    }

    // === 🕒 準備留言內容 ===
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, "").slice(0, 15);
    const fileName = `emails/inbox_${timestamp}.txt`;
    const content = `📩 訪客留言\n\n時間：${now.toLocaleString()}\n姓名：${name}\nEmail：${email}\n\n內容：\n${message}\n`;

    // === 🔐 GitHub 設定 ===
    const GITHUB_USER = "johnyuh";
    const GITHUB_REPO = "genealogy-1";
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    if (!GITHUB_TOKEN) {
      console.error("❌ 未設定 GITHUB_TOKEN");
      return res.status(500).json({ error: "Missing GITHUB_TOKEN environment variable" });
    }

    // === 💾 寫入 GitHub ===
    const ghRes = await fetch(
      `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${fileName}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: `新增留言 ${fileName}`,
          content: Buffer.from(content).toString("base64")
        })
      }
    );

    if (!ghRes.ok) {
      const errText = await ghRes.text();
      console.error("❌ GitHub Error:", errText);
      return res.status(502).json({ error: "GitHub write failed", detail: errText });
    }

    // === 📬 (可選) SendGrid 通知信 ===
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    if (SENDGRID_API_KEY) {
      try {
        await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SENDGRID_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: "john.ext500@gmail.com" }] }],
            from: { email: "no-reply@genealogy-1", name: "genealogy-1" },
            subject: "新留言通知",
            content: [{ type: "text/plain", value: content }]
          })
        });
        console.log("📨 已寄出通知信給管理者");
      } catch (mailErr) {
        console.warn("⚠️ SendGrid 寄信失敗：", mailErr);
      }
    }

    // === ✅ 成功回覆 ===
    console.log("✅ 新留言已寫入 GitHub:", fileName);
    return res.status(200).json({ ok: true, file: fileName });

  } catch (err) {
    console.error("🔥 伺服器錯誤：", err);
    return res.status(500).json({ error: "Internal Server Error", detail: String(err) });
  }
}
