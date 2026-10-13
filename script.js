
const SUPABASE_URL = "https://qrsgncaxseoxjazkhzqw.supabase.co";
const SUPABASE_KEY = "sb_publishable_m3RUpr8b_X3x41NuWOUXoQ_R1nWQo4O";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const form = document.getElementById("message-form");
const nameInput = document.getElementById("display-name");
const messageInput = document.getElementById("visitor-message");
const submitButton = document.getElementById("submit-button");
const formStatus = document.getElementById("form-status");
const messagesList = document.getElementById("messages-list");

function showStatus(message, isError = false) {
  formStatus.textContent = message;
  formStatus.classList.toggle("error", isError);
}

function createMessageCard(message) {
  const card = document.createElement("article");
  card.className = "message-card";

  const author = document.createElement("p");
  author.className = "message-author";
  author.textContent = message.display_name || "محبّ للوطن";

  const content = document.createElement("p");
  content.textContent = message.message;

  card.append(author, content);

  return card;
}

async function loadMessages() {
  messagesList.replaceChildren();

  const loading = document.createElement("p");
  loading.className = "loading-message";
  loading.textContent = "جارٍ تحميل الرسائل...";
  messagesList.appendChild(loading);

  const { data, error } = await supabaseClient
    .from("national_messages")
    .select("id, display_name, message, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    messagesList.replaceChildren();

    const errorMessage = document.createElement("p");
    errorMessage.className = "empty-message";
    errorMessage.textContent = "تعذّر تحميل الرسائل حاليًا.";
    messagesList.appendChild(errorMessage);

    console.error("Loading messages failed:", error.message);
    return;
  }

  messagesList.replaceChildren();

  if (!data || data.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent = "كن أول من يشارك بكلمة حبّ للوطن.";
    messagesList.appendChild(emptyMessage);
    return;
  }

  data.forEach((message) => {
    messagesList.appendChild(createMessageCard(message));
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const displayName = nameInput.value.trim() || "محبّ للوطن";
  const message = messageInput.value.trim();

  if (displayName.length > 40) {
    showStatus("الاسم يجب ألا يتجاوز 40 حرفًا.", true);
    return;
  }

  if (message.length < 5 || message.length > 500) {
    showStatus("اكتب رسالة بين 5 و500 حرف.", true);
    return;
  }

  submitButton.disabled = true;
  showStatus("جارٍ إرسال رسالتك...");

  try {
    const { error } = await supabaseClient
      .from("national_messages")
      .insert([
        {
          display_name: displayName,
          message: message,
          status: "approved"
        }
      ]);

    if (error) {
      console.error("Sending message failed:", error.message);
      showStatus(
        "لم نتمكن من إرسال الرسالة. حاول مرة أخرى لاحقًا.",
        true
      );
      return;
    }

    form.reset();
    showStatus("شكرًا لك، وصلت رسالتك بنجاح.");

    await loadMessages();
  } catch (error) {
    console.error("Unexpected error:", error);
    showStatus("حدث خطأ في الاتصال. حاول مرة أخرى.", true);
  } finally {
    submitButton.disabled = false;
  }
});

loadMessages();
 