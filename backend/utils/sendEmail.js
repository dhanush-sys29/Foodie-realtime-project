import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Order confirmation email with OTP
export const sendOrderConfirmation = async ({ to, name, trackingId, items, total, otp }) => {
  const itemsList = items?.map(i => `<li>${i.qty || i.quantity}x ${i.name} — ₹${i.price}</li>`).join('') || '';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#FAFAFA;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#FF6B35,#F5A623);padding:32px;text-align:center">
        <h1 style="color:#fff;font-size:2rem;margin:0">FOODIE</h1>
        <p style="color:rgba(255,255,255,0.9);margin:8px 0 0">Order Confirmed! 🎉</p>
      </div>
      <div style="padding:32px">
        <p style="font-size:1.1rem;color:#1F2937">Hi <strong>${name}</strong>,</p>
        <p style="color:#6B7280">Your order has been placed successfully.</p>
        <div style="background:#fff;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e5e7eb">
          <p style="margin:0 0 8px"><strong>Tracking ID:</strong> <span style="color:#FF6B35;font-size:1.2rem;font-weight:bold">#${trackingId}</span></p>
          <p style="margin:0 0 16px"><strong>Delivery OTP:</strong> <span style="color:#FF6B35;font-size:1.5rem;font-weight:bold;letter-spacing:4px">${otp}</span></p>
          <p style="margin:0 0 8px;font-weight:600;color:#1F2937">Items Ordered:</p>
          <ul style="margin:0;padding-left:20px;color:#6B7280">${itemsList}</ul>
          <div style="border-top:1px solid #e5e7eb;margin-top:16px;padding-top:16px">
            <span style="font-weight:700;color:#1F2937">Total: </span>
            <span style="font-weight:700;color:#FF6B35;font-size:1.2rem">₹${total}</span>
          </div>
        </div>
        <a href="${process.env.FRONTEND_URL}/track/${trackingId}" style="display:inline-block;background:#FF6B35;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;margin-top:16px">Track Your Order →</a>
      </div>
      <div style="background:#1A1A2E;padding:20px;text-align:center">
        <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0">© 2025-2026 FOODIE · Sri Indu Institute of Engineering and Technology</p>
      </div>
    </div>
  `;
  try {
    await transporter.sendMail({
      from: `FOODIE <${process.env.EMAIL_USER}>`,
      to,
      subject: `Order Confirmed #${trackingId} — FOODIE`,
      html,
    });
    console.log(`✉️  Confirmation email sent to ${to}`);
  } catch (err) {
    console.error('Email send error:', err.message);
  }
};

// Status update email
export const sendStatusUpdate = async ({ to, name, trackingId, status }) => {
  const STATUS_EMOJI = { Confirmed:'✅', Preparing:'🍳', Ready:'🎉', Delivering:'🛵', Delivered:'🏁' };
  try {
    await transporter.sendMail({
      from: `FOODIE <${process.env.EMAIL_USER}>`,
      to,
      subject: `Order #${trackingId} is now ${status} ${STATUS_EMOJI[status] || ''}`,
      html: `<p>Hi ${name}, your order <strong>#${trackingId}</strong> status updated to <strong style="color:#FF6B35">${status}</strong>.</p><a href="${process.env.FRONTEND_URL}/track/${trackingId}">Track Order →</a>`,
    });
  } catch (err) {
    console.error('Status email error:', err.message);
  }
};

// OTP email for registration
export const sendOtpEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: `FOODIE <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: `<div style="font-family:Arial,sans-serif;max-width:500px;padding:32px;background:#FAFAFA;border-radius:16px;border-left:4px solid #FF6B35"><h2 style="color:#FF6B35">🍽️ FOODIE</h2><p style="font-size:16px;color:#1F2937">${text}</p><p style="color:#6B7280;font-size:12px;margin-top:24px">Sri Indu Institute of Engineering and Technology · CSE 2025-26</p></div>`,
    });
    return { success: true };
  } catch (err) {
    console.error('OTP email error:', err.message);
    return { success: false };
  }
};
