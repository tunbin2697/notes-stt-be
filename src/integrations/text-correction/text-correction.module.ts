import { Module } from '@nestjs/common';
import { TextCorrectionClient } from './text-correction.client';
import { TextCorrectionService } from './text-correction.service';
import { TextCorrectionResolver } from './text-correction.resolver';

@Module({
  providers: [
    TextCorrectionClient,
    TextCorrectionService,
    TextCorrectionResolver,
  ],
  exports: [TextCorrectionService],
})
export class TextCorrectionModule {}
