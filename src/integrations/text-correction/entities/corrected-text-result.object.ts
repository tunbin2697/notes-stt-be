import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CorrectedTextResult {
  @Field(() => String, { description: 'Corrected text from the AI model' })
  corrected: string;

  @Field(() => Float, {
    description: 'Time taken by the AI model to process (in seconds)',
  })
  computeTimeSec: number;
}
