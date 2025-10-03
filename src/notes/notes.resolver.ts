import { Resolver, Query } from '@nestjs/graphql';
import { NotesService } from './notes.service';

@Resolver()
export class NotesResolver {
  constructor(private readonly notesService: NotesService) {}

  @Query(() => String)
  hello(): string {
    return 'Hello World!';
  }

  @Query(() => [String])
  notes(): any[] {
    return this.notesService.findAll();
  }
}
