import { Injectable } from '@nestjs/common';

/**
 * Mock Email Service
 * In production, replace this with a real email service (SendGrid, AWS SES, etc.)
 * For now, it logs OTP codes to the console
 */
@Injectable()
export class EmailService {
  /**
   * Mock send OTP email
   * Logs to console instead of sending actual email
   */
  async sendPasswordResetOTP(email: string, otp: string): Promise<void> {
    console.log('\n========================================');
    console.log('📧 MOCK EMAIL - Password Reset OTP');
    console.log('========================================');
    console.log(`To: ${email}`);
    console.log(`Subject: Password Reset Code`);
    console.log(`\nYour password reset code is: ${otp}`);
    console.log(`This code will expire in 10 minutes.`);
    console.log('\nDo not share this code with anyone.');
    console.log('========================================\n');

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Mock send password changed notification
   */
  async sendPasswordChangedNotification(email: string): Promise<void> {
    console.log('\n========================================');
    console.log('📧 MOCK EMAIL - Password Changed');
    console.log('========================================');
    console.log(`To: ${email}`);
    console.log(`Subject: Your password has been changed`);
    console.log(`\nYour password was successfully changed.`);
    console.log(
      `If you did not make this change, please contact support immediately.`,
    );
    console.log('========================================\n');

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Generate a 6-digit OTP code
   */
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
