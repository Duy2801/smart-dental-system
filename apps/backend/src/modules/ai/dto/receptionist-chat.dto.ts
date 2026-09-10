import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';

export class ReceptionistChatMessageDto {
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  @MaxLength(4000)
  content: string;
}

export class ReceptionistChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message: string;

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ReceptionistChatMessageDto)
  history: ReceptionistChatMessageDto[] = [];
}
