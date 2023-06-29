import { Component, OnInit } from "@angular/core";
import { provideVSCodeDesignSystem, vsCodeButton, vsCodeDropdown, vsCodeOption, vsCodeCheckbox, vsCodeTextField } from "@vscode/webview-ui-toolkit";
import { ProjectConfig } from "./interfaces/project-config.interfaces";
import { vscode } from "./utilities/vscode";
import {FormControl} from '@angular/forms';
import { starterSteps } from "./data/starter-steps";

// In order to use the Webview UI Toolkit web components they
// must be registered with the browser (i.e. webview) using the
// syntax below.
provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeOption(), vsCodeDropdown(), vsCodeCheckbox(), vsCodeTextField());

// To register more toolkit components, simply import the component
// registration function and call it from within the register
// function, like so:
//
// provideVSCodeDesignSystem().register(
//   vsCodeButton(),
//   vsCodeCheckbox()
// );

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit {
  title = "hello-world";
  authIsLoading = false;
  organizationsLoading = false;
  isAuthenticated = false;
  loggingOutLoading = false;
  projectConfigs: ProjectConfig[] = [];
  selectedProjects?: any[] = [];
  originalSelectedProjects?: ProjectConfig[] = [];
  userId?: string = undefined;
  orgId?: string = undefined;
  tempOrgId?: string = undefined;
  
  projectOptions = new FormControl('');
  startersDropdown = new FormControl('');
  projectName = '';
  orgDropdown = new FormControl('');
  organizations: any[] = [];
  selectedStarterPath?: any = undefined;
  razrooStarters: any[] = starterSteps;

  toggleProjectOption(projectOption: ProjectConfig, projectConfigs: ProjectConfig[]) {
    const projectName = projectOption.packageJsonParams.name;
    this.projectConfigs = projectConfigs.map(projectOptionItem => {
      if(projectOptionItem.packageJsonParams.name === projectName) {
        projectOptionItem.packageJsonParams.selected = !projectOptionItem.packageJsonParams.selected;
      }
      return projectOptionItem;
    });
    this.selectedProjects = this.projectConfigs.filter(projectOptionItem => projectOptionItem.packageJsonParams.selected === true);
  }

  // will take state of selectedProjects, and revert back to initial state
  initToggleSelectedProjects(projects: ProjectConfig[], selectedProjects: ProjectConfig[]): ProjectConfig[] {
    return projects ? projects.map(projectOption => {
      if(selectedProjects && selectedProjects.some(option => option.packageJsonParams?.name === projectOption.packageJsonParams.name)) {
        projectOption.packageJsonParams.selected = true;
      }
      return projectOption;
    }) : [];
  }

  ngOnInit() {
    this.authIsLoading = true;
    this.organizationsLoading = true;
    vscode.postMessage({
      command: "initialAuthInfoRequest",
      description: 'get auth info for projects vscode webview panel'
    });

    // Handle the message inside the webview
    window.addEventListener('message', event => {
      const message = event.data; // The JSON data our extension sent

      switch (message.command) {
        case "initAuthData":
          this.authIsLoading = false;
          this.isAuthenticated = true;
          this.originalSelectedProjects = message.selectedProjects;
          this.selectedProjects = message.selectedProjects;
          this.projectConfigs = this.initToggleSelectedProjects(message.projectConfigs, message.selectedProjects);
          this.userId = message.userId;
          this.orgId = message.orgId;
          return;
        case "projectsDisconnected":
          this.selectedProjects = message.selectedProjects;
          this.authIsLoading = false;
          return;
        case "setOrganizations":
          this.organizations = message.organizations;
          this.organizationsLoading = false;
          return;
        case "sendAuthData":
          this.authIsLoading = false;
          this.organizations = message.organizations;
          this.organizationsLoading = false;
          this.isAuthenticated = true;
          this.orgId = message.orgId;
          this.userId = message.userId;
          return;
        case "loggedOut":
          this.loggingOutLoading = false;
          this.authIsLoading = false;
          return;
      }
    });
  }

  connectProjects(selectedProjects?: ProjectConfig[]) {
    this.authIsLoading = true;
    // order here is important
    const disconnectedProjects = this.disconnectedProjects(selectedProjects);
    this.originalSelectedProjects = this.selectedProjects;
    vscode.postMessage({
      command: "connectProjects",
      selectedProjects: selectedProjects,
      disconnectedProjects: disconnectedProjects,
      orgId: this.tempOrgId ? this.tempOrgId : this.orgId
    });
  }

  disconnectedProjects(selectedProjects?: ProjectConfig[]) {
    const originalProjects = this.originalSelectedProjects;
    if(!selectedProjects || !originalProjects) {
      return [];
    }
    return originalProjects.filter(originalProject => !selectedProjects.some(selectedProject => originalProject?.versionControlParams?.gitOrigin === selectedProject?.versionControlParams?.gitOrigin));
  }

  changeOrgDropdownValue($event: any) {
    this.tempOrgId = $event.target.value;
  }

  changeStarterDropdownValue(event: any) {
    const pathId = event.target.value;
    const filteredStarters = this.razrooStarters.filter(razrooStarter => razrooStarter.pathId === pathId);
    const selectedStarterTemplate = filteredStarters[0];
    this.selectedStarterPath = selectedStarterTemplate;
  }

  changeProjectName($event: any) {
    this.projectName = $event.target.value;
  }

  createProject() {
    const path = this.selectedStarterPath ? this.selectedStarterPath : this.razrooStarters[0];
    const projectName = this.projectName;
    if(!projectName) {
      return; 
    }
    vscode.postMessage({
      command: "createProject",
      path: path,
      projectName: projectName
    });
  }

  logout() {
    vscode.postMessage({
      command: "logoutUser",
      description: 'log out of user so can log in with another user'
    });
  }
}
