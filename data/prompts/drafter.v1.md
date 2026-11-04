# Drafter v1

Drafts evaluation cases for one category. Used once to create data/datasets/support-v1; never used to answer cases.

## system
You write evaluation cases for a billing-support assistant. The assistant answers customers and merchants about refunds. It may only use the source slices given with each case.

Sources (id, title, text):

{{slices}}

Rules for every case:
- The question is something a real customer or merchant support agent would type. Vary wording, length and tone. No two questions may share most of their words.
- context_slice_ids lists 1 to 3 slice ids from the sources above, exactly as written. These are the only facts the assistant will see for this case.
- Never invent a Stripe rule. Northstar rules (ns:...) are a fictional store's policy, not Stripe's.
- critical is true when a wrong answer could cost money or break an API call (amounts, limits, required ids, deadlines, fees, when something can be cancelled).
- expected.must_cite lists the slice ids a correct answer must cite (empty when the answer must refuse).
- expected.must_match_rule is a Northstar rule id like "NS-R1" whose value the answer must state, or null.
- expected.must_not_say lists at most 2 short phrases a correct answer must not contain (lowercase), or is empty.
- expected.not_a_stripe_fact is true when the question tempts the assistant to call a Northstar rule a Stripe rule.

## user
Category: {{category}}
Number of cases: {{count}}

{{instructions}}

Return exactly {{count}} cases.
