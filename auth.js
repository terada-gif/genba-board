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

  if (!repository?.isSupabaseMode) return;

  document.body.classList.add("auth-required");
  gate.hidden = false;
  cloudBanner.hidden = false;

  function showBoard(session) {
    gate.hidden = true;
    document.body.classList.remove("auth-required");
    const email = session?.user?.email || "ログイン済み";
    document.querySelector("#cloud-session-label").textContent = email;
  }

  function showLogin() {
    gate.hidden = false;
    document.body.classList.add("auth-required");
    message.textContent = "メールアドレスとパスワードでログインしてください。";
    message.dataset.state = "";
  }

  function showLoginError(error) {
    message.textContent = error?.message || "ログインできませんでした。設定を確認してください。";
    message.dataset.state = "error";
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
      if (data.session) showBoard(data.session);

      client.auth.onAuthStateChange((_event, session) => {
        if (session) {
          showBoard(session);
        } else {
          showLogin();
        }
      });
    } catch (error) {
      showLoginError(error);
      submitButton.disabled = true;
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
      showBoard(data.session);
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
