const path = require('path');
// Ensure backend .env is loaded before mailer is initialized
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let cachedTransporter = null;
let etherealAccount = null;

/**
 * Initializes or returns the cached nodemailer transporter
 */
async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = parseInt(process.env.SMTP_PORT, 10) || 587;
  const smtpSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : smtpPort === 465;

  if (smtpHost && smtpUser && smtpPass) {
    cachedTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
    logger.info(`Configured custom SMTP transporter for ${smtpHost}:${smtpPort} (secure: ${smtpSecure})`);
    return cachedTransporter;
  }

  // Development / Test mode fallback using Nodemailer test account (Ethereal)
  try {
    if (!etherealAccount) {
      etherealAccount = await nodemailer.createTestAccount();
    }
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: etherealAccount.user,
        pass: etherealAccount.pass,
      },
    });
    logger.info(`Configured Ethereal development mail transport (${etherealAccount.user})`);
  } catch (err) {
    logger.warn('Could not initialize Ethereal mailer, using JSON transport fallback:', err.message);
    cachedTransporter = nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  return cachedTransporter;
}

const mailerService = {
  /**
   * Sends real email OTP for official work email verification
   */
  async sendOtpEmail({ to, otp, expiresInMinutes = 10 }) {
    const fromAddress = process.env.SMTP_FROM || process.env.EMAIL_FROM || '"MedEx Central System" <verification@medex.org>';

    const mailOptions = {
      from: fromAddress,
      to,
      subject: 'MedEx Hospital Registration — Email Verification Code',
      text: `Your MedEx verification code is: ${otp}\n\nThis one-time passcode is valid for ${expiresInMinutes} minutes. Do not share this code with anyone.\n\nMedEx Healthcare Logistics Network.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 16px; background-color: #FFFFFF;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 24px; font-weight: 900; color: #0F172A; letter-spacing: -0.5px;">Med<span style="color: #0D9488;">Ex</span></span>
            <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">National Healthcare Logistics & Exchange</div>
          </div>

          <div style="padding: 24px; background-color: #F8FAFC; border-radius: 12px; border: 1px solid #EDF2F7; text-align: center;">
            <h2 style="font-size: 18px; font-weight: 800; color: #0F172A; margin: 0 0 8px 0;">Official Email Verification</h2>
            <p style="font-size: 13px; color: #475569; margin: 0 0 20px 0; line-height: 1.5;">
              Use the following 6-digit verification code to complete Step 1 of your hospital institutional registration.
            </p>

            <div style="display: inline-block; padding: 14px 32px; background-color: #0D9488; color: #FFFFFF; font-size: 32px; font-weight: 900; letter-spacing: 6px; border-radius: 12px; font-family: monospace;">
              ${otp}
            </div>

            <p style="font-size: 11px; font-weight: 600; color: #64748B; margin: 16px 0 0 0;">
              ⏱️ Code expires in <strong>${expiresInMinutes} minutes</strong>.
            </p>
          </div>

          <div style="margin-top: 24px; font-size: 11px; color: #94A3B8; line-height: 1.5; text-align: center;">
            If you did not initiate this registration request on MedEx, please ignore this message.<br />
            This is an automated institutional message. Do not reply.
          </div>
        </div>
      `,
    };

    try {
      const transporter = await getTransporter();
      const info = await transporter.sendMail(mailOptions);
      const previewUrl = nodemailer.getTestMessageUrl(info);

      if (previewUrl) {
        logger.info(`[Mailer] OTP email sent to ${to}. Preview URL: ${previewUrl}`);
        console.log('\n================================================================');
        console.log(`✉️  [ETHEREAL EMAIL PREVIEW] Verification Email Dispatched`);
        console.log(`🎯 Recipient:   ${to}`);
        console.log(`🔗 Preview URL: ${previewUrl}`);
        console.log('================================================================\n');
      } else {
        logger.info(`[Mailer] OTP email dispatched successfully to ${to}`);
      }

      return { success: true, messageId: info.messageId, previewUrl: previewUrl || null };
    } catch (err) {
      logger.error('[Mailer] Failed to send OTP email via primary transporter:', err.message);

      // In development fallback: if Ethereal SMTP transport fails (network/ISP timeout), use JSON transport fallback
      if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_HOST) {
        try {
          logger.warn('[Mailer] Attempting JSON transport fallback for local development...');
          const fallbackTransporter = nodemailer.createTransport({ jsonTransport: true });
          const fallbackInfo = await fallbackTransporter.sendMail(mailOptions);
          logger.info(`[Mailer] Local JSON email delivered for ${to} (MessageId: ${fallbackInfo.messageId})`);
          return { success: true, messageId: fallbackInfo.messageId, previewUrl: null };
        } catch (fallbackErr) {
          logger.error('[Mailer] JSON transport fallback also failed:', fallbackErr.message);
        }
      }

      throw new Error(`Email delivery service failed: ${err.message}`);
    }
  },

  /**
   * Sends real approval notification email when Admin verifies hospital
   */
  async sendApprovalEmail({ to, hospitalName, loginUrl = 'http://localhost:5173/login' }) {
    try {
      const transporter = await getTransporter();
      const fromAddress = process.env.EMAIL_FROM || '"MedEx Administration" <admin@medex.org>';

      const mailOptions = {
        from: fromAddress,
        to,
        subject: 'Hospital Registration Approved — Welcome to MedEx',
        text: `Dear ${hospitalName},\n\nWe are pleased to inform you that your hospital registration application has been reviewed and approved by MedEx Platform Administration.\n\nYour institutional account is now active with full operational privileges. You can now sign in to access the MedEx Hospital Portal, manage your medicine inventory, and participate in inter-hospital emergency medicine exchanges.\n\nSign in here: ${loginUrl}\n\nMedEx Healthcare Logistics Oversight.`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 16px; background-color: #FFFFFF;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 24px; font-weight: 900; color: #0F172A; letter-spacing: -0.5px;">Med<span style="color: #0D9488;">Ex</span></span>
              <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">National Healthcare Logistics & Exchange</div>
            </div>

            <div style="padding: 24px; background-color: #F0FDF4; border-radius: 12px; border: 1px solid #BBF7D0; text-align: center;">
              <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 50%; background-color: #DCFCE7; color: #15803D; font-size: 22px; margin-bottom: 12px;">
                ✓
              </div>
              <h2 style="font-size: 20px; font-weight: 800; color: #14532D; margin: 0 0 8px 0;">Hospital Registration Approved</h2>
              <p style="font-size: 13px; color: #166534; margin: 0 0 20px 0; line-height: 1.5;">
                Your hospital application for <strong>${hospitalName}</strong> has been audited and approved by central logistics administration.
              </p>

              <div style="background-color: #FFFFFF; border-radius: 8px; border: 1px solid #DCFCE7; padding: 14px; text-align: left; margin-bottom: 20px;">
                <div style="font-size: 11px; font-weight: 700; color: #15803D; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Activated Privileges:</div>
                <div style="font-size: 12px; color: #334155; line-height: 1.6;">
                  • Operational access to the MedEx Hospital Portal<br />
                  • Real-time cold-chain inter-hospital medicine exchange<br />
                  • Verified statutory inventory management & requisition trading
                </div>
              </div>

              <a href="${loginUrl}" style="display: inline-block; padding: 12px 28px; background-color: #0D9488; color: #FFFFFF; font-size: 13px; font-weight: 700; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(13, 148, 136, 0.2);">
                Sign In to MedEx Portal →
              </a>
            </div>

            <div style="margin-top: 24px; font-size: 11px; color: #94A3B8; line-height: 1.5; text-align: center;">
              MedEx Central Healthcare Logistics Oversight<br />
              Need assistance? Contact our statutory compliance desk at support@medex.org
            </div>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        logger.info(`[Mailer] Approval email sent to ${to}. Preview URL: ${previewUrl}`);
      } else {
        logger.info(`[Mailer] Approval email dispatched successfully to ${to}`);
      }

      return { success: true, messageId: info.messageId, previewUrl };
    } catch (err) {
      logger.error('[Mailer] Failed to send approval email:', err.message);
      // Non-fatal warning so approval transaction succeeds even if SMTP is unreachable
      return { success: false, error: err.message };
    }
  },

  /**
   * Sends correction requested notification email when Admin requests correction
   */
  async sendCorrectionEmail({ to, hospitalName, reason, resubmitUrl = 'http://localhost:5173/hospital-signup' }) {
    try {
      const transporter = await getTransporter();
      const fromAddress = process.env.EMAIL_FROM || '"MedEx Administration" <admin@medex.org>';

      const mailOptions = {
        from: fromAddress,
        to,
        subject: 'MedEx Hospital Registration — Action Required',
        text: `Dear ${hospitalName},\n\nYour hospital registration application requires correction before it can be approved.\n\nReason: ${reason}\n\nPlease update your application here: ${resubmitUrl}\n\nMedEx Healthcare Logistics Oversight.`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 16px; background-color: #FFFFFF;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 24px; font-weight: 900; color: #0F172A; letter-spacing: -0.5px;">Med<span style="color: #0D9488;">Ex</span></span>
              <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">National Healthcare Logistics & Exchange</div>
            </div>

            <div style="padding: 24px; background-color: #FFFBEB; border-radius: 12px; border: 1px solid #FDE68A; text-align: center;">
              <h2 style="font-size: 18px; font-weight: 800; color: #78350F; margin: 0 0 8px 0;">Application Requires Correction</h2>
              <p style="font-size: 13px; color: #92400E; margin: 0 0 16px 0; line-height: 1.5;">
                Administrative review of <strong>${hospitalName}</strong> identified statutory items requiring correction:
              </p>

              <div style="background-color: #FFFFFF; border-radius: 8px; border: 1px solid #FCD34D; padding: 14px; text-align: left; margin-bottom: 20px; font-size: 12px; color: #92400E; font-weight: 600;">
                "${reason}"
              </div>

              <a href="${resubmitUrl}" style="display: inline-block; padding: 12px 28px; background-color: #D97706; color: #FFFFFF; font-size: 13px; font-weight: 700; text-decoration: none; border-radius: 10px;">
                Update & Resubmit Application →
              </a>
            </div>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      logger.error('[Mailer] Failed to send correction email:', err.message);
      return { success: false, error: err.message };
    }
  },
};

module.exports = mailerService;
