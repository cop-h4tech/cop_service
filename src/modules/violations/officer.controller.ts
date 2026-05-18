import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { ViolationsService } from './violations.service';
import { OfficerViolationListQueryDto } from './dto/officer-violation-list-query.dto';

@Controller('officer/violations')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.OFFICER, UserRole.ADMIN)
export class OfficerController {
  constructor(private readonly violationsService: ViolationsService) {}

  @Get()
  findAll(@Query() query: OfficerViolationListQueryDto) {
    return this.violationsService.findAllForOfficer(query);
  }
}
