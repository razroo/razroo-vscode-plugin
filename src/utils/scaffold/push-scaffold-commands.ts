import { createScaffold } from "./scaffold";

function generateAngularComponent(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.angular.component',
    async ({ path }) => createScaffold(vscode, 'angular-15.0.0', 'angular-core', path, context, isProduction, 'component')
  );
}

function generateAngularAngularService(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.angular.angularService',
    async ({ path }) => createScaffold(vscode, 'angular-15.0.0', 'angular-core', path, context, isProduction, 'angular-service')
  );
}

function generateAngularAngularGuard(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.angular.angularGuard',
    async ({ path }) => createScaffold(vscode, 'angular-15.0.0', 'angular-core', path, context, isProduction, 'angular-guard')
  );
}

function generateAngularTypescriptInterface(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.angular.typescriptInterface',
    async ({ path }) => createScaffold(vscode, 'angular-15.0.0', 'angular-core', path, context, isProduction, 'typescript-interface')
  );
}

function generateAngularAngularPipe(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.angular.angularPipe',
    async ({ path }) => createScaffold(vscode, 'angular-15.0.0', 'angular-core', path, context, isProduction, 'angular-pipe')
  );
}

function generateAngularAngularDirective(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.angular.angularDirective',
    async ({ path }) => createScaffold(vscode, 'angular-15.0.0', 'angular-core', path, context, isProduction, 'angular-directive')
  );
}

function generateNextjsNextjsComponent(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.nextjs.nextjsComponent',
    async ({ path }) => createScaffold(vscode, 'nextjs-13.1.0', 'nextjs-core', path, context, isProduction, 'nextjs-component')
  );
}

function generateNgrxNgrxFeature(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.ngrx.ngrxFeature',
    async ({ path }) => createScaffold(vscode, 'ngrx-15.0.0', 'ngrx-scaffolds', path, context, isProduction, 'ngrx-feature')
  );
}

function generateReactReactComponent(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.react.reactComponent',
    async ({ path }) => createScaffold(vscode, 'react-18.2.0', 'react-scaffolds', path, context, isProduction, 'react-component')
  );
}

function generateReactReactReduxSlice(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.react.reactReduxSlice',
    async ({ path }) => createScaffold(vscode, 'react-18.2.0', 'react-scaffolds', path, context, isProduction, 'react-redux-slice')
  );
}

function generateSvelteSvelteComponent(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.svelte.svelteComponent',
    async ({ path }) => createScaffold(vscode, 'svelte-3.5.0', 'svelte-scaffolds', path, context, isProduction, 'svelte-component')
  );
}

function generateSvelteSvelteModuleComponent(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.svelte.svelteModuleComponent',
    async ({ path }) => createScaffold(vscode, 'svelte-3.5.0', 'svelte-scaffolds', path, context, isProduction, 'svelte-module-component')
  );
}

function generateSvelteSvelteEndpoint(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.svelte.svelteEndpoint',
    async ({ path }) => createScaffold(vscode, 'svelte-3.5.0', 'svelte-scaffolds', path, context, isProduction, 'svelte-endpoint')
  );
}

function generateVueComponent(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.vue.component',
    async ({ path }) => createScaffold(vscode, 'vue-3.2.0', 'vue-scaffolds', path, context, isProduction, 'component')
  );
}

function generateVueView(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.vue.view',
    async ({ path }) => createScaffold(vscode, 'vue-3.2.0', 'vue-scaffolds', path, context, isProduction, 'view')
  );
}

function generateVuePiniaStore(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.vue.piniaStore',
    async ({ path }) => createScaffold(vscode, 'vue-3.2.0', 'vue-scaffolds', path, context, isProduction, 'pinia-store')
  );
}

export function pushScaffoldCommands(context, vscode, isProduction: boolean) {
  context.subscriptions.push(generateAngularComponent(vscode, context, isProduction), generateAngularAngularService(vscode, context, isProduction), generateAngularAngularGuard(vscode, context, isProduction), generateAngularTypescriptInterface(vscode, context, isProduction), generateAngularAngularPipe(vscode, context, isProduction), generateAngularAngularDirective(vscode, context, isProduction), generateNextjsNextjsComponent(vscode, context, isProduction), generateNgrxNgrxFeature(vscode, context, isProduction), generateReactReactComponent(vscode, context, isProduction), generateReactReactReduxSlice(vscode, context, isProduction), generateSvelteSvelteComponent(vscode, context, isProduction), generateSvelteSvelteModuleComponent(vscode, context, isProduction), generateSvelteSvelteEndpoint(vscode, context, isProduction), generateVueComponent(vscode, context, isProduction), generateVueView(vscode, context, isProduction), generateVuePiniaStore(vscode, context, isProduction));
}
