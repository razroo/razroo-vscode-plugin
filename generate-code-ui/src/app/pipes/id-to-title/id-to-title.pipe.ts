import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'idToTitle'
})
export class IdToTitlePipe implements PipeTransform {

  transform(id: string): unknown {
    if(id) {
      return id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    else {
      return;
    }

  }

}
