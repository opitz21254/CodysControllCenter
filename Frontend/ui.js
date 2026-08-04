// UI layer: wires the login form to the API and renders the inventory table.
(function () {
  const form = document.getElementById("loginForm");
  const usernameInput = document.getElementById("loginUsername");
  const passwordInput = document.getElementById("loginPassword");
  const message = document.getElementById("loginMessage");
  const submitButton = form.querySelector("button[type=submit]");
  const table = document.getElementById("inventoryTable");
  const tableBody = table.querySelector("tbody");
  const logoutButton = document.getElementById("logoutButton");

  const FADE_MS = 250;
  let hideTimer = null;

  function clearHideTimer() {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  }

  function setMessage(text) {
    message.textContent = text;
  }

  function revealSoftly(el) {
    clearHideTimer();
    el.hidden = false;
    el.style.transition = `opacity ${FADE_MS}ms ease`;
    el.style.opacity = "0";
    el.style.pointerEvents = "none";

    requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.pointerEvents = "";
    });
  }

  function hideSoftly(el) {
    clearHideTimer();
    if (el.hidden) return;

    el.style.transition = `opacity ${FADE_MS}ms ease`;
    el.style.opacity = "0";
    el.style.pointerEvents = "none";

    hideTimer = setTimeout(() => {
      el.hidden = true;
      el.style.pointerEvents = "";
    }, FADE_MS);
  }

  function renderInventory(items) {
    tableBody.innerHTML = "";
    for (const item of items) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.textContent = item;
      row.appendChild(cell);
      tableBody.appendChild(row);
    }
  }

  function showLoggedIn(items) {
    renderInventory(items);
    form.hidden = true;
    logoutButton.hidden = false;
    revealSoftly(table);
  }

  function showLoggedOut() {
    hideSoftly(table);
    logoutButton.hidden = true;
    form.hidden = false;
    passwordInput.value = "";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMessage("");
    submitButton.disabled = true;

    try {
      await login(usernameInput.value.trim(), passwordInput.value);
      const items = await fetchInventory();
      showLoggedIn(items);
    } catch (err) {
      setMessage(err.message);
      hideSoftly(table);
    } finally {
      submitButton.disabled = false;
    }
  });

  logoutButton.addEventListener("click", async () => {
    await logout();
    setMessage("");
    showLoggedOut();
  });

  // Restore the session if a token from a previous login is still valid.
  if (isLoggedIn()) {
    fetchInventory()
      .then(showLoggedIn)
      .catch(() => showLoggedOut());
  }
})();
