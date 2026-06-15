import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { UploadedFile as MulterFile } from '../media/dto';
import { OptionImagesService } from './option-images.service';
import { TaxonomyService } from './taxonomy.service';
import { UploadOptionDto } from './dto';

@ApiTags('taxonomy')
@Controller('options')
export class OptionImagesController {
  constructor(
    private readonly optionImages: OptionImagesService,
    private readonly taxonomy: TaxonomyService,
  ) {}

  @Public()
  @Get('images/:kind/:file')
  @ApiOperation({ summary: 'Serve an option image (public)' })
  async image(
    @Param('kind') kind: string,
    @Param('file') file: string,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, mime } = await this.optionImages.serve(kind, file);
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  }

  @Roles('admin')
  @Post(':kind')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload an image + create a new option of this kind' })
  async upload(
    @Param('kind') kind: string,
    @UploadedFile() file: MulterFile,
    @Body() dto: UploadOptionDto,
  ): Promise<unknown> {
    const imageUrl = await this.optionImages.save(kind, file);
    const base = { code: dto.code, label: dto.label, imageUrl, sortOrder: dto.sortOrder };
    if (kind === 'handedness') {
      if (dto.handCount === undefined) {
        throw new BadRequestException('handCount is required for handedness');
      }
      return this.taxonomy.createHandedness({ ...base, handCount: dto.handCount });
    }
    throw new BadRequestException(`Unknown option kind: ${kind}`);
  }
}
