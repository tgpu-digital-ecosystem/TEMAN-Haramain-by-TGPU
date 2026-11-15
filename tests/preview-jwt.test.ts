// @vitest-environment node
import{describe,it,expect,beforeAll}from'vitest';import{generateKeyPair,exportJWK,SignJWT,createLocalJWKSet,jwtVerify}from'jose';import{authenticate}from'../worker/preview-auth.mjs';
let privateKey:any,keys:any;
const issuer='https://winter-frog-171e.cloudflareaccess.com',aud='synthetic-audience';
beforeAll(async()=>{const pair=await generateKeyPair('RS256');privateKey=pair.privateKey;keys=createLocalJWKSet({keys:[{...await exportJWK(pair.publicKey),kid:'synthetic',alg:'RS256'}]});});
async function token(options:any={}){return new SignJWT({email:options.email||'mamduh@tgpu.my'}).setProtectedHeader({alg:'RS256',kid:'synthetic'}).setIssuer(options.issuer||issuer).setAudience(options.aud||aud).setExpirationTime(options.exp||'1h').sign(options.key||privateKey);}
const check=(t:string)=>authenticate(new Request('https://review.security.example',{headers:{'Cf-Access-Jwt-Assertion':t}}),{ACCESS_AUD:aud},(jwt:any,_keys:any,options:any)=>jwtVerify(jwt,keys,options));
describe('Founder review JWT verification',()=>{
 it('rejects a missing Access assertion',()=>expect(authenticate(new Request('https://review.security.example'),{ACCESS_AUD:aud})).rejects.toThrow());
 it('accepts a valid verified founder assertion',async()=>expect((await check(await token())).email).toBe('mamduh@tgpu.my'));
 it('rejects another identity',async()=>expect(check(await token({email:'other@security.example'}))).rejects.toThrow());
 it('rejects another audience',async()=>expect(check(await token({aud:'foreign'}))).rejects.toThrow());
 it('rejects another issuer',async()=>expect(check(await token({issuer:'https://unrelated.example'}))).rejects.toThrow());
 it('rejects an expired assertion',async()=>expect(check(await token({exp:1}))).rejects.toThrow());
 it('rejects a forged signature',async()=>{const other=await generateKeyPair('RS256');await expect(check(await token({key:other.privateKey}))).rejects.toThrow();});
});
