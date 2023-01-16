import { createScaffold } from "./scaffold";
import { GENERATE_ANGULAR_COMPONENT, GENERATE_ANGULAR_DIRECTIVE, GENERATE_ANGULAR_GUARD, GENERATE_ANGULAR_PIPE, GENERATE_ANGULAR_SERVICE, GENERATE_ANGULAR_TYPESCRIPT_INTERFACE } from "../../constants";

export function pushScaffoldCommands(context, vscode, isProduction: boolean, packageJsonParams) {
  //build-scaffolds.ts builds commans here
  function generateAngularComponent() {
    return vscode.commands.registerCommand(
        GENERATE_ANGULAR_COMPONENT,
        async ({path}) => createScaffold(vscode, 'angular-15.0.0', 'angular-core', path, context, isProduction, 'component', packageJsonParams)
    );
  }

  const generateAngularService = vscode.commands.registerCommand(
    GENERATE_ANGULAR_SERVICE,
    async ({path}) => createScaffold(vscode, 'angular-15.0.0', 'angular-core', path, context, isProduction, 'angular-service', packageJsonParams)
  );
  const generateAngularPipe = vscode.commands.registerCommand(
    GENERATE_ANGULAR_PIPE,
    async ({path}) => createScaffold(vscode, 'angular-15.0.0', 'angular-core', path, context, isProduction, 'angular-pipe', packageJsonParams)
  );
  const generateAngularGuard = vscode.commands.registerCommand(
    GENERATE_ANGULAR_GUARD,
    async ({path}) => createScaffold(vscode, 'angular-15.0.0', 'angular-core', path, context, isProduction, 'angular-guard', packageJsonParams)
  );
  const generateAngularDirective = vscode.commands.registerCommand(
    GENERATE_ANGULAR_DIRECTIVE,
    async ({path}) => createScaffold(vscode, 'angular-15.0.0', 'angular-core', path, context, isProduction, 'angular-directive', packageJsonParams)
  );
  const generateAngularTypescriptInterface = vscode.commands.registerCommand(
    GENERATE_ANGULAR_TYPESCRIPT_INTERFACE,
    async ({path}) => createScaffold(vscode, 'angular-15.0.0', 'angular-core', path, context, isProduction, 'typescript-interface', packageJsonParams)
  );
  context.subscriptions.push(generateAngularComponent, generateAngularService, generateAngularPipe, generateAngularGuard, generateAngularDirective, generateAngularTypescriptInterface);
}