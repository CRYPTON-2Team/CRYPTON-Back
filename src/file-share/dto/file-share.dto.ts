import { IsNumber, IsString, IsEmail, IsUUID } from 'class-validator';

export class CreateShareLinkDto {
  @IsNumber()
  fileId: number;

  @IsNumber()
  expiresIn: number;
}

export class SendShareLinkEmailDto {
  @IsUUID()
  token: string;

  @IsEmail()
  recipientEmail: string;
}
