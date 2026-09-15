import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  role: string;

  @IsString()
  content: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class PatientChatDto {
  @IsString()
  message: string;

  @IsArray()
  @IsOptional()
  history?: ChatMessageDto[];

  @IsString()
  @IsOptional()
  patientId?: string;

  @IsString()
  @IsOptional()
  patientName?: string;

  @IsString()
  @IsOptional()
  patientPhone?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
