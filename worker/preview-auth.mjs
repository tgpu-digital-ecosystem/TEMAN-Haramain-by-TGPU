import{jwtVerify,createRemoteJWKSet}from'jose';
const issuer='https://winter-frog-171e.cloudflareaccess.com';
const publicSigningKeys=createRemoteJWKSet(new URL(issuer+'/cdn-cgi/access/certs'));
export async function authenticate(request,env,verify=jwtVerify){
 const token=request.headers.get('Cf-Access-Jwt-Assertion');if(!token||!env.ACCESS_AUD)throw new Error('Access required');
 const {payload}=await verify(token,publicSigningKeys,{issuer,audience:env.ACCESS_AUD,algorithms:['RS256']});
 if(payload.email!=='mamduh@tgpu.my')throw new Error('Founder required');return payload;
}
