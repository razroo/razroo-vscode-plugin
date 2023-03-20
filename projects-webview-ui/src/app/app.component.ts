import { Component, OnInit } from "@angular/core";
import { provideVSCodeDesignSystem, vsCodeButton, vsCodeDropdown, vsCodeOption } from "@vscode/webview-ui-toolkit";
import { ProjectConfig } from "./interfaces/project-config.interfaces";
import { vscode } from "./utilities/vscode";

// In order to use the Webview UI Toolkit web components they
// must be registered with the browser (i.e. webview) using the
// syntax below.
provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeOption(), vsCodeDropdown());

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
  isAuthenticated = false;
  loggingOutLoading = false;
  projectConfigs: any[] = [];
  selectedProjects: any[] = [];

  toggleProjectOption($event: any, projectConfigs: ProjectConfig[]) {
    const projectName = $event.target.value;
    this.projectConfigs = projectConfigs.map(projectOption => {
      if(projectOption.packageJsonParams.name === projectName) {
        projectOption.packageJsonParams.selected = !projectOption.packageJsonParams.selected;
      }
      return projectOption;
    });
    this.selectedProjects = this.projectConfigs.filter(projectOption => projectOption.packageJsonParams.selected === true);
  }

  // will take state of selectedProjects, and revert back to initial state
  initToggleSelectedProjects(projectConfigs: ProjectConfig[], selectedOptions: ProjectConfig[]): ProjectConfig[] {
    return projectConfigs ? projectConfigs.map(projectOption => {
      if(selectedOptions && selectedOptions.some(option => option.packageJsonParams.name === projectOption.packageJsonParams.name)) {
        projectOption.packageJsonParams.selected = true;
      }
      return projectOption;
    }) : [];
  }

  ngOnInit() {
    this.authIsLoading = true;
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
          this.projectConfigs = this.initToggleSelectedProjects(message.projectConfigs, message.selectedProjects);
          return;
        case "sendAuthData":
          this.authIsLoading = false;
          this.isAuthenticated = true;
          return;
        case "loggedOut":
          this.loggingOutLoading = false;
          this.isAuthenticated = false;
          this.authIsLoading = false;
          return;
      }
    });
  }

  connectProjects(selectedProjects: ProjectConfig[]) {
    this.authIsLoading = true;
    vscode.postMessage({
      command: "connectProjects",
      selectedProjects: selectedProjects
    });
  }

  unConnectProject(projectConfigs: ProjectConfig[]) {
    this.loggingOutLoading = true;
    vscode.postMessage({
      command: "unConnectProject",
      text: 'sample event'
    });
  }

}
