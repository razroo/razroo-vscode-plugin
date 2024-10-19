import { createScaffold } from "./scaffold";

export function generateAngularComponent(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.angular.component',
    async ({ path }) => createScaffold(vscode, 'angular-18.2.0', 'angular-core', path, context, isProduction, 'component')
  );
}

export function generateAngularAngularService(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.angular.angularService',
    async ({ path }) => createScaffold(vscode, 'angular-18.2.0', 'angular-core', path, context, isProduction, 'angular-service')
  );
}

export function generateAngularAngularGuard(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.angular.angularGuard',
    async ({ path }) => createScaffold(vscode, 'angular-18.2.0', 'angular-core', path, context, isProduction, 'angular-guard')
  );
}

export function generateAngularTypescriptInterface(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.angular.typescriptInterface',
    async ({ path }) => createScaffold(vscode, 'angular-18.2.0', 'angular-core', path, context, isProduction, 'typescript-interface')
  );
}

export function generateAngularAngularPipe(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.angular.angularPipe',
    async ({ path }) => createScaffold(vscode, 'angular-18.2.0', 'angular-core', path, context, isProduction, 'angular-pipe')
  );
}

export function generateAngularAngularDirective(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.angular.angularDirective',
    async ({ path }) => createScaffold(vscode, 'angular-18.2.0', 'angular-core', path, context, isProduction, 'angular-directive')
  );
}

export function generateAngularAngularNxLib(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.angular.angularNxLib',
    async ({ path }) => createScaffold(vscode, 'angular-18.2.0', 'angular-core', path, context, isProduction, 'angular-nx-lib')
  );
}

export function generateJavascriptJavascriptComponent(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.javascript.javascriptComponent',
    async ({ path }) => createScaffold(vscode, 'javascript-12.0.0', 'javascript-scaffolds', path, context, isProduction, 'javascript-component')
  );
}

export function generateNextjsNextjsComponent(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.nextjs.nextjsComponent',
    async ({ path }) => createScaffold(vscode, 'nextjs-14.1.0', 'nextjs-core', path, context, isProduction, 'nextjs-component')
  );
}

export function generateNextjsNextjsNxLib(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.nextjs.nextjsNxLib',
    async ({ path }) => createScaffold(vscode, 'nextjs-14.1.0', 'nextjs-core', path, context, isProduction, 'nextjs-nx-lib')
  );
}

export function generateReactReactComponent(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.react.reactComponent',
    async ({ path }) => createScaffold(vscode, 'react-18.2.0', 'react-scaffolds', path, context, isProduction, 'react-component')
  );
}

export function generateReactReactReduxSlice(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.react.reactReduxSlice',
    async ({ path }) => createScaffold(vscode, 'react-18.2.0', 'react-scaffolds', path, context, isProduction, 'react-redux-slice')
  );
}

export function generateSvelteSvelteComponent(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.svelte.svelteComponent',
    async ({ path }) => createScaffold(vscode, 'svelte-3.5.0', 'svelte-scaffolds', path, context, isProduction, 'svelte-component')
  );
}

export function generateSvelteSvelteModuleComponent(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.svelte.svelteModuleComponent',
    async ({ path }) => createScaffold(vscode, 'svelte-3.5.0', 'svelte-scaffolds', path, context, isProduction, 'svelte-module-component')
  );
}

export function generateSvelteSvelteEndpoint(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.svelte.svelteEndpoint',
    async ({ path }) => createScaffold(vscode, 'svelte-3.5.0', 'svelte-scaffolds', path, context, isProduction, 'svelte-endpoint')
  );
}

export function generateVueComponent(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.vue.component',
    async ({ path }) => createScaffold(vscode, 'vue-3.2.0', 'vue-scaffolds', path, context, isProduction, 'component')
  );
}

export function generateVueView(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.vue.view',
    async ({ path }) => createScaffold(vscode, 'vue-3.2.0', 'vue-scaffolds', path, context, isProduction, 'view')
  );
}

export function generateVuePiniaStore(vscode, context, isProduction) {
  return vscode.commands.registerCommand(
    'generate.vue.piniaStore',
    async ({ path }) => createScaffold(vscode, 'vue-3.2.0', 'vue-scaffolds', path, context, isProduction, 'pinia-store')
  );
}

export function pushScaffoldCommands(context, vscode, isProduction: boolean) {
  context.subscriptions.push(generateAngularComponent(vscode, context, isProduction), generateAngularAngularService(vscode, context, isProduction), generateAngularAngularGuard(vscode, context, isProduction), generateAngularTypescriptInterface(vscode, context, isProduction), generateAngularAngularPipe(vscode, context, isProduction), generateAngularAngularDirective(vscode, context, isProduction), generateAngularAngularNxLib(vscode, context, isProduction), generateJavascriptJavascriptComponent(vscode, context, isProduction), generateNextjsNextjsComponent(vscode, context, isProduction), generateNextjsNextjsNxLib(vscode, context, isProduction), generateReactReactComponent(vscode, context, isProduction), generateReactReactReduxSlice(vscode, context, isProduction), generateSvelteSvelteComponent(vscode, context, isProduction), generateSvelteSvelteModuleComponent(vscode, context, isProduction), generateSvelteSvelteEndpoint(vscode, context, isProduction), generateVueComponent(vscode, context, isProduction), generateVueView(vscode, context, isProduction), generateVuePiniaStore(vscode, context, isProduction))
}
