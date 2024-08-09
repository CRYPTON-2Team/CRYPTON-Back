import { IsNumber, IsArray, Min, IsEmail, IsInt, Max } from 'class-validator';

export class CreateFileShareDto {
  @IsNumber()
  fileId: number;

  @IsNumber()
  @IsInt()
  @Min(1)
  @Max(168) // 최대 7일
  expiresInHours: number;

  @IsArray()
  @IsEmail({}, { each: true })
  recipientEmails: string[];
}
