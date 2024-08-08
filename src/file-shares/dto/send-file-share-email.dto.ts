import { IsString, IsArray, IsEmail, IsNotEmpty } from 'class-validator';

export class SendFileShareEmailDto {
  @IsString()
  @IsEmail({}, { each: true })
  to: string;

  @IsString()
  subject: string;

  @IsString()
  text?: string;

  @IsString()
  html?: string;
}
