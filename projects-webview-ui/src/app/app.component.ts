import { Component, OnInit } from "@angular/core";
import { provideVSCodeDesignSystem, vsCodeButton, vsCodeDropdown, vsCodeOption, vsCodeCheckbox } from "@vscode/webview-ui-toolkit";
import { ProjectConfig } from "./interfaces/project-config.interfaces";
import { vscode } from "./utilities/vscode";
import {FormControl} from '@angular/forms';

// In order to use the Webview UI Toolkit web components they
// must be registered with the browser (i.e. webview) using the
// syntax below.
provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeOption(), vsCodeDropdown(), vsCodeCheckbox());

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
  userId?: string = undefined;
  orgId?: string = undefined;
  tempOrgId?: string = undefined;
  projectOptions = new FormControl('');
  orgDropdown = new FormControl('');
  organizations: any[] = [];

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
          this.selectedProjects = message.selectedProjects;
          this.projectConfigs = this.initToggleSelectedProjects(message.projectConfigs, message.selectedProjects);
          this.userId = message.userId;
          this.orgId = message.orgId;
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
          this.isAuthenticated = false;
          this.authIsLoading = false;
          return;
      }
    });
  }

  connectProjects(selectedProjects?: ProjectConfig[]) {
    this.authIsLoading = true;
    vscode.postMessage({
      command: "connectProjects",
      selectedProjects: selectedProjects,
      orgId: this.tempOrgId ? this.tempOrgId : this.orgId
    });
  }

  changeOrgDropdownValue($event: any) {
    this.tempOrgId = $event.target.value;
  }

  logout() {
    vscode.postMessage({
      command: "logoutUser",
      description: 'log out of user so can log in with another user'
    });
  }
}
