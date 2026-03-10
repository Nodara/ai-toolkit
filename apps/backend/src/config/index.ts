import { ConfigModule } from '@nestjs/config';
import { AppConfigService } from './app-config.service';

export const AppConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: ['.env', '../../../.env'],
});

export { AppConfigService };
