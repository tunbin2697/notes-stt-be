import { ArgsType, Field, Int } from '@nestjs/graphql';
import { Min, Max, IsOptional, IsInt } from 'class-validator';

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 20;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsInt({ message: 'Offset must be an integer' })
  @Min(0, { message: 'Offset must be at least 0' })
  offset?: number = 0;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt({ message: 'Cursor must be an integer' })
  @Min(1, { message: 'Cursor must be a positive integer' })
  cursor?: number; // For cursor-based pagination
}
