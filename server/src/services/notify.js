import nodemailer from "nodemailer";
import twilio from "twilio";
import { Notification } from "../models/Notification.js";

function mailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function smsConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM
  );
}

async function sendEmail({ to, subject, html, text, certId }) {
  const body = text || html;
  if (!mailConfigured()) {
    console.log(`[email:logged] ${to} — ${subject}`);
    return Notification.create({ type: "email", to, subject, body, status: "logged", certId });
  }
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text,
    });
    return Notification.create({ type: "email", to, subject, body, status: "sent", certId });
  } catch (error) {
    return Notification.create({
      type: "email",
      to,
      subject,
      body,
      status: "failed",
      certId,
      error: error.message,
    });
  }
}

async function sendSms({ to, body, certId }) {
  if (!to) return null;
  if (!smsConfigured()) {
    console.log(`[sms:logged] ${to} — ${body}`);
    return Notification.create({ type: "sms", to, body, status: "logged", certId });
  }
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({ from: process.env.TWILIO_FROM, to, body });
    return Notification.create({ type: "sms", to, body, status: "sent", certId });
  } catch (error) {
    return Notification.create({ type: "sms", to, body, status: "failed", certId, error: error.message });
  }
}

export async function notifyVerification({ issuer, certificate, result }) {
  if (!issuer) return;
  const subject = `CertiChain: ${certificate.certId} verified as ${result.toUpperCase()}`;
  const text = `${certificate.name}'s ${certificate.course} certificate (${certificate.certId}) was just checked. Result: ${result}.`;
  if (issuer.notifyEmail) {
    await sendEmail({
      to: issuer.email,
      subject,
      text,
      html: `<p>${text}</p><p>Issued by ${certificate.issuer}.</p>`,
      certId: certificate.certId,
    });
  }
  if (issuer.notifySms && issuer.phone) {
    await sendSms({ to: issuer.phone, body: text, certId: certificate.certId });
  }
}

export async function notifyIssued({ studentEmail, studentName, certId, course }) {
  const url = `${process.env.FRONTEND_URL}/verify?id=${encodeURIComponent(certId)}`;
  await sendEmail({
    to: studentEmail,
    subject: `Your ALITS certificate is ready — ${certId}`,
    certId,
    text: `Congratulations ${studentName}. Your ${course} certificate (${certId}) is ready. Verify: ${url}`,
    html: `<p>Congratulations <strong>${studentName}</strong>.</p>
      <p>Your <em>${course}</em> certificate <strong>${certId}</strong> has been issued.</p>
      <p><a href="${url}">Verify authenticity</a></p>`,
  });
}

export { sendEmail, sendSms };
