import { Pipe, PipeTransform } from '@angular/core';
import { Organization } from '../../interfaces/organizations.interfaces';

@Pipe({
  name: 'zetaOrganizations'
})
export class OrganizationsPipe implements PipeTransform {

  transform(activeOrgId: string, organizations: Organization[]): Organization[] {
    return organizations ? organizations.map(organization => {
      if(organization.userId === organization.orgId) {
        return {
          ...organization,
          displayName: 'Personal Workspace'
        };
      } else {
        return organization;
      }
    }).filter(organization => organization.orgId !== activeOrgId) : [];
  }

}
