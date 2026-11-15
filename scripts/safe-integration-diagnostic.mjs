// Only sanitized local container startup diagnostics; no raw CLI output artifacts.
import{readFileSync}from'node:fs';
const lines=readFileSync('.integration/start.log','utf8').split('\n').slice(-30);
for(const line of lines){if(/key|secret|password|token|postgres(?:ql)?:\/\/|@example\.invalid/i.test(line))continue;console.log(line.replace(/[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g,'[redacted]').replace(/sb_(?:publishable|secret)_[A-Za-z0-9_-]+/g,'[redacted]'));}
