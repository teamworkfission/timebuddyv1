import { IsIn, IsNotEmpty } from 'class-validator';

export class UpdateJoinRequestDto {
  @IsNotEmpty()
  @IsIn(['accepted', 'declined'])
  status: 'accepted' | 'declined';
}
