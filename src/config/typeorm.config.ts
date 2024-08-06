import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmModuleOptions: Partial<TypeOrmModuleOptions> = {
  type: 'postgres',
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  synchronize: false,
};

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions =>
  ({
    ...typeOrmModuleOptions,
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_DATABASE'),
    synchronize: configService.get<string>('NODE_ENV') !== 'production',
  }) as TypeOrmModuleOptions;
