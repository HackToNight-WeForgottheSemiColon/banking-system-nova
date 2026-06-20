import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import * as fs from 'fs'
import * as nodemailer from 'nodemailer'
import * as path from 'path'

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name)
  private transporter: nodemailer.Transporter | null = null
  private readonly emailsDir = path.resolve(process.cwd(), '../emails')

  onModuleInit() {
    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      this.logger.log('Initializing SMTP transport...')
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: smtpPort === '465',
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      })
    } else {
      this.logger.warn(
        'SMTP credentials not fully configured in environment. MailService running in Local Inspector Mode.'
      )
      // Ensure the /emails directory exists
      try {
        if (!fs.existsSync(this.emailsDir)) {
          fs.mkdirSync(this.emailsDir, { recursive: true })
        }
      } catch (err: any) {
        this.logger.error(
          `Failed to create emails directory at ${this.emailsDir}: ${err.message}`
        )
      }
    }
  }

  private wrapTemplate(subtitle: string, content: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f2f2; margin: 0; padding: 40px 0; color: #333333; }
    .card { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 10px 30px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: linear-gradient(135deg, #450043, #9a5c97); padding: 40px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px; }
    .header p { margin: 10px 0 0 0; font-size: 14px; opacity: 0.9; }
    .body { padding: 40px; line-height: 1.6; font-size: 15px; }
    .body h2 { color: #450043; margin-top: 0; font-size: 20px; border-bottom: 2px solid #f1f3f5; padding-bottom: 10px; }
    .footer { padding: 20px 40px; text-align: center; background-color: #fcfcfc; border-top: 1px solid #eeeeee; font-size: 12px; color: #999999; line-height: 1.4; }
    .btn { display: inline-block; padding: 14px 28px; background-color: #9a5c97; color: #ffffff !important; text-decoration: none; border-radius: 28px; font-weight: 700; margin-top: 20px; text-transform: uppercase; letter-spacing: 1px; font-size: 13px; text-align: center; }
    .btn:hover { background-color: #450043; }
    .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .details-table td { padding: 12px; border-bottom: 1px solid #f1f3f5; font-size: 14px; }
    .details-table td.label { font-weight: 600; color: #666666; width: 40%; }
    .details-table td.value { text-align: right; font-weight: 700; color: #111111; }
    .amount-large { font-size: 24px; font-weight: 800; color: #20c997; margin: 10px 0; }
    .amount-failed { font-size: 24px; font-weight: 800; color: #ff6b6b; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>NOVA BANK</h1>
      <p>${subtitle}</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      This is an automated notification from Nova Bank. Please do not reply directly to this email.<br>
      © 2026 Nova Bank. All rights reserved.
    </div>
  </div>
</body>
</html>`
  }

  async sendEmail(
    to: string,
    subject: string,
    subtitle: string,
    content: string
  ): Promise<void> {
    const html = this.wrapTemplate(subtitle, content)

    if (this.transporter) {
      try {
        const fromEmail =
          process.env.SMTP_FROM || '"Nova Bank Support" <support@novabank.test>'
        await this.transporter.sendMail({
          from: fromEmail,
          to,
          subject,
          html
        })
        this.logger.log(
          `SMTP Email sent successfully to ${to} (Subject: ${subject})`
        )
      } catch (err: any) {
        this.logger.error(`SMTP Email sending failed to ${to}: ${err.message}`)
      }
    } else {
      // Local Inspector fallback
      try {
        // Ensure directory exists again
        if (!fs.existsSync(this.emailsDir)) {
          fs.mkdirSync(this.emailsDir, { recursive: true })
        }

        const safeTo = to.replace(/[^a-zA-Z0-9]/g, '_')
        const filename = `sent-email-${Date.now()}-${safeTo}.html`
        const filepath = path.join(this.emailsDir, filename)

        fs.writeFileSync(filepath, html, 'utf8')

        // Convert to absolute URI for clickable link in terminal
        const fileUri = `file:///${filepath.replace(/\\/g, '/')}`
        this.logger.log(
          `[Local Mail Inspector] Email mock generated for ${to}:`
        )
        this.logger.log(`👉 ${fileUri}`)
      } catch (err: any) {
        this.logger.error(
          `Failed to write local mock email file: ${err.message}`
        )
      }
    }
  }

  async sendWelcomeEmail(to: string, name: string, accountNumber: string) {
    const subtitle = 'Welcome to Nova Bank!'
    const content = `
      <h2>Hello ${name},</h2>
      <p>Thank you for choosing Nova Bank. Your registration was completed successfully, and your default banking account has been created and activated.</p>
      <p>Here are your account details for your reference:</p>
      <table class="details-table">
        <tr>
          <td class="label">Account Holder</td>
          <td class="value">${name}</td>
        </tr>
        <tr>
          <td class="label">Account Number</td>
          <td class="value">${accountNumber}</td>
        </tr>
        <tr>
          <td class="label">Initial Balance</td>
          <td class="value">Rs. 1,000.00</td>
        </tr>
      </table>
      <p>You can now log in to the dashboard to monitor your spendings, configure category budgets, export statement PDFs, and schedule recurring transfers.</p>
      <div style="text-align: center;">
        <a href="http://localhost:3000/login" class="btn">Access Dashboard</a>
      </div>
    `
    await this.sendEmail(to, 'Welcome to Nova Bank!', subtitle, content)
  }

  async sendTransferSuccessEmail(
    to: string,
    name: string,
    fromAccount: string,
    toAccount: string,
    amount: number,
    referenceId: string
  ) {
    const subtitle = 'Transaction Successful'
    const content = `
      <h2>Fund Transfer Receipt</h2>
      <p>Dear ${name},</p>
      <p>We are pleased to inform you that your fund transfer has been completed successfully.</p>
      <div class="amount-large">Rs. ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      <table class="details-table">
        <tr>
          <td class="label">Reference ID</td>
          <td class="value">${referenceId}</td>
        </tr>
        <tr>
          <td class="label">Source Account</td>
          <td class="value">${fromAccount}</td>
        </tr>
        <tr>
          <td class="label">Recipient Account</td>
          <td class="value">${toAccount}</td>
        </tr>
        <tr>
          <td class="label">Date & Time</td>
          <td class="value">${new Date().toLocaleString()}</td>
        </tr>
      </table>
      <p>If you did not authorize this transaction, please contact Nova Bank Support immediately.</p>
    `
    await this.sendEmail(to, 'Nova Bank Transfer Receipt', subtitle, content)
  }

  async sendTransferFailedEmail(
    to: string,
    name: string,
    amount: number,
    toAccount: string,
    reason: string
  ) {
    const subtitle = 'Scheduled Transfer Failed'
    const content = `
      <h2>Alert: Scheduled Transfer Failed</h2>
      <p>Dear ${name},</p>
      <p>We attempted to execute your scheduled recurring transfer today, but the transaction could not be completed.</p>
      <div class="amount-failed">Rs. ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      <table class="details-table">
        <tr>
          <td class="label">Destination Account</td>
          <td class="value">${toAccount}</td>
        </tr>
        <tr>
          <td class="label">Failure Reason</td>
          <td class="value" style="color: #ff6b6b;">${reason}</td>
        </tr>
        <tr>
          <td class="label">Date Attempted</td>
          <td class="value">${new Date().toLocaleString()}</td>
        </tr>
      </table>
      <p>Please log in to your dashboard to review your account balance or adjust your scheduled payments.</p>
      <div style="text-align: center;">
        <a href="http://localhost:3000/login" class="btn">Manage Scheduled Payments</a>
      </div>
    `
    await this.sendEmail(
      to,
      'Alert: Scheduled Transfer Failed',
      subtitle,
      content
    )
  }

  async sendPasswordResetEmail(to: string, name: string) {
    const subtitle = 'Security Alert: Password Updated'
    const content = `
      <h2>Security Alert</h2>
      <p>Hello ${name},</p>
      <p>The password for your Nova Bank online profile was updated successfully on <strong>${new Date().toLocaleString()}</strong>.</p>
      <p>If you authorized this change, no further action is required.</p>
      <div style="background-color: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin-top: 20px; font-size: 14px; color: #991b1b;">
        <strong>Important:</strong> If you did not make this change, please click the link below to lock your account immediately and contact fraud prevention.
      </div>
      <div style="text-align: center;">
        <a href="http://localhost:3000/login" class="btn" style="background-color: #dc2626;">Lock My Account</a>
      </div>
    `
    await this.sendEmail(
      to,
      'Nova Bank Security Alert: Password Updated',
      subtitle,
      content
    )
  }
}
