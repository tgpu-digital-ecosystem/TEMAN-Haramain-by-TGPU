import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL('../public/' + path, import.meta.url), 'utf8');

describe('TEMAN Owner HQ access boundary', () => {
  it('keeps the owner workspace hidden until an authenticated admin lookup succeeds', () => {
    const html = read('owner.html');
    const js = read('owner.js');
    expect(html).toMatch(/id="workspace" hidden/);
    expect(html).toMatch(/id="denied" hidden/);
    expect(js).toContain("sessionStorage.getItem('tgpu_digital_access_token')");
    expect(js).toContain("'/auth/v1/user'");
    expect(js).toContain('teman_admins?select=user_id');
    expect(js).toContain("if(!Array.isArray(admins)||admins.length!==1){deny();return;}");
    expect(js).toContain("$('workspace').hidden=false");
  });

  it('does not advertise functional owner operations', () => {
    const html = read('owner.html');
    expect(html).toContain('These modules are not yet operational');
    expect(html).toContain('No booking, payment, partner approval or emergency request is processed here');
  });

  it('does not let a membership query failure suppress the owner role check', () => {
    const html = read('account.html');
    const js = read('account.js');
    expect(html).toMatch(/id="owner-link" hidden/);
    expect(js).toContain('let ownerCheck=0');
    expect(js).toContain('if(check===ownerCheck&&Array.isArray(rows)&&rows.length===1)ownerLink.hidden=false');
    expect(js).toContain("ownerLink.hidden=true");
    const membership = js.indexOf('teman_memberships?select=');
    const admin = js.indexOf('teman_admins?select=');
    expect(membership).toBeGreaterThan(-1);
    expect(admin).toBeGreaterThan(membership);
    expect(js.slice(membership, admin)).not.toContain('if(!res.ok)return');
  });
});
