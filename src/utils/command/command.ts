export function containsInfrastructureCommandPath(text: string) : boolean {
  return text.includes('<%= infrastructureCommandPath %>');
}