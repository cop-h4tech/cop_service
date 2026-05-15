import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UpdateProfileDTO } from './dto/update-profile.dto';
import { PaymentInfoEntity } from './entities/payment-info.entity';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('profile')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get()
  async getProfile(@CurrentUser() user: { userId: string }) {
    return this.userService.getProfile(user.userId);
  }

  @Patch()
  async updateProfile(
    @CurrentUser() user: { userId: string },
    @Body() updateProfileDTO: UpdateProfileDTO,
  ) {
    return this.userService.updateProfile(user.userId, updateProfileDTO);
  }

  @Patch('payment-info')
  async updatePaymentInfo(
    @CurrentUser() user: { userId: string },
    @Body() paymentData: Partial<PaymentInfoEntity>,
  ) {
    return this.userService.updatePaymentInfo(user.userId, paymentData);
  }
}
