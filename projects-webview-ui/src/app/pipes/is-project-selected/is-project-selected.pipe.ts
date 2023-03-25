import { ProjectConfig } from './../../interfaces/project-config.interfaces';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'isProjectSelected'
})
export class IsProjectSelectedPipe implements PipeTransform {
  transform(projectOption: ProjectConfig, selectedProjects?: ProjectConfig[]): unknown {
    if(projectOption && selectedProjects) {
      const condition = selectedProjects.some(option => option.packageJsonParams?.name === projectOption.packageJsonParams.name);
      console.log('condition');
      console.log(condition);
      return condition;
    }
    else {
      console.log('else called');
      return false;
    }
  }
}
