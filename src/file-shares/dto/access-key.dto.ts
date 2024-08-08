import { IsString, IsNotEmpty } from 'class-validator';

export class AccessFileShareDto {
  @IsString()
  @IsNotEmpty()
  accessKey: string;
}
