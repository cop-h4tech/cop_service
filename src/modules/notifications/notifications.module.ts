import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { SMSService } from './sms.service';

@Global()
@Module({
  providers: [EmailService, SMSService],
  exports: [EmailService, SMSService],
})
export class NotificationsModule {}
