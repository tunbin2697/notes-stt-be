import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { Resolver, Query } from '@nestjs/graphql';
import { AuthModule } from './features/auth/auth.module';
import { UsersModule } from './features/user/users.module';
import { NotesModule } from './features/notes/notes.module';
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
    UsersModule,
    NotesModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'), // auto-generate schema in project root
      context: ({ req, res }) => ({ req, res }),
      formatError: (error) => {
        const isProduction = true; //temporary hardcode to true
        // const isProduction = process.env.NODE_ENV === 'production';
        if (isProduction) {
          const { message, extensions } = error as any;

          const safeExtensions: Record<string, any> = {};
          if (extensions?.statusCode)
            safeExtensions.statusCode = extensions.statusCode;
          if (extensions?.errorType)
            safeExtensions.errorType = extensions.errorType;

          return { message, extensions: safeExtensions };
        } else {
          // In development, return the error object as is (or use a simple default)
          // This ensures you see the full stack trace, path, etc., for debugging.
          return error;
        }
      },

      playground: process.env.NODE_ENV !== 'production',
      csrfPrevention: process.env.NODE_ENV !== 'production',
      introspection: process.env.NODE_ENV !== 'production',
    }),
  ],
  providers: [AppResolver],
})
export class AppModule {}
