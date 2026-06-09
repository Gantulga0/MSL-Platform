import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export const MEDIA_OWNER_TYPES = ['word', 'word_variant', 'submission'] as const;
export const MEDIA_TYPES = ['video', 'image', 'thumbnail'] as const;
export const CONSENT_SCOPES = ['media_publish', 'data_processing'] as const;

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export class UploadUrlDto {
  @ApiProperty({ enum: MEDIA_OWNER_TYPES })
  @IsIn(MEDIA_OWNER_TYPES)
  ownerType!: (typeof MEDIA_OWNER_TYPES)[number];

  @ApiProperty({ enum: MEDIA_TYPES })
  @IsIn(MEDIA_TYPES)
  type!: (typeof MEDIA_TYPES)[number];

  @ApiProperty({ example: 'video/mp4' })
  @IsString()
  mime!: string;

  @ApiProperty({ example: 4_200_000 })
  @IsInt()
  @Min(1)
  sizeBytes!: number;
}

export class RegisterMediaDto {
  @ApiProperty({ enum: MEDIA_OWNER_TYPES })
  @IsIn(MEDIA_OWNER_TYPES)
  ownerType!: (typeof MEDIA_OWNER_TYPES)[number];

  @ApiPropertyOptional({ description: 'Owner entity id (may be set later on approval)' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiProperty({ enum: MEDIA_TYPES })
  @IsIn(MEDIA_TYPES)
  type!: (typeof MEDIA_TYPES)[number];

  @ApiPropertyOptional({ description: 'Consent record id (required before publish, AUTH-10)' })
  @IsOptional()
  @IsUUID()
  consentId?: string;
}

export class CreateConsentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subjectUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  guardianUserId?: string;

  @ApiProperty({ enum: CONSENT_SCOPES })
  @IsIn(CONSENT_SCOPES)
  scope!: (typeof CONSENT_SCOPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  documentRef?: string;
}
