import { Pipe, PipeTransform, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@Pipe({
  name: 'connectText'
})
export class ConnectTextPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}

@NgModule({
  imports: [CommonModule],
  declarations: [ConnectTextPipe],
  exports: [ConnectTextPipe],
})
export class ConnectTextModule {}
