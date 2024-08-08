import { IsString, IsArray, IsEmail, IsNotEmpty } from 'class-validator';

export class SendFileShareEmailDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsArray()
  @IsEmail({}, { each: true })
  recipientEmails: string[];
}