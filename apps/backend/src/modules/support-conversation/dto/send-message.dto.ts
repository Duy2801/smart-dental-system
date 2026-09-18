import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendSupportMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content: string;
}
