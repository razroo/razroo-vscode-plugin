import { Component, OnInit } from "@angular/core";
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
export class AppComponent implements OnInit {
  title = "hello-world";
  authIsLoading = false;
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

  ngOnInit() {
    // Handle the message inside the webview
    window.addEventListener('message', event => {
      const message = event.data; // The JSON data our extension sent

      switch (message.command) {
        case "sendAuthData":
          this.authIsLoading = false;
          console.log('connect projects called inside of app');
          return;
      }
    });
  }

  connectProjects() {
    const selectedProjects = this.projectOptions.filter(projectOption => projectOption.selected === true);
    this.authIsLoading = true;
    vscode.postMessage({
      command: "connectProjects",
      text: 'sample event'
    });
  }

}
