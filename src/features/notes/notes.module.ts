import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { NotesService } from './notes.service';
import { NotesResolver } from './notes.resolver';

@Module({
  imports: [PrismaModule],
  providers: [NotesService, NotesResolver],
  exports: [NotesService],
})
export class NotesModule {}
