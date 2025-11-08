import { Injectable } from '@nestjs/common';
import { TextCorrectionClient } from './text-correction.client';
import { CorrectedTextResult } from './entities/corrected-text-result.object';

@Injectable()
export class TextCorrectionService {
  constructor(private readonly client: TextCorrectionClient) {}

  async correctText(text: string): Promise<CorrectedTextResult> {
    const result = await this.client.correctText(text);

    return {
      corrected: result.corrected,
      computeTimeSec: result.compute_time_sec,
    };
  }
}
