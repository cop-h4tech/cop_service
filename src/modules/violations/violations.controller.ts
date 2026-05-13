import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ViolationsService } from './violations.service';
import { SubmitViolationDto } from './dto/submit-violation.dto';
import { MediaType } from './entities/violation.entity';

const PHOTO_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VIDEO_MIMES = new Set(['video/mp4', 'video/quicktime', 'video/x-msvideo']);
const PHOTO_MAX_BYTES = 10 * 1024 * 1024;
const VIDEO_MAX_BYTES = 100 * 1024 * 1024;

@Controller('violations')
@UseGuards(AuthGuard)
export class ViolationsController {
  constructor(private readonly violationsService: ViolationsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('media', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        const mediaType = (req.body as { mediaType?: string })?.mediaType;
        if (mediaType === MediaType.PHOTO && PHOTO_MIMES.has(file.mimetype)) {
          return cb(null, true);
        }
        if (mediaType === MediaType.VIDEO && VIDEO_MIMES.has(file.mimetype)) {
          return cb(null, true);
        }
        cb(
          new BadRequestException(
            `Invalid file type "${file.mimetype}" for mediaType "${mediaType ?? 'unknown'}"`,
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
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Media file is required');
    }
    if (dto.mediaType === MediaType.PHOTO && file.size > PHOTO_MAX_BYTES) {
      throw new BadRequestException('Photo must be 10 MB or smaller');
    }
    return this.violationsService.submit(user.userId, dto, file);
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
