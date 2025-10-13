import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { Resolver, Query } from '@nestjs/graphql';
import { AuthModule } from './features/auth/auth.module';
import { PrismaModule } from '@/prisma/prisma.module';

@Resolver()
export class AppResolver {
  @Query(() => String, { name: 'health' })
  health(): string {
    return 'ok';
  }
}

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'), // auto-generate schema in project root
      context: ({ req, res }) => ({ req, res }),
      playground: process.env.NODE_ENV !== 'production',
      csrfPrevention: process.env.NODE_ENV !== 'production',
      introspection: process.env.NODE_ENV !== 'production',
    }),
  ],
  providers: [AppResolver], // Minimal setup
})
export class AppModule {}
