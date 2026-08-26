declare module "jest-axe" {
  interface AxeResult {
    readonly violations: readonly unknown[];
  }
  export function axe(container: Element): Promise<AxeResult>;
}
