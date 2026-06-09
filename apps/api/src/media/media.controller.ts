import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { MediaAsset } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/auth.types';
import { MediaService } from './media.service';
import { RegisterMediaDto, UploadUrlDto, type UploadedFile as MulterFile } from './dto';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Roles('user')
  @Post('upload-url')
  @ApiOperation({ summary: 'Get an upload descriptor' })
  uploadUrl(@Body() dto: UploadUrlDto): {
    storageKey: string;
    uploadUrl: string;
    method: string;
    mode: string;
  } {
    return this.media.createUploadDescriptor(dto);
  }

  @Roles('user')
  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload + register a media asset' })
  upload(
    @UploadedFile() file: MulterFile,
    @Body() dto: RegisterMediaDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MediaAsset> {
    return this.media.upload(file, dto, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Role-aware media URL' })
  get(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ id: string; type: string; mime: string; url: string }> {
    return this.media.getForRole(id, user);
  }

  @Public()
  @Get(':id/blob')
  @ApiOperation({ summary: 'Serve bytes — public for approved content, else signed token' })
  async blob(
    @Param('id') id: string,
    @Query('token') token: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, mime } = await this.media.serveBlob(id, token);
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.send(buffer);
  }

  @Roles('admin')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a media asset' })
  remove(@Param('id') id: string): Promise<{ id: string }> {
    return this.media.remove(id);
  }
}
