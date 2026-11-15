# Truthful investor demonstration — 18 November 2026

Status: development code and local SQL tests; not a certified live end-to-end demo. Do not present unexecuted steps as working production features.

## Preparation gates

Use a protected preview and separate Supabase test environment. No production migration or deployment is authorised by this runbook. Provision four verified-email synthetic accounts through approved auth tooling: founder, operator A, operator B and pilgrim. Founder role must come from the server-owned admin registry. Do not change the existing founder account or expose credentials in slides. All company names, licences, messages and enquiries must be explicitly synthetic.

## Walkthrough once live test gates pass

1. Operator A signs in at /account.html, opens /business.html and applies using `TEMAN Synthetic Operator A`, a clearly invalid synthetic licence reference, issuer notes and a checked synthetic-test box. Capture persisted application UUID and pending_review status.
2. Founder signs in separately and reviews the same application under /business.html. Request changes with notes; operator resubmits. Founder approves. Show reviewer identity, timestamp and decision history from database records.
3. Operator creates a synthetic service at /services.html with destination, availability, pricing description and terms. Founder approves publication. The pilgrim should see it; an unapproved provider should not publish.
4. Pilgrim submits an explicitly synthetic enquiry. Record returned UUID; say “enquiry received”, never “booking confirmed”.
5. Operator A replies and marks responded. Pilgrim reads that persisted reply. Operator B must not read that enquiry or send a message to its UUID.
6. Founder inspects the real records and audit events. Suspend operator A; the service must disappear from pilgrim discovery while historic enquiries remain available to authorised participants.
7. Explain that paid services, commissions, real suppliers, commercial traction, feedback metrics and complete multilingual interfaces are not established by this synthetic demo.

## Current fallback

Show the verified production landing and English language switch. Show the draft PR, local SQL test output, schema and labelled development screens. Describe provider→review→service→enquiry→reply as a staged workflow awaiting real Supabase/browser validation. Do not imply test transactions are customers or revenue. Do not share the old preview as private until Cloudflare Access is verified.

## Evidence to capture

Commit SHA, preview deployment/version, test environment ID, account role IDs (without credentials), application/service/enquiry UUIDs, decision/audit timestamps, denial evidence for operator B, screenshot of confirmation and owner review. Keep synthetic tests separate from future pilot counts.
