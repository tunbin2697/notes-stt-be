import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

import { PrismaService } from './prisma.service';
import { NotesModule } from './notes/notes.module';

@Module({
  imports: [
    NotesModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'), // auto-generate schema in project root
      playground: true, // optional
    }),
  ],
  providers: [PrismaService], // Prisma is now global provider
})
export class AppModule {}
