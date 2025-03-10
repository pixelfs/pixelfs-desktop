import { trim } from 'lodash-es';
import { v1 } from '../../wailsjs/go/models';

export function parsePathToContext(name: string): v1.FileContext {
  let nodeId = '';
  let location = '';
  let path = '';

  const parts = trim(name, '/').split('/');

  if (parts.length === 0 || !parts[0]) {
    return new v1.FileContext({});
  }

  nodeId = parts[0];

  if (parts.length > 1) {
    location = parts[1];
  }

  if (parts.length > 2) {
    path = parts.slice(2).join('/');
  }

  return new v1.FileContext({ node_id: nodeId, location, path: `/${path}` });
}

export function isVideo(name: string): boolean {
  return [
    '.mp4',
    '.mkv',
    '.avi',
    '.vid',
    '.mov',
    '.rmvb',
    '.webm',
    '.wmv',
    '.flv',
    '.3gp',
    '.mpeg',
    '.mpg',
    '.rm',
    '.m4v',
    '.f4v',
    '.vob',
    '.mts',
    '.ts',
  ].includes(name.slice(name.lastIndexOf('.')).toLowerCase());
}

export function truncateText(str: string, maxLength = 70) {
  if (str.length <= maxLength) return str;

  const half = Math.floor((maxLength - 3) / 2); // 计算两边各留多少字符
  return str.slice(0, half) + '...' + str.slice(-half);
}
