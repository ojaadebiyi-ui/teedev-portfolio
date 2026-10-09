
import { randomUUID } from "node:crypto";

const json = (statusCode, payload) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { success: false, message: "Method not allowed." });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    console.error("PAYSTACK_SECRET_KEY is not configured.");
    return json(500, {
      success: false,
      message: "Payments are not configured yet. Please try again later."
    });
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const amount = Number(body.amount);
    const email = String(body.email || "").trim();

    if (
      !Number.isSafeInteger(amount) ||
      amount < 100 ||
      amount > 1000000
    ) {
      return json(400, {
        success: false,
        message: "Donation must be between ₦100 and ₦1,000,000."
      });
    }

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return json(400, {
        success: false,
        message: "Please provide a valid email address."
      });
    }

    const reference = `tee-${randomUUID()}`;

    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          amount: String(amount * 100),
          currency: "NGN",
          reference,
          callback_url:
            "https://teedev.netlify.app/donation-success.html",
          metadata: {
            project: "TeeDev",
            purpose: "Voluntary donation",
            custom_fields: [
              {
                display_name: "Donation purpose",
                variable_name: "donation_purpose",
                value: "Support TeeDev"
              }
            ]
          }
        })
      }
    );

    const result = await paystackResponse.json();

    if (!paystackResponse.ok || !result.status ||
        !result.data?.authorization_url) {
      console.error("Paystack initialization failed:", result.message);

      return json(502, {
        success: false,
        message: "Paystack could not start checkout. Please try again."
      });
    }

    return json(200, {
      success: true,
      authorizationUrl: result.data.authorization_url,
      reference: result.data.reference
    });
  } catch (error) {
    console.error("Donation initialization error:", error.message);

    return json(500, {
      success: false,
      message: "Unable to start your donation. Please try again."
    });
  }
};
