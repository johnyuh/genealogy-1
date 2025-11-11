// email.js - 安全、除錯版留言傳送程式
console.log("✅ email.js 已載入");

const toastEl = document.getElementById('toast');
const mailFormBox = document.getElementById('mail-form');
const sendButton = document.getElementById('send-mail');

function showToast(msg) {
  if (!toastEl) return alert(msg);
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 3000);
}

// 防止重複綁定事件
if (sendButton && !sendButton.dataset.bound) {
  sendButton.dataset.bound = "true";
  sendButton.addEventListener('click', async () => {
    console.log("📮 送出留言按鈕被點擊");
    const name = document.getElementById('sender-name')?.value.trim();
    const email = document.getElementById('sender-email')?.value.trim();
    const message = document.getElementById('sender-message')?.value.trim();

    if (!name || !message) {
      showToast('⚠️ 請填寫姓名與留言內容');
      return;
    }

    try {
      console.log("🚀 傳送中...");
      const res = await fetch('https://genealogy-1.vercel.app/api/github-email-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });

      if (!res.ok) {
        const err = await res.text();
        console.warn("❌ 傳送失敗:", err);
        showToast('❌ 傳送失敗，請稍後再試');
        return;
      }

      const result = await res.json();
      console.log("✅ API 回傳：", result);
      showToast('✅ 已送出留言');
      if (mailFormBox) mailFormBox.style.display = 'none';
      document.getElementById('sender-name').value = '';
      document.getElementById('sender-email').value = '';
      document.getElementById('sender-message').value = '';
    } catch (e) {
      console.error("⚠️ 連線錯誤：", e);
      showToast('⚠️ 無法連線伺服器，請稍後再試');
    }
  });
} else {
  console.warn("⚠️ sendButton 未找到或事件已綁定。");
}

