import { Component } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { provideVSCodeDesignSystem, vsCodeButton, vsCodeDropdown, vsCodeOption } from "@vscode/webview-ui-toolkit";
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
export class AppComponent {
  title = "hello-world";
  projectOptions = [
    {
      name: 'Razroo Frontend',
      selected: false,
    },
    {
      name: 'Razroo Graphql',
      selected: false
    },
    {
      name: 'Razroo Angular Starter',
      selected: false
    }
  ];

  selectedOptions = [];

  toggleProjectOption($event: any) {
    const projectName = $event.target.value;
    this.projectOptions = this.projectOptions.map(projectOption => {
      if(projectOption.name === projectName) {
        projectOption.selected = !projectOption.selected;
      }
      return projectOption;
    });
  }

  connectProjects() {
    const selectedProjects = this.projectOptions.filter(projectOption => projectOption.selected === true);
    console.log('selectedProjects');
    console.log(selectedProjects);
    vscode.postMessage({
      command: "connectProjects",
      text: 'sample event'
    });
  }

}
