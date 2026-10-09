
"use strict";

const donationForm = document.getElementById("donationForm");
const amountInput = document.getElementById("donationAmount");
const emailInput = document.getElementById("donorEmail");
const submitButton = document.getElementById("donateSubmit");
const statusElement = document.getElementById("donationStatus");
const amountButtons = document.querySelectorAll(".amount-option");

amountButtons.forEach((button) => {
  button.addEventListener("click", () => {
    amountInput.value = button.dataset.amount;

    amountButtons.forEach((item) => {
      item.classList.toggle("active", item === button);
    });
  });
});

amountInput.addEventListener("input", () => {
  amountButtons.forEach((button) => {
    button.classList.toggle(
      "active",
      Number(button.dataset.amount) === Number(amountInput.value)
    );
  });
});

donationForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const amount = Number(amountInput.value);
  const email = emailInput.value.trim();

  if (!Number.isInteger(amount) || amount < 100 || amount > 1000000) {
    statusElement.textContent =
      "Enter an amount between ₦100 and ₦1,000,000.";
    return;
  }

  if (!emailInput.validity.valid || !email) {
    statusElement.textContent = "Enter a valid email address.";
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Connecting to Paystack...";
  statusElement.textContent = "Preparing your secure checkout...";

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
    statusElement.textContent =
      error.message || "Payment could not be started. Please try again.";
    submitButton.disabled = false;
    submitButton.textContent = "Donate securely with Paystack";
  }
});

