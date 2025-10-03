import { Injectable } from '@nestjs/common';

@Injectable()
export class NotesService {
  findAll() {
    return [
      { id: 1, title: 'Sample Note', content: 'This is a sample note' },
      { id: 2, title: 'Another Note', content: 'This is another sample note' },
    ];
  }
}
