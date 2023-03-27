import { Pipe, PipeTransform } from '@angular/core';
import { Organization } from '../../interfaces/organizations.interfaces';

@Pipe({
  name: 'zetaOrganizations'
})
export class OrganizationsPipe implements PipeTransform {

  transform(activeOrgId: string, organizations: Organization[]): Organization[] {
    const updatedOrganizations = organizations ? organizations.map(organization => {
      if(organization.userId === organization.orgId) {
        return {
          ...organization,
          displayName: 'Personal Workspace'
        };
      } else {
        return organization;
      }
    }) : [];
    const inactiveOrgs = updatedOrganizations.filter(organization => organization.orgId !== activeOrgId);
    const activeOrg = updatedOrganizations.find(org => org.orgId === activeOrgId);

    if (activeOrg) {
      return [activeOrg, ...inactiveOrgs];
    }

    return inactiveOrgs;
  }

}
