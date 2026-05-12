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
