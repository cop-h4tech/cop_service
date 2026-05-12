import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { SignUpDTO } from './dto/sign-up.dto';
import { LoginDTO } from './dto/sign-in.dto';
import { VerifyOTPDTO } from './dto/verify-otp.dto';
import { VerifySMSOTPDTO } from './dto/verify-sms-otp.dto';
import { ResetPasswordRequestDTO, ResetPasswordDTO } from './dto/reset-password.dto';
import { ChangePasswordDTO } from './dto/change-password.dto';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
// Restore when Twilio SMS is configured: import { SmsService } from './services/sms.service';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        // Inject when Twilio SMS is configured: private readonly smsService: SmsService,
    ) { }

    /**
     * POST /auth/signup
     * Register a new user. Password is optional at signup.
     */
    @Post('signup')
    async signUp(@Body() signUpDTO: SignUpDTO) {
        return this.authService.signUp(signUpDTO);
    }

    /**
     * POST /auth/login
     * Unified login endpoint.
     * - authMode "otp"      → sends OTP to email; follow up with POST /auth/login/otp
     * - authMode "password" → verifies password immediately and returns user
     */
    @Post('login')
    async login(@Body() loginDTO: LoginDTO) {
        return this.authService.login(loginDTO);
    }

    /**
     * POST /auth/login/otp
     * Step 2 of OTP login — submit the OTP received by email.
     */
    @Post('login/otp')
    async verifyLoginOTP(@Body() body: { email: string; code: string }) {
        return this.authService.verifyLoginOTP(body.email, body.code);
    }

    /**
     * POST /auth/verify/email-otp
     * Verify email OTP sent after signup to activate the account.
     */
    @Post('verify/email-otp')
    async verifyEmailOTP(@Body() verifyOTPDTO: VerifyOTPDTO) {
        return this.authService.verifyEmailOTP(verifyOTPDTO);
    }

    /**
     * POST /auth/logout
     * Revoke the session token to log out.
     */
    @Post('logout')
    async logout(@Headers('authorization') authorization: string) {
        const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : authorization;
        return this.authService.logout(token);
    }

    /**
     * POST /auth/reset-password/request
     * Send a password reset OTP to the registered email.
     */
    @Post('reset-password/request')
    async requestPasswordReset(@Body() dto: ResetPasswordRequestDTO) {
        return this.authService.requestPasswordReset(dto);
    }

    /**
     * POST /auth/reset-password
     * Verify reset OTP and set a new password.
     */
    @Post('reset-password')
    async resetPassword(@Body() dto: ResetPasswordDTO) {
        return this.authService.resetPassword(dto);
    }

    /**
     * POST /auth/change-password
     * Change password for an authenticated user.
     */
    @Post('change-password')
    @UseGuards(AuthGuard)
    async changePassword(
        @CurrentUser() user: { userId: string },
        @Body() dto: ChangePasswordDTO,
    ) {
        return this.authService.changePassword(user.userId, dto);
    }

    /**
     * POST /auth/verify/sms-otp
     * Verify SMS OTP — scaffolded, activate when Twilio is configured
     */
    @Post('verify/sms-otp')
    async verifyOTP(@Body() _verifySMSOTPDTO: VerifySMSOTPDTO) {
        // Uncomment when Twilio SMS is configured:
        // const verified = await this.smsService.verifyOTP(
        //     _verifySMSOTPDTO.phone,
        //     _verifySMSOTPDTO.code,
        // );
        // return {
        //     success: verified,
        //     message: verified ? 'OTP verified successfully' : 'Invalid OTP',
        // };
        return { message: 'SMS OTP verification not yet implemented' };
    }
}
