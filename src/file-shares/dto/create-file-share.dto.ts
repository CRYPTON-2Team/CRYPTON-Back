import { IsNumber, IsArray, IsOptional, Min, IsEmail } from 'class-validator';

export class CreateFileShareDto {
  @IsNumber()
  fileId: number;

  // @IsNumber()
  // userId: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  expiresInHours?: number;

  @IsArray()
  @IsEmail({}, { each: true })
  recipientEmails: string[];
}