
"use strict";

const donationForm = document.getElementById("donationForm");
const amountInput = document.getElementById("donationAmount");
const emailInput = document.getElementById("donorEmail");
const submitButton = document.getElementById("donateSubmit");
const statusElement = document.getElementById("donationStatus");
const amountButtons = document.querySelectorAll(".amount-option");
const summaryElement = document.getElementById("donationSummary");
const submitLabel = submitButton.querySelector(".donate-submit-label");
const DEFAULT_LABEL = "Donate securely with Paystack";

function setLabel(text) {
  (submitLabel || submitButton).textContent = text;
}

function setStatus(text, isError = false) {
  statusElement.textContent = text;
  statusElement.classList.toggle("is-error", isError);
}

function updateSummary() {
  const value = Number(amountInput.value);
  if (summaryElement) {
    summaryElement.textContent =
      value > 0 ? "₦" + value.toLocaleString("en-NG") : "₦0";
  }
}

// Mobile navigation toggle
const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");
if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("active");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

amountButtons.forEach((button) => {
  button.addEventListener("click", () => {
    amountInput.value = button.dataset.amount;

    amountButtons.forEach((item) => {
      item.classList.toggle("active", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    });
    updateSummary();
  });
});

amountInput.addEventListener("input", () => {
  amountButtons.forEach((button) => {
    button.classList.toggle(
      "active",
      Number(button.dataset.amount) === Number(amountInput.value)
    );
  });
  updateSummary();
});

amountButtons.forEach((button) => {
  button.setAttribute("aria-pressed", String(button.classList.contains("active")));
});
updateSummary();

donationForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const amount = Number(amountInput.value);
  const email = emailInput.value.trim();

  if (!Number.isInteger(amount) || amount < 100 || amount > 1000000) {
    setStatus("Enter an amount between ₦100 and ₦1,000,000.", true);
    return;
  }

  if (!emailInput.validity.valid || !email) {
    setStatus("Enter a valid email address.", true);
    return;
  }

  submitButton.disabled = true;
  submitButton.classList.add("is-loading");
  setLabel("Connecting to Paystack...");
  setStatus("Preparing your secure checkout...");

  try {
    const response = await fetch("/.netlify/functions/initialize-donation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, email })
    });

    const result = await response.json();

    if (!response.ok || !result.success || !result.authorizationUrl) {
      throw new Error(result.message || "Could not start the payment.");
    }

    window.location.assign(result.authorizationUrl);
  } catch (error) {
    setStatus(
      error.message || "Payment could not be started. Please try again.",
      true
    );
    submitButton.disabled = false;
    submitButton.classList.remove("is-loading");
    setLabel(DEFAULT_LABEL);
  }
});

