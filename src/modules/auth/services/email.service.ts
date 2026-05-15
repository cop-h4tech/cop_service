import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { maskEmail } from '../utils/mask.util';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  async sendViolationConfirmation(to: string, ticketNumber: string): Promise<void> {
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px;">
        <h2 style="color:#1d4ed8;margin-bottom:8px;">Citizen On Petrol</h2>
        <p style="color:#374151;">Your violation has been successfully submitted.</p>
        <div style="background:#f3f4f6;border-radius:6px;padding:16px 24px;margin:16px 0;text-align:center;">
          <span style="font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Ticket Number</span><br/>
          <span style="font-size:22px;font-weight:bold;color:#1d4ed8;">${ticketNumber}</span>
        </div>
        <p style="color:#374151;">Thank you for your public engagement! If the violation is paid you will receive <strong>25% of the ticket payment</strong>.</p>
        <p style="color:#6b7280;font-size:13px;">Keep your ticket number for tracking purposes.</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"Citizen On Petrol" <${this.configService.get<string>('MAIL_USER')}>`,
        to,
        subject: `Violation Submitted – Ticket ${ticketNumber}`,
        html,
      });
      this.logger.log(`Violation confirmation email sent to ${maskEmail(to)}`);
    } catch (error) {
      this.logger.error(`Failed to send violation confirmation to ${maskEmail(to)}`, error);
      throw error;
    }
  }

  async sendOTP(to: string, otp: string, purpose: string): Promise<void> {
    const subject = this.getSubject(purpose);
    const html = this.buildOtpEmail(otp, purpose);

    try {
      await this.transporter.sendMail({
        from: `"Citizen On Petrol" <${this.configService.get<string>('MAIL_USER')}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`OTP email sent to ${maskEmail(to)}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${maskEmail(to)}`, error);
      throw error;
    }
  }

  private getSubject(purpose: string): string {
    const subjects: Record<string, string> = {
      signup: 'Verify your Citizen On Petrol account',
      signin: 'Your Citizen On Petrol sign-in OTP',
      profile_update: 'Verify your Citizen On Petrol profile update',
    };
    return subjects[purpose] ?? 'Your Citizen On Petrol OTP';
  }

  private buildOtpEmail(otp: string, purpose: string): string {
    return `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px;">
        <h2 style="color:#1d4ed8;margin-bottom:8px;">Citizen On Petrol</h2>
        <p style="color:#374151;">Your one-time password for <strong>${purpose.replace('_', ' ')}</strong>:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1d4ed8;text-align:center;padding:24px 0;">
          ${otp}
        </div>
        <p style="color:#6b7280;font-size:13px;">This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      </div>
    `;
  }
}
