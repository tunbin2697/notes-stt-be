import { Injectable, Logger } from '@nestjs/common';
import { TEXT_CORRECTION_CONFIG } from './text-correction.config';
import { BusinessRuleException } from '@/common/exceptions/business-rule.exception';

export interface TextCorrectionResponse {
  corrected: string;
  compute_time_sec: number;
}

@Injectable()
export class TextCorrectionClient {
  private readonly logger = new Logger(TextCorrectionClient.name);
  private readonly serviceUrl = TEXT_CORRECTION_CONFIG.serviceUrl;
  private readonly timeout = TEXT_CORRECTION_CONFIG.timeout;

  /**
   * Call Flask text-correction microservice
   * POST https://notes-stt-correct.baokhangdev.click/correct
   * Body: { "text": "..." }
   * Response: { "corrected": "...", "compute_time_sec": 1.234 }
   */
  async correctText(text: string): Promise<TextCorrectionResponse> {
    if (!text || text.trim().length === 0) {
      throw new BusinessRuleException('Text cannot be empty');
    }

    const url = `${this.serviceUrl}/correct`;
    const payload = { text };

    this.logger.log(`Calling text-correction service: ${url}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 400) {
          const error = await response.json().catch(() => ({}));
          throw new BusinessRuleException(
            error.message || 'Invalid text format',
          );
        }

        if (response.status >= 500) {
          throw new BusinessRuleException(
            'Text correction service encountered an error. Please try again later.',
          );
        }

        throw new BusinessRuleException(
          `Text correction service returned status ${response.status}`,
        );
      }

      const data: TextCorrectionResponse = await response.json();

      this.logger.log(`Text correction completed in ${data.compute_time_sec}s`);

      return data;
    } catch (error: any) {
      this.logger.error('Text correction service error:', error.message);

      if (error instanceof BusinessRuleException) {
        throw error;
      }

      if (error.name === 'AbortError') {
        throw new BusinessRuleException(
          'Text correction service timed out. Please try with shorter text.',
        );
      }

      if (
        error.code === 'ECONNREFUSED' ||
        error.message?.includes('fetch failed')
      ) {
        throw new BusinessRuleException(
          'Text correction service is unavailable. Please try again later.',
        );
      }

      throw new BusinessRuleException(
        'Failed to correct text. Please try again.',
      );
    }
  }
}
