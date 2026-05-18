import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { InvitationService } from './services/invitation.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from './enums/user-role.enum';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly invitationService: InvitationService) {}

  /**
   * POST /admin/invitations
   * Send an officer invitation to an email address.
   * - If the user already exists, their role is updated to OFFICER immediately.
   * - If not, a one-time invitation link (valid 10 minutes) is emailed to them.
   */
  @Post('invitations')
  sendInvitation(@Body() dto: CreateInvitationDto) {
    return this.invitationService.createInvitation(dto.email);
  }
}
