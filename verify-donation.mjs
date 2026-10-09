
const json = (statusCode, payload) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, {
      success: false,
      message: "Method not allowed."
    });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    return json(500, {
      success: false,
      message: "Payment verification is not configured."
    });
  }

  const reference = event.queryStringParameters?.reference || "";

  // Only accept references created for this donation flow.
  if (!/^tee-[a-zA-Z0-9-]{10,80}$/.test(reference)) {
    return json(400, {
      success: false,
      message: "Invalid payment reference."
    });
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${secretKey}` }
      }
    );

    const result = await response.json();
    const transaction = result.data;

    if (!response.ok || !result.status || !transaction) {
      return json(502, {
        success: false,
        message: "Unable to verify this payment right now."
      });
    }

    const verified =
      transaction.status === "success" &&
      transaction.reference === reference &&
      transaction.currency === "NGN" &&
      Number.isSafeInteger(Number(transaction.amount)) &&
      Number(transaction.amount) >= 10000 &&
      Number(transaction.amount) <= 100000000;

    if (!verified) {
      return json(200, {
        success: false,
        message: "Payment has not been confirmed as successful."
      });
    }

    return json(200, {
      success: true,
      message: "Your donation has been verified. Thank you for supporting TeeDev!",
      amount: Number(transaction.amount) / 100
    });
  } catch (error) {
    console.error("Donation verification error:", error.message);

    return json(500, {
      success: false,
      message: "Could not verify the payment. Please try again."
    });
  }
};
