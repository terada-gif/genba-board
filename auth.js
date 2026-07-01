(function initializeAuth(global) {
  const repository = global.BoardRepository;
  const gate = document.querySelector("#auth-gate");
  const form = document.querySelector("#login-form");
  const emailInput = document.querySelector("#login-email");
  const passwordInput = document.querySelector("#login-password");
  const submitButton = document.querySelector("#login-submit-button");
  const message = document.querySelector("#login-message");
  const cloudBanner = document.querySelector("#cloud-mode-banner");
  const logoutButton = document.querySelector("#logout-button");
  let connectedUserId = null;
  let connectionPromise = null;

  if (!repository?.isSupabaseMode) return;

  document.body.classList.add("auth-required");
  gate.hidden = false;
  cloudBanner.hidden = false;
  document.querySelector("#local-save-status").hidden = true;

  function showBoard(session) {
    gate.hidden = true;
    document.body.classList.remove("auth-required");
    const email = session?.user?.email || "ログイン済み";
    document.querySelector("#cloud-session-label").textContent = email;
  }

  function showLogin() {
    connectedUserId = null;
    void global.CloudBoardApp.disconnect();
    gate.hidden = false;
    document.body.classList.add("auth-required");
    message.textContent = "メールアドレスとパスワードでログインしてください。";
    message.dataset.state = "";
  }

  function showLoginError(error) {
    const errorMessage = String(error?.message || "");
    if (/invalid login credentials/i.test(errorMessage)) {
      message.textContent = "メールアドレスまたはパスワードが正しくありません。";
    } else if (/failed to fetch|network|load failed/i.test(errorMessage)) {
      message.textContent = "Supabaseへ接続できません。通信状態と接続設定を確認してください。";
    } else {
      message.textContent = errorMessage || "ログインできませんでした。設定を確認してください。";
    }
    message.dataset.state = "error";
  }

  function connectSession(session) {
    if (!session) return Promise.resolve();
    if (connectedUserId === session.user.id) return Promise.resolve();
    if (connectionPromise) return connectionPromise;

    global.CloudBoardApp.setSyncState("connecting", "クラウドデータを読み込んでいます。");
    connectionPromise = global.CloudBoardApp
      .load()
      .then(() => {
        connectedUserId = session.user.id;
        showBoard(session);
      })
      .catch((error) => {
        showLoginError(error);
        throw error;
      })
      .finally(() => {
        connectionPromise = null;
      });
    return connectionPromise;
  }

  async function prepareAuth() {
    const configError = repository.supabase.configurationError();
    if (configError) {
      showLoginError(configError);
      submitButton.disabled = true;
      return;
    }

    try {
      const client = await repository.supabase.getClient();
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (data.session) await connectSession(data.session);

      client.auth.onAuthStateChange((_event, session) => {
        if (session) {
          void connectSession(session).catch(() => {});
        } else {
          showLogin();
        }
      });
    } catch (error) {
      showLoginError(error);
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    message.textContent = "ログインしています…";
    message.dataset.state = "loading";

    try {
      const client = await repository.supabase.getClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: emailInput.value.trim(),
        password: passwordInput.value,
      });
      if (error) throw error;
      await connectSession(data.session);
      form.reset();
    } catch (error) {
      showLoginError(error);
    } finally {
      submitButton.disabled = false;
    }
  });

  logoutButton.addEventListener("click", async () => {
    const client = await repository.supabase.getClient();
    await client.auth.signOut();
    showLogin();
  });

  prepareAuth();
})(window);
