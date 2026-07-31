declare module "jest-axe" {
  export interface AxeResult { readonly violations: readonly unknown[] }
  export function axe(container: Element): Promise<AxeResult>;
}
