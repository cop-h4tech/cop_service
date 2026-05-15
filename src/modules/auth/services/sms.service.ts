import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import twilio, { Twilio } from 'twilio';
import { maskPhone } from '../utils/mask.util';

@Injectable()
export class SMSService {
  private readonly logger = new Logger(SMSService.name);

  private readonly twilioClient: Twilio;

  private readonly verifyServiceSid: string;


  constructor(
    private readonly configService: ConfigService,
  ) {
    const accountSid =
      this.configService.get<string>('TWILIO_ACCOUNT_SID');

    const authToken =
      this.configService.get<string>('TWILIO_AUTH_TOKEN');

    this.verifyServiceSid =
      this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID') as string;

    if (!accountSid || !authToken || !this.verifyServiceSid) {
      throw new Error('Twilio Verify configuration is missing');
    }

    this.fromPhone = this.configService.get<string>('TWILIO_PHONE_NUMBER');

    this.twilioClient = twilio(accountSid, authToken);
  }

  async sendOTP(phone: string): Promise<void> {
    try {
      const response = await this.twilioClient.verify.v2
        .services(this.verifyServiceSid)
        .verifications.create({
          to: phone,
          channel: 'sms',
        });

      this.logger.log(
        `OTP sent to ${maskPhone(phone)}. Status: ${response.status}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send OTP to ${maskPhone(phone)}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new BadRequestException('Failed to send OTP');
    }
  }

  async sendMessage(to: string, body: string): Promise<void> {
    if (!this.fromPhone) {
      this.logger.warn('TWILIO_PHONE_NUMBER not configured — skipping SMS notification');
      return;
    }
    try {
      await this.twilioClient.messages.create({ to, from: this.fromPhone, body });
      this.logger.log(`SMS sent to ${maskPhone(to)}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${maskPhone(to)}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async verifyOTP(phone: string, code: string): Promise<boolean> {
    try {
      const response = await this.twilioClient.verify.v2
        .services(this.verifyServiceSid)
        .verificationChecks.create({
          to: phone,
          code,
        });

      return response.status === 'approved';
    } catch (error) {
      this.logger.error(
        `OTP verification failed for ${maskPhone(phone)}`,
        error instanceof Error ? error.stack : undefined,
      );

      return false;
    }
  }
}
