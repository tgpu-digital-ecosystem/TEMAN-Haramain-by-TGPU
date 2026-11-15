"""GET-only production preflight. Never signs up, emails, mutates or prints records."""
import json,re,urllib.request,urllib.error
from pathlib import Path
source=Path('public/services.js').read_text()
base=re.search(r"base='([^']+)'",source).group(1)
key=re.search(r"key='([^']+)'",source).group(1)
assert base=='https://mpidjwjghtpeybedmbkd.supabase.co'
def get(path,bearer=None):
    headers={'apikey':key,'Accept':'application/json'}
    if bearer: headers['Authorization']='Bearer '+bearer
    request=urllib.request.Request(base+path,headers=headers,method='GET')
    try:
        with urllib.request.urlopen(request,timeout=20) as r:return r.status,json.load(r)
    except urllib.error.HTTPError as e:
        return e.code,None  # Never log server data or user identifiers.
status,settings=get('/auth/v1/settings')
assert status==200 and settings['external']['email'] is True
assert settings['mailer_autoconfirm'] is False and settings['external']['anonymous_users'] is False
print('PASS hosted public Auth configuration: email enabled, confirmation required, anonymous sign-in disabled')
for bearer in [None,'synthetic-invalid-token']:
    status,_=get('/auth/v1/user',bearer)
    assert status in (400,401,403), 'Unauthenticated or invalid Auth token unexpectedly accepted'
print('PASS hosted Auth rejects missing and invalid bearer tokens')
status,data=get('/rest/v1/teman_admins?select=user_id&limit=1')
assert status in (401,403) or (status==200 and data==[]), 'Anonymous founder registry exposure'
print('PASS hosted founder registry anonymous denial/empty result')
status,data=get('/rest/v1/teman_profiles?select=user_id&limit=1')
# A schema mismatch is not a privacy pass.
assert status in (401,403) or (status==200 and data==[]), 'Anonymous profile exposure or invalid preflight query'
print('PASS hosted profile anonymous denial/empty result')
print('Four GET-only preflight groups passed. NOT real account lifecycle, hosted tenant workflow, email or storage acceptance.')
