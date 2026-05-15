import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ViolationsService } from './violations.service';
import { SubmitViolationDto } from './dto/submit-violation.dto';
import { PHOTO_MIMES, VIDEO_MIMES } from './violations.constants';
const PHOTO_MAX_BYTES = 10 * 1024 * 1024;
const VIDEO_MAX_BYTES = 100 * 1024 * 1024;
const PHOTO_MAX_COUNT = 5;
const VIDEO_MAX_COUNT = 3;
const TOTAL_MAX_COUNT = PHOTO_MAX_COUNT + VIDEO_MAX_COUNT;

@Controller('violations')
@UseGuards(AuthGuard)
export class ViolationsController {
  constructor(private readonly violationsService: ViolationsService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('media', TOTAL_MAX_COUNT, {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (PHOTO_MIMES.has(file.mimetype) || VIDEO_MIMES.has(file.mimetype)) {
          return cb(null, true);
        }
        cb(
          new BadRequestException(
            `Unsupported file type "${file.mimetype}". Accepted images: JPEG, PNG, WebP, AVIF, HEIC, GIF. Accepted videos: MP4, MOV, AVI, MPEG, WebM, 3GP, MKV`,
          ),
          false,
        );
      },
      limits: { fileSize: VIDEO_MAX_BYTES },
    }),
  )
  async submit(
    @CurrentUser() user: { userId: string },
    @Body() dto: SubmitViolationDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one media file is required');
    }

    const photos = files.filter((f) => PHOTO_MIMES.has(f.mimetype));
    const videos = files.filter((f) => VIDEO_MIMES.has(f.mimetype));

    if (photos.length > PHOTO_MAX_COUNT) {
      throw new BadRequestException(`Maximum ${PHOTO_MAX_COUNT} photos per submission`);
    }

    if (videos.length > VIDEO_MAX_COUNT) {
      throw new BadRequestException(`Maximum ${VIDEO_MAX_COUNT} videos per submission`);
    }

    const oversized = photos.find((f) => f.size > PHOTO_MAX_BYTES);
    if (oversized) {
      throw new BadRequestException(`Photo "${oversized.originalname}" exceeds the 10 MB limit`);
    }

    return this.violationsService.submit(user.userId, dto, files);
  }

  @Get()
  async findAll(@CurrentUser() user: { userId: string }) {
    return this.violationsService.findAllByUser(user.userId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: { userId: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.violationsService.findOneByUser(id, user.userId);
  }
}
