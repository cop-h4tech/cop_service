import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { SignUpDTO } from './dto/sign-up.dto';
import { LoginDTO } from './dto/sign-in.dto';
import { VerifyEmailOTPDTO } from './dto/verify-otp.dto';
import { VerifySMSOTPDTO } from './dto/verify-sms-otp.dto';
import { SendSMSOTPDTO } from './dto/send-otp.dto';
import { ResendEmailOTPDTO } from './dto/resend-otp.dto';
import { ResetPasswordRequestDTO, ResetPasswordDTO } from './dto/reset-password.dto';
import { ChangePasswordDTO } from './dto/change-password.dto';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) { }

    /**
     * POST /auth/signup
     * Register a new user. Sends OTP to email and SMS for verification.
     */
    @Post('signup')
    async signUp(@Body() signUpDTO: SignUpDTO) {
        return this.authService.signUp(signUpDTO);
    }

    /**
     * POST /auth/login
     * Unified login endpoint.
     * - authMode "otp"      → sends OTP to email; follow up with POST /auth/login/otp
     * - authMode "password" → verifies password immediately and returns token
     * - If account not active, resends OTPs to email and phone.
     */
    @Post('login')
    async login(@Body() loginDTO: LoginDTO) {
        return this.authService.login(loginDTO);
    }

    /**
     * POST /auth/login/otp
     * Step 2 of OTP login — submit the SMS OTP received on the registered phone.
     */
    @Post('login/otp')
    async verifyLoginOTP(@Body() dto: VerifySMSOTPDTO) {
        return this.authService.verifyLoginOTP(dto.phone, dto.code);
    }

    /**
     * POST /auth/verify/email-otp
     * Verify email OTP sent after signup.
     */
    @Post('verify/email-otp')
    async verifyEmailOTP(@Body() verifyOTPDTO: VerifyEmailOTPDTO) {
        return this.authService.verifyEmailOTP(verifyOTPDTO);
    }

    /**
     * POST /auth/verify/sms-otp
     * Verify SMS OTP sent via Twilio after signup.
     * Both email and phone must be verified for account to become active.
     */
    @Post('verify/sms-otp')
    async verifySMSOTP(@Body() dto: VerifySMSOTPDTO) {
        return this.authService.verifySMSOTP(dto.phone, dto.code);
    }

    /**
     * POST /auth/verify/resend-sms-otp
     * (Re)send an SMS OTP to the given phone number via Twilio.
     */
    @Post('verify/resend-sms-otp')
    async sendSMSOTP(@Body() dto: SendSMSOTPDTO) {
        return this.authService.sendSMSOTP(dto.phone);
    }

    /**
     * POST /auth/verify/resend-email-otp
     * Resend the email verification OTP for unverified accounts.
     */
    @Post('verify/resend-email-otp')
    async resendEmailOTP(@Body() dto: ResendEmailOTPDTO) {
        return this.authService.resendEmailOTP(dto.email);
    }

    /**
     * POST /auth/refresh
     * Exchange a valid refresh token for a new access + refresh token pair (rotation).
     */
    @Post('refresh')
    async refresh(@Body() body: { refreshToken: string }) {
        return this.authService.refresh(body.refreshToken);
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
     * POST /auth/verify/reset-password
     * Send a password reset OTP to the registered email.
     */
    @Post('verify/reset-password')
    async requestPasswordReset(@Body() dto: ResetPasswordRequestDTO) {
        return this.authService.requestPasswordReset(dto);
    }

    /**
     * POST /auth/password/reset
     * Verify reset OTP and set a new password.
     */
    @Post('password/reset')
    async resetPassword(@Body() dto: ResetPasswordDTO) {
        return this.authService.resetPassword(dto);
    }

    /**
     * POST /auth/password/change
     * Change password for an authenticated user.
     */
    @Post('password/change')
    @UseGuards(AuthGuard)
    async changePassword(
        @CurrentUser() user: { userId: string },
        @Body() dto: ChangePasswordDTO,
    ) {
        return this.authService.changePassword(user.userId, dto);
    }
}
