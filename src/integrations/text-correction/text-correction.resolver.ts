import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '@/common/security/guards/gql-auth.guard';
import { TextCorrectionService } from './text-correction.service';
import { CorrectTextInput } from './dto/correct-text.input';
import { CorrectedTextResult } from './entities/corrected-text-result.object';

@Resolver()
export class TextCorrectionResolver {
  constructor(private readonly textCorrectionService: TextCorrectionService) {}

  @Mutation(() => CorrectedTextResult, {
    description:
      'Correct Vietnamese text using AI model (requires authentication)',
  })
  @UseGuards(GqlAuthGuard)
  async correctText(
    @Args('input') input: CorrectTextInput,
  ): Promise<CorrectedTextResult> {
    return this.textCorrectionService.correctText(input.text);
  }
}
