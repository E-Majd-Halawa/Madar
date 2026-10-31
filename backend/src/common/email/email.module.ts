import { Global, Module } from '@nestjs/common';
import { EmailService, LogEmailService } from './email.service.js';

@Global()
@Module({
  providers: [
    LogEmailService,
    { provide: EmailService, useExisting: LogEmailService },
  ],
  exports: [EmailService],
})
export class EmailModule {}
