import { createScaffold } from "./scaffold";
import * as vscode from 'vscode';
import { GENERATE_ANGULAR_COMPONENT, GENERATE_ANGULAR_DIRECTIVE, GENERATE_ANGULAR_GUARD, GENERATE_ANGULAR_PIPE, GENERATE_ANGULAR_SERVICE, GENERATE_ANGULAR_TYPESCRIPT_INTERFACE } from "../../constants";

export function pushScaffoldCommands(context, vscode, isProduction: boolean, packageJsonParams) {
  //build-scaffolds.ts builds commans here
  function generateAngularComponent() {
    return vscode.commands.registerCommand(
        GENERATE_ANGULAR_COMPONENT,
        async ({path}) => createScaffold('angular-15.0.0', 'angular-core', path, context, isProduction, 'component', packageJsonParams)
    );
  }
  context.subscriptions.push(generateAngularComponent);
  const generateAngularService = vscode.commands.registerCommand(
    GENERATE_ANGULAR_SERVICE,
    async ({path}) => createScaffold('angular-15.0.0', 'angular-core', path, context, isProduction, 'angular-service', packageJsonParams)
  );
  context.subscriptions.push(generateAngularService);
  const generateAngularPipe = vscode.commands.registerCommand(
    GENERATE_ANGULAR_PIPE,
    async ({path}) => createScaffold('angular-15.0.0', 'angular-core', path, context, isProduction, 'angular-pipe', packageJsonParams)
  );
  context.subscriptions.push(generateAngularPipe);
  const generateAngularGuard = vscode.commands.registerCommand(
    GENERATE_ANGULAR_GUARD,
    async ({path}) => createScaffold('angular-15.0.0', 'angular-core', path, context, isProduction, 'angular-guard', packageJsonParams)
  );
  context.subscriptions.push(generateAngularGuard);
  const generateAngularDirective = vscode.commands.registerCommand(
    GENERATE_ANGULAR_DIRECTIVE,
    async ({path}) => createScaffold('angular-15.0.0', 'angular-core', path, context, isProduction, 'angular-directive', packageJsonParams)
  );
  context.subscriptions.push(generateAngularDirective);
  const generateAngularTypescriptInterface = vscode.commands.registerCommand(
    GENERATE_ANGULAR_TYPESCRIPT_INTERFACE,
    async ({path}) => createScaffold('angular-15.0.0', 'angular-core', path, context, isProduction, 'typescript-interface', packageJsonParams)
  );
  context.subscriptions.push(generateAngularTypescriptInterface);
}