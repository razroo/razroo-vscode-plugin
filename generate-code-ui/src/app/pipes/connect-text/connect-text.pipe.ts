import { Pipe, PipeTransform, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectConfig } from '../../interfaces/project-config.interfaces';

@Pipe({
  name: 'connectText'
})
export class ConnectTextPipe implements PipeTransform {
  transform(selectedProjects?: ProjectConfig[], originalSelectedProjects?: ProjectConfig[]): unknown {
    if((selectedProjects && originalSelectedProjects) && selectedProjects?.length < originalSelectedProjects?.length && 
      selectedProjects.every(project => originalSelectedProjects.includes(project))) {
      return 'Disconnect'; 
    } else {
      return 'Connect';
    }
  }
}

@NgModule({
  imports: [CommonModule],
  declarations: [ConnectTextPipe],
  exports: [ConnectTextPipe],
})
export class ConnectTextModule {}
