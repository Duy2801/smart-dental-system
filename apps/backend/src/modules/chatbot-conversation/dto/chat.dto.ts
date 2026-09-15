import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateBy,
  ValidateNested,
} from 'class-validator';

function boundedJson(value: unknown, depth = 0): boolean {
  if (depth > 6) return false;
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string') return value.length <= 8000;
  if (Array.isArray(value))
    return (
      value.length <= 64 && value.every((item) => boundedJson(item, depth + 1))
    );
  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    return (
      entries.length <= 64 &&
      entries.every(
        ([key, item]) =>
          key.length <= 100 &&
          !['__proto__', 'constructor', 'prototype'].includes(key) &&
          boundedJson(item, depth + 1),
      )
    );
  }
  return false;
}

export function BoundedMetadata() {
  return ValidateBy({
    name: 'boundedMetadata',
    validator: {
      validate: (value: unknown) => {
        try {
          return boundedJson(value) && JSON.stringify(value).length <= 16000;
        } catch {
          return false;
        }
      },
      defaultMessage: () => 'metadata exceeds allowed JSON bounds',
    },
  });
}

export class ChatMessageDto {
  @IsString()
  @IsIn(['user', 'assistant'])
  role: string;

  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  content: string;

  @IsObject()
  @IsOptional()
  @BoundedMetadata()
  metadata?: Record<string, unknown>;
}

export class PatientChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  message: string;

  @IsArray()
  @IsOptional()
  @ArrayMaxSize(60)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history?: ChatMessageDto[];

  @IsString()
  @IsOptional()
  @MaxLength(100)
  patientId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  patientName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  patientPhone?: string;

  @IsObject()
  @IsOptional()
  @BoundedMetadata()
  metadata?: Record<string, unknown>;
}

export class ChatSuggestionDto {
  @IsString() @MaxLength(60) type: string;
  @IsString() @MaxLength(200) label: string;
  @IsString() @MaxLength(8000) value: string;
  @IsOptional() @IsObject() @BoundedMetadata() metadata?: Record<
    string,
    unknown
  >;
}

export class ChatSourceDto {
  @IsString() @MaxLength(200) label: string;
  @IsString() @MaxLength(60) kind: string;
}

export class ChatHistoryMessageDto {
  @IsString() @MinLength(1) @MaxLength(100) id: string;
  @IsIn(['user', 'bot']) sender: 'user' | 'bot';
  @IsString() @MinLength(1) @MaxLength(8000) text: string;
  @IsOptional() @IsObject() @BoundedMetadata() metadata?: Record<
    string,
    unknown
  >;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => ChatSuggestionDto)
  suggestions?: ChatSuggestionDto[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => ChatSourceDto)
  sources?: ChatSourceDto[];
}

export class ChatHistoryDto {
  @IsArray()
  @ArrayMaxSize(60)
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryMessageDto)
  messages: ChatHistoryMessageDto[];
}
