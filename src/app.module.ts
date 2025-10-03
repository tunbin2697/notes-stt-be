import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { Resolver, Query } from '@nestjs/graphql';

import { PrismaService } from '@/prisma/prisma.service';

@Resolver()
export class AppResolver {
  @Query(() => String)
  hello(): string {
    return 'Hello World!';
  }
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'), // auto-generate schema in project root
      playground: true, // optional
      csrfPrevention: true, // Disable CSRF for development
    }),
  ],
  providers: [PrismaService, AppResolver], // Minimal setup
})
export class AppModule {}
