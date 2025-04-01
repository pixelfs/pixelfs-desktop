// import { Environment } from '../../wailsjs/runtime';
// import * as v1 from '../../bindings/github.com/wailsapp/wails/v3/pkg';

import { System } from '@wailsio/runtime';

let os = '';

export async function loadEnvironment() {
  const env = await System.Environment();
  os = env.OS;
}

export function isMacOS() {
  return os === 'darwin';
}

export function isWindows() {
  return os === 'windows';
}
