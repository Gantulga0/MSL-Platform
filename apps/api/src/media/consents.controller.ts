import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/auth.types';
import { MediaService } from './media.service';
import { CreateConsentDto } from './dto';

@ApiTags('media')
@Controller('consents')
export class ConsentsController {
  constructor(private readonly media: MediaService) {}

  @Roles('user')
  @Post()
  @ApiOperation({ summary: 'Create a media-consent record' })
  create(
    @Body() dto: CreateConsentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ id: string }> {
    return this.media.createConsent(dto, user.id);
  }
}
