import { createScaffold } from "./scaffold";

function generateAngularComponent(vscode, context, isProduction, packageJsonParams) {
  return vscode.commands.registerCommand(
    'generate.angular.component',
    async ({ path }) => createScaffold(vscode, 'angular-15.0.0', 'angular-core', path, context, isProduction, 'component', packageJsonParams)
  );
}

function generateAngularAngularService(vscode, context, isProduction, packageJsonParams) {
  return vscode.commands.registerCommand(
    'generate.angular.angularService',
    async ({ path }) => createScaffold(vscode, 'angular-15.0.0', 'angular-core', path, context, isProduction, 'angular-service', packageJsonParams)
  );
}

function generateAngularAngularGuard(vscode, context, isProduction, packageJsonParams) {
  return vscode.commands.registerCommand(
    'generate.angular.angularGuard',
    async ({ path }) => createScaffold(vscode, 'angular-15.0.0', 'angular-core', path, context, isProduction, 'angular-guard', packageJsonParams)
  );
}

function generateAngularTypescriptInterface(vscode, context, isProduction, packageJsonParams) {
  return vscode.commands.registerCommand(
    'generate.angular.typescriptInterface',
    async ({ path }) => createScaffold(vscode, 'angular-15.0.0', 'angular-core', path, context, isProduction, 'typescript-interface', packageJsonParams)
  );
}

function generateAngularAngularPipe(vscode, context, isProduction, packageJsonParams) {
  return vscode.commands.registerCommand(
    'generate.angular.angularPipe',
    async ({ path }) => createScaffold(vscode, 'angular-15.0.0', 'angular-core', path, context, isProduction, 'angular-pipe', packageJsonParams)
  );
}

function generateAngularAngularDirective(vscode, context, isProduction, packageJsonParams) {
  return vscode.commands.registerCommand(
    'generate.angular.angularDirective',
    async ({ path }) => createScaffold(vscode, 'angular-15.0.0', 'angular-core', path, context, isProduction, 'angular-directive', packageJsonParams)
  );
}

function generateNgrxNgrxFeature(vscode, context, isProduction, packageJsonParams) {
  return vscode.commands.registerCommand(
    'generate.ngrx.ngrxFeature',
    async ({ path }) => createScaffold(vscode, 'ngrx-15.0.0', 'ngrx-scaffolds', path, context, isProduction, 'ngrx-feature', packageJsonParams)
  );
}

export function pushScaffoldCommands(context, vscode, isProduction: boolean, packageJsonParams) {
  context.subscriptions.push(generateAngularComponent(vscode, context, isProduction, packageJsonParams), generateAngularAngularService(vscode, context, isProduction, packageJsonParams), generateAngularAngularGuard(vscode, context, isProduction, packageJsonParams), generateAngularTypescriptInterface(vscode, context, isProduction, packageJsonParams), generateAngularAngularPipe(vscode, context, isProduction, packageJsonParams), generateAngularAngularDirective(vscode, context, isProduction, packageJsonParams), generateNgrxNgrxFeature(vscode, context, isProduction, packageJsonParams))
}
