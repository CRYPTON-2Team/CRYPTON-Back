import { IsEnum } from 'class-validator';

export class UpdateAccessRequestDto {
  @IsEnum(['approved', 'rejected'])
  status: 'approved' | 'rejected';
}
