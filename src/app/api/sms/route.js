// Next.js API route to send SMS via Twilio
// This runs on the server side

export async function POST(request) {
  try {
    const { phoneNumber, message } = await request.json();

    if (!phoneNumber || !message) {
      return Response.json(
        { error: "Phone number and message are required" },
        { status: 400 }
      );
    }

    // Get Twilio credentials from environment variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error("Twilio credentials not configured");
      return Response.json(
        { error: "SMS service not configured" },
        { status: 500 }
      );
    }

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append("To", phoneNumber);
    formData.append("From", twilioPhoneNumber);
    formData.append("Body", message);

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Twilio error:", data);
      return Response.json(
        { error: "Failed to send SMS", details: data },
        { status: response.status }
      );
    }

    return Response.json({
      success: true,
      messageSid: data.sid,
      message: "SMS sent successfully",
    });
  } catch (error) {
    console.error("SMS API error:", error);
    return Response.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

