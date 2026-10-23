import { describe,expect,it } from 'vitest';
import {readFileSync} from 'node:fs';

const app=readFileSync('src/App.tsx','utf8');
const help=readFileSync('src/global-pilgrim-help.tsx','utf8');
const styles=readFileSync('src/global-pilgrim-help.css','utf8');

describe('TEMAN multilingual guidance without compromising emergency safety',()=>{
 it('places global help after immediate emergency action',()=>{
  expect(app.indexOf('className="action emergency"')).toBeGreaterThan(0);
  expect(app.indexOf('<GlobalPilgrimHelp')).toBeGreaterThan(app.indexOf('className="action emergency"'));
 });
 it('links only to an independently named official AI source and keeps private profile separate',()=>{
  expect(help).toContain('https://my.gov.sa/en/services/2173544');
  expect(help).toContain('not AI hosted or integrated by TGPU');
  expect(help).not.toMatch(/\b(?:fetch|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|navigator\.geolocation)\s*\(/);
 });
 it('makes all eight orientation languages available without claiming full UI localization',()=>{
  for(const code of ['ms','en','ar','zh','tr','fr','sw','ur'])expect(help).toMatch(new RegExp('(?:^|\\n) '+code+':\\{'));
  expect(help).toContain('not a full translation');
 });
 it('keeps guidance senior-accessible and links to actual existing features',()=>{
  expect(styles).toContain('min-height:53px');
  expect(help).toContain('onPrepare');
  expect(help).toContain('onIbadah');
  expect(help).toContain('onPhrases');
 });
});
