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

function generateNextjsNextjsComponent(vscode, context, isProduction, packageJsonParams) {
  return vscode.commands.registerCommand(
    'generate.nextjs.nextjsComponent',
    async ({ path }) => createScaffold(vscode, 'nextjs-13.1.0', 'nextjs-core', path, context, isProduction, 'nextjs-component', packageJsonParams)
  );
}

function generateNgrxNgrxFeature(vscode, context, isProduction, packageJsonParams) {
  return vscode.commands.registerCommand(
    'generate.ngrx.ngrxFeature',
    async ({ path }) => createScaffold(vscode, 'ngrx-15.0.0', 'ngrx-scaffolds', path, context, isProduction, 'ngrx-feature', packageJsonParams)
  );
}

function generateReactReactComponent(vscode, context, isProduction, packageJsonParams) {
  return vscode.commands.registerCommand(
    'generate.react.reactComponent',
    async ({ path }) => createScaffold(vscode, 'react-18.2.0', 'react-scaffolds', path, context, isProduction, 'react-component', packageJsonParams)
  );
}

function generateReactReactReduxSlice(vscode, context, isProduction, packageJsonParams) {
  return vscode.commands.registerCommand(
    'generate.react.reactReduxSlice',
    async ({ path }) => createScaffold(vscode, 'react-18.2.0', 'react-scaffolds', path, context, isProduction, 'react-redux-slice', packageJsonParams)
  );
}

function generateSvelteSvelteComponent(vscode, context, isProduction, packageJsonParams) {
  return vscode.commands.registerCommand(
    'generate.svelte.svelteComponent',
    async ({ path }) => createScaffold(vscode, 'svelte-3.5.0', 'svelte-scaffolds', path, context, isProduction, 'svelte-component', packageJsonParams)
  );
}

function generateSvelteSvelteModuleComponent(vscode, context, isProduction, packageJsonParams) {
  return vscode.commands.registerCommand(
    'generate.svelte.svelteModuleComponent',
    async ({ path }) => createScaffold(vscode, 'svelte-3.5.0', 'svelte-scaffolds', path, context, isProduction, 'svelte-module-component', packageJsonParams)
  );
}

function generateSvelteSvelteEndpoint(vscode, context, isProduction, packageJsonParams) {
  return vscode.commands.registerCommand(
    'generate.svelte.svelteEndpoint',
    async ({ path }) => createScaffold(vscode, 'svelte-3.5.0', 'svelte-scaffolds', path, context, isProduction, 'svelte-endpoint', packageJsonParams)
  );
}

function generateVueComponent(vscode, context, isProduction, packageJsonParams) {
  return vscode.commands.registerCommand(
    'generate.vue.component',
    async ({ path }) => createScaffold(vscode, 'vue-3.2.0', 'vue-scaffolds', path, context, isProduction, 'component', packageJsonParams)
  );
}

function generateVueView(vscode, context, isProduction, packageJsonParams) {
  return vscode.commands.registerCommand(
    'generate.vue.view',
    async ({ path }) => createScaffold(vscode, 'vue-3.2.0', 'vue-scaffolds', path, context, isProduction, 'view', packageJsonParams)
  );
}

function generateVuePiniaStore(vscode, context, isProduction, packageJsonParams) {
  return vscode.commands.registerCommand(
    'generate.vue.piniaStore',
    async ({ path }) => createScaffold(vscode, 'vue-3.2.0', 'vue-scaffolds', path, context, isProduction, 'pinia-store', packageJsonParams)
  );
}

export function pushScaffoldCommands(context, vscode, isProduction: boolean, packageJsonParams) {
  context.subscriptions.push(generateAngularComponent(vscode, context, isProduction, packageJsonParams), generateAngularAngularService(vscode, context, isProduction, packageJsonParams), generateAngularAngularGuard(vscode, context, isProduction, packageJsonParams), generateAngularTypescriptInterface(vscode, context, isProduction, packageJsonParams), generateAngularAngularPipe(vscode, context, isProduction, packageJsonParams), generateAngularAngularDirective(vscode, context, isProduction, packageJsonParams), generateNextjsNextjsComponent(vscode, context, isProduction, packageJsonParams), generateNgrxNgrxFeature(vscode, context, isProduction, packageJsonParams), generateReactReactComponent(vscode, context, isProduction, packageJsonParams), generateReactReactReduxSlice(vscode, context, isProduction, packageJsonParams), generateSvelteSvelteComponent(vscode, context, isProduction, packageJsonParams), generateSvelteSvelteModuleComponent(vscode, context, isProduction, packageJsonParams), generateSvelteSvelteEndpoint(vscode, context, isProduction, packageJsonParams), generateVueComponent(vscode, context, isProduction, packageJsonParams), generateVueView(vscode, context, isProduction, packageJsonParams), generateVuePiniaStore(vscode, context, isProduction, packageJsonParams))
}
