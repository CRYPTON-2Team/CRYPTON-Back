import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyAccessKeyDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  accessKey: string;
}