import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { NotesResolver } from './notes.resolver';

@Module({
  controllers: [NotesController],
  providers: [NotesService, NotesResolver],
})
export class NotesModule {}
