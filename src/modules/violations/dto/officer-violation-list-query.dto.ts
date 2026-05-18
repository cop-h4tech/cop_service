import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDTO } from '../../../common/dto/pagination-query.dto';
import { ViolationStatus } from '../entities/violation.entity';

export class OfficerViolationListQueryDto extends PaginationQueryDTO {
  @IsOptional()
  @IsEnum(ViolationStatus)
  status?: ViolationStatus;
}
