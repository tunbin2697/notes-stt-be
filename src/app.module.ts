import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { Resolver, Query } from '@nestjs/graphql';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from '@/prisma/prisma.module';

@Resolver()
export class AppResolver {
  @Query(() => String)
  hello(): string {
    return 'Hello World!';
  }
}

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'), // auto-generate schema in project root
      playground: true, // optional
      csrfPrevention: false, // Disable CSRF for development
    }),
  ],
  providers: [AppResolver], // Minimal setup
})
export class AppModule {}
