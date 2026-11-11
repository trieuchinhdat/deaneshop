# DEANFLOW — Lead Generation & Intelligence

Updated: 2026-11-11

## Product direction

DEANFLOW helps international businesses attract relevant visitors, capture inquiries, understand lead quality, and respond with context. The primary product is a conversion-focused website connected to a lead intelligence workspace.

The previous positioning treated D2C checkout, High-Ticket deposits, and B2B RFQ as equal priorities. This document supersedes that direction. High-Ticket and B2B remain target audiences; direct checkout and order operations are not the focus of `/admin`.

## Primary journey

Relevant search/ad/referral → landing or product page → evidence and requirements → inquiry form → Leads inbox → qualification → contact → follow-up → outcome.

No account or payment is required to submit an inquiry. A quote request is an inquiry, not an order. Quotes and commercial negotiations may occur outside this workspace and be recorded as communication activity.

## Website UX

- Default public copy and admin UI are clear English.
- Each landing page addresses a specific audience and has one clear primary CTA.
- Product CTAs preserve product, variant, and quantity context when requesting information.
- Display real specifications, relevant cases, authentic certifications, and practical buying information.
- Keep initial forms short: name, contact channel, and context necessary for the request. Company, phone, budget, and technical details are conditional rather than universally required.
- Accept personal email addresses. A business email is not proof of legitimacy.
- Do not require address, shipping carrier, payment, or account registration to capture a lead.
- Confirmation describes what actually happened. Do not invent response guarantees, assigned staff, delivered email, or prepared quotations.
- Mobile CTA, chat, and forms must not obscure one another. Use visible labels, keyboard access, clear errors, and responsive layouts.
- Marketing copy, CTA labels, and form presentation should remain configurable through Sanity. Existing hardcoded defaults are migration work, not the desired end state.

## Admin scope

Primary navigation:

1. **Leads** — search, inspect requirements, acquisition, captured website activity, assessment, ownership, communication.
2. **Follow-ups** — scheduled next actions, ordered by due time.
3. **Insights** — server-side source and qualification reporting.

**Team** is available to administrators. Orders, payment ledger, shipping, reviews, and blog moderation are not part of the active lead workspace. Legacy APIs/data are preserved until dependencies have been audited; removing navigation alone is not permission to delete shared business data.

## Customers directory

**Customers** is a separate contact directory within `/admin`. It aggregates inquiries, newsletter subscriptions, popup submissions, customer blog comments, and product reviews. It does not imply that every contact has purchased or consented to marketing.

- Group records by trimmed, case-insensitive email. This is an organizational grouping, not verified identity.
- Keep records without email separate; never merge solely by name or inferred phone identity.
- Show the latest non-empty submitted contact fields, all observed source types, first/last activity and a paginated interaction timeline.
- Keep original submissions unchanged. Link inquiry records to their lead detail and captured website activity.
- Apply role/ownership boundaries before aggregation. Sales/support only see their assigned lead records; matching email must not grant access to other representatives' records or comments/reviews.
- Search and pagination operate on the complete authorized dataset, not a recent-record sample.
- Exclude official staff blog replies from customer acquisition records.

## Qualification and workflow

Keep distinct concepts:

- Workflow: New → Contacting → Engaged → Closed.
- Qualification: Not Assessed / Qualified / Not a Fit / Spam.
- Priority: High / Normal / Low.
- Follow-up: due time and next action.

For compatibility, existing database stages `contacted` and `discovery` are displayed as Contacting and Engaged. Proposal/Won/Lost records retain explicit legacy labels until an intentional migration is performed.

Assessment must include an explanation. Behavioral observations assist staff but do not establish purchase intent. Show company names as supplied, not verified. Missing activity is **Limited activity data**, not a low-quality lead. Rule-based scoring must not be advertised as AI verification.

Newsletter/popup subscriptions are separated from sales inquiry views and source-quality reports.

## Acquisition and behavior

Preserve submission source separately from acquisition channel. Distinguish observed first touch, latest recorded touch, campaign, original landing, and submission page. Unknown remains Unknown rather than Direct.

The initial implementation captures a bounded, consent-aware session history: page views, form starts, explicitly instrumented CTA clicks, download-link clicks, and contact-link clicks. It is attached to the inquiry at submission. It does not claim cross-device identity, replay, live post-submission activity, or complete multi-session attribution.

Future event storage must use explicit session/visitor identifiers, deduplication, bounded ingestion, retention and deletion rules. Never identify people by IP alone. Do not collect field keystrokes or personal data in event labels. Keep IP-derived location separate from customer-supplied destination.

Clicking a contact link does not mean contact was completed. Clicking a download does not prove a completed download. Provider-accepted email is not proof of reading or replying. Only record confirmed actions at the appropriate layer.

## Reporting

Use database aggregates, not the records loaded in a browser page.

Initial metrics: inquiries by source/medium, assessed leads, qualified leads, spam, and qualified / assessed rate. Display assessed counts alongside rates and state the date scope.

Later metrics require their supporting data: first response time, visitor-to-lead conversion, cohort outcomes, and acquisition cost. Do not calculate revenue, ROI, or cost per lead without reliable source data. Validate segmentation and qualification outcomes before introducing automated prioritization.

## Architecture

- **Sanity:** published content, products, landing modules, brand and form presentation.
- **Cloudflare D1:** inquiries, assessment, follow-up, staff, notes, delivery outbox, and future approved event storage.
- **Next.js:** server page entry points; client components for interactive workspace and forms.
- Keep existing generated Sanity types for CMS data. D1 entities use their database domain types.
- Enforce role and ownership on APIs, not only navigation. Sales/support access assigned leads; marketing reads intelligence; administrators manage ownership/team.
- Do not use live customer data or send outreach as part of verification.

## Delivery priorities

1. Consolidate inquiry intake and the lead workspace.
2. Make qualification, contact history and follow-up useful and reliable.
3. Improve attribution and relevant behavioral coverage without slowing the website.
4. Expand Insights based on trustworthy event and qualification data.
5. Retire unused commerce code only after dependency review and migration planning.

## Acceptance checks

- All inquiry entry points reach a visible, authorized lead inbox.
- Requests preserve the customer's original context and available acquisition information.
- A user can inspect a lead, contact them, record an outcome, and schedule the next action.
- Follow-ups and reports query the full authorized dataset.
- Missing tracking, email delivery errors, stale writes, and unavailable database migrations are visible.
- Existing data remains intact; migrations are additive and verified before deployment.
- Type checking, relevant behavioral tests, migration verification, production build, and browser UX checks are reported separately with their actual results.
