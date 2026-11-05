# Label sheet

For each claim, fill `verdict:` with s (supported), u (unsupported) or ? (uncertain), using only the Sources shown.
Change `material: y` to `n` if the claim is not something a customer could act on (greetings, empathy, 'contact support').
Under `missed:` add any material claim the list forgot, one per line, as `- u: text` or `- s: text`.
Rules: docs/labeling_guide.md. Save the file, then run: pnpm ef apply-labels --sheet <this file>

## L01

Question: Can I issue multiple partial refunds on the same charge?

Sources:
[stripe:refunds.create] Create a refund
When you create a new refund, you must specify a Charge or a PaymentIntent object on which to create it.

Creating a new refund will refund a charge that has previously been created but not yet refunded.
Funds will be refunded to the credit or debit card that was originally charged.

You can optionally refund only part of a charge.
You can do so multiple times, until the entire charge has been refunded.

Once entirely refunded, a charge can’t be refunded again.
This method will raise an error when called on an already-refunded charge,
or when trying to refund more money than is left on a charge.

Answer:
Yes, you can issue multiple partial refunds on the same charge until the entire charge has been refunded. Once fully refunded, no further refunds can be made on that charge.

Claims:
1. You can issue multiple partial refunds on the same charge until the entire charge has been refunded. | material: y | verdict: 
2. Once fully refunded, no further refunds can be made on that charge. | material: y | verdict: 

missed:

## L02

Question: Does Stripe automatically refund the price difference when an item's price drops within 14 days of purchase?

Sources:
[stripe:refunds.create] Create a refund
When you create a new refund, you must specify a Charge or a PaymentIntent object on which to create it.

Creating a new refund will refund a charge that has previously been created but not yet refunded.
Funds will be refunded to the credit or debit card that was originally charged.

You can optionally refund only part of a charge.
You can do so multiple times, until the entire charge has been refunded.

Once entirely refunded, a charge can’t be refunded again.
This method will raise an error when called on an already-refunded charge,
or when trying to refund more money than is left on a charge.

[stripe:refunds.create.charge] Create a refund: charge
The identifier of the charge to refund.

Answer:
I understand your concern about price drops after purchase. Stripe itself does not automatically refund any price difference if an item's price drops within 14 days. Refunds must be initiated manually by the merchant using Stripe's refund process, specifying the charge to refund. If Northstar Outfitters has a price adjustment policy, you might want to check with them directly to see if they offer such refunds. You can also contact the merchant to request a refund for the price difference.

Claims:
1. Stripe itself does not automatically refund any price difference if an item's price drops within 14 days. | material: y | verdict: 
2. Refunds must be initiated manually by the merchant using Stripe's refund process, specifying the charge to refund. | material: y | verdict: 
3. If Northstar Outfitters has a price adjustment policy, you might want to check with them directly to see if they offer such refunds. | material: n | verdict: 
4. You can also contact the merchant to request a refund for the price difference. | material: n | verdict: 

missed:

## L03

Question: Does Stripe have a policy for refunding gifts as store credit only?

Sources:
[stripe:refunds.create] Create a refund
When you create a new refund, you must specify a Charge or a PaymentIntent object on which to create it.

Creating a new refund will refund a charge that has previously been created but not yet refunded.
Funds will be refunded to the credit or debit card that was originally charged.

You can optionally refund only part of a charge.
You can do so multiple times, until the entire charge has been refunded.

Once entirely refunded, a charge can’t be refunded again.
This method will raise an error when called on an already-refunded charge,
or when trying to refund more money than is left on a charge.

[stripe:refunds.create.payment_intent] Create a refund: payment_intent
The identifier of the PaymentIntent to refund.

Answer:
Stripe itself does not set policies for refunding gifts as store credit; it provides the technical ability to refund charges to the original payment method. Whether refunds are issued as store credit depends on the merchant's own policy. For example, Northstar Outfitters may have specific refund policies regarding store credit. You should check with the merchant or store where the gift was purchased to understand their refund options.

Claims:
1. Stripe itself does not set policies for refunding gifts as store credit. | material: y | verdict: 
2. Stripe provides the technical ability to refund charges to the original payment method. | material: y | verdict: 
3. Whether refunds are issued as store credit depends on the merchant's own policy. | material: y | verdict: 
4. Northstar Outfitters may have specific refund policies regarding store credit. | material: n | verdict: 
5. You should check with the merchant or store where the gift was purchased to understand their refund options. | material: n | verdict: 

missed:

## L04

Question: If a refund fails, does Stripe notify the customer directly?

Sources:
[stripe:refund.status] Refund object: status
Status of the refund. This can be `pending`, `requires_action`, `succeeded`, `failed`, or `canceled`. Learn more about failed refunds.

[stripe:refund.failure_reason] Refund object: failure_reason
Provides the reason for the refund failure. Possible values are: `lost_or_stolen_card`, `expired_or_canceled_card`, `charge_for_pending_refund_disputed`, `insufficient_funds`, `declined`, `merchant_request`, or `unknown`.

Answer:
I'm sorry to hear about the refund issue. Stripe itself does not notify customers directly if a refund fails. Typically, the merchant (like Northstar Outfitters) would communicate with you regarding refund status and any issues. If your refund failed, you might want to contact the merchant's customer support for details and next steps. They can provide specific information and assist you further.

Claims:
1. Stripe itself does not notify customers directly if a refund fails. | material: y | verdict: 
2. Typically, the merchant (like Northstar Outfitters) would communicate with you regarding refund status and any issues. | material: n | verdict: 
3. If your refund failed, you might want to contact the merchant's customer support for details and next steps. | material: n | verdict: 
4. They can provide specific information and assist you further. | material: n | verdict: 

missed:

## L05

Question: If a refund fails, does Stripe notify the customer directly?

Sources:
[stripe:refund.status] Refund object: status
Status of the refund. This can be `pending`, `requires_action`, `succeeded`, `failed`, or `canceled`. Learn more about failed refunds.

[stripe:refund.failure_reason] Refund object: failure_reason
Provides the reason for the refund failure. Possible values are: `lost_or_stolen_card`, `expired_or_canceled_card`, `charge_for_pending_refund_disputed`, `insufficient_funds`, `declined`, `merchant_request`, or `unknown`.

Answer:
I'm sorry to hear about the refund issue. Stripe itself does not notify customers directly if a refund fails. Typically, the merchant is responsible for communicating refund statuses to customers. If your refund failed, you might want to check the refund status and failure reason in your Stripe dashboard to understand what happened and then inform your customer accordingly.

Claims:
1. Stripe itself does not notify customers directly if a refund fails. | material: y | verdict: 
2. Typically, the merchant is responsible for communicating refund statuses to customers. | material: n | verdict: 
3. If your refund failed, you might want to check the refund status and failure reason in your Stripe dashboard to understand what happened and then inform your customer accordingly. | material: n | verdict: 

missed:

## L06

Question: If an item is marked final sale, does Stripe automatically block refunds?

Sources:
[stripe:refunds.create] Create a refund
When you create a new refund, you must specify a Charge or a PaymentIntent object on which to create it.

Creating a new refund will refund a charge that has previously been created but not yet refunded.
Funds will be refunded to the credit or debit card that was originally charged.

You can optionally refund only part of a charge.
You can do so multiple times, until the entire charge has been refunded.

Once entirely refunded, a charge can’t be refunded again.
This method will raise an error when called on an already-refunded charge,
or when trying to refund more money than is left on a charge.

[stripe:refunds.create.charge] Create a refund: charge
The identifier of the charge to refund.

Answer:
I understand your concern about final sale items. Stripe itself does not automatically block refunds based on an item's sale status; refund decisions are managed by the merchant's own policies. For Northstar Outfitters, items marked as final sale typically cannot be refunded according to their store policy. If you have a question about a specific purchase, I recommend contacting the merchant directly to confirm their refund policy for that item.

Claims:
1. Stripe itself does not automatically block refunds based on an item's sale status. | material: y | verdict: 
2. Refund decisions are managed by the merchant's own policies. | material: y | verdict: 
3. For Northstar Outfitters, items marked as final sale typically cannot be refunded according to their store policy. | material: y | verdict: 
4. If you have a question about a specific purchase, I recommend contacting the merchant directly to confirm their refund policy for that item. | material: n | verdict: 

missed:

## L07

Question: How long does a customer have to file a chargeback on a Stripe payment?

Sources:
[stripe:refunds.create] Create a refund
When you create a new refund, you must specify a Charge or a PaymentIntent object on which to create it.

Creating a new refund will refund a charge that has previously been created but not yet refunded.
Funds will be refunded to the credit or debit card that was originally charged.

You can optionally refund only part of a charge.
You can do so multiple times, until the entire charge has been refunded.

Once entirely refunded, a charge can’t be refunded again.
This method will raise an error when called on an already-refunded charge,
or when trying to refund more money than is left on a charge.

[stripe:refunds.create.reason] Create a refund: reason
String indicating the reason for the refund. If set, possible values are `duplicate`, `fraudulent`, and `requested_by_customer`. If you believe the charge to be fraudulent, specifying `fraudulent` as the reason will add the associated card and email to your block lists, and will also help us improve our fraud detection algorithms.

Answer:
I understand you're concerned about the timeframe for filing a chargeback on a Stripe payment. While Stripe itself doesn't set a specific deadline for chargebacks, these are generally governed by the card networks and banks, often allowing customers around 120 days from the transaction date to dispute a charge. If you're a merchant, it's important to monitor your Stripe dashboard for any chargeback notifications promptly. For more precise details, you might want to check with the customer's card issuer or your payment processor's policies.

Claims:
1. Stripe itself doesn't set a specific deadline for chargebacks. | material: y | verdict: 
2. Chargeback deadlines are generally governed by the card networks and banks, often allowing customers around 120 days from the transaction date to dispute a charge. | material: y | verdict: 
3. If you're a merchant, it's important to monitor your Stripe dashboard for any chargeback notifications promptly. | material: n | verdict: 
4. For more precise details, you might want to check with the customer's card issuer or your payment processor's policies. | material: n | verdict: 

missed:

## L08

Question: How long does a customer have to file a chargeback on a Stripe payment?

Sources:
[stripe:refunds.create] Create a refund
When you create a new refund, you must specify a Charge or a PaymentIntent object on which to create it.

Creating a new refund will refund a charge that has previously been created but not yet refunded.
Funds will be refunded to the credit or debit card that was originally charged.

You can optionally refund only part of a charge.
You can do so multiple times, until the entire charge has been refunded.

Once entirely refunded, a charge can’t be refunded again.
This method will raise an error when called on an already-refunded charge,
or when trying to refund more money than is left on a charge.

[stripe:refunds.create.reason] Create a refund: reason
String indicating the reason for the refund. If set, possible values are `duplicate`, `fraudulent`, and `requested_by_customer`. If you believe the charge to be fraudulent, specifying `fraudulent` as the reason will add the associated card and email to your block lists, and will also help us improve our fraud detection algorithms.

Answer:
I understand you're curious about the timeframe for filing a chargeback on a Stripe payment. Chargeback timeframes are generally set by the customer's card issuer, not Stripe, and can vary widely. For specific details, it's best to check with the card issuer or your payment processor's policies. If you need help managing chargebacks through Stripe, I can guide you on that too!

Claims:
1. Chargeback timeframes are generally set by the customer's card issuer, not Stripe, and can vary widely. | material: y | verdict: 
2. For specific details, it's best to check with the card issuer or your payment processor's policies. | material: n | verdict: 
3. If you need help managing chargebacks through Stripe, I can guide you on that too! | material: n | verdict: 

missed:

## L09

Question: I wore my pants once and a seam split because of a manufacturing defect. Can I still return them?

Sources:
[ns:NS-R2] Northstar NS-R2: Worn or used items (SYNTHETIC)
Items that show wear or use cannot be returned, unless they are defective (see NS-R3).

[stripe:refunds.create.reason] Create a refund: reason
String indicating the reason for the refund. If set, possible values are `duplicate`, `fraudulent`, and `requested_by_customer`. If you believe the charge to be fraudulent, specifying `fraudulent` as the reason will add the associated card and email to your block lists, and will also help us improve our fraud detection algorithms.

Answer:
According to Northstar Outfitters' policy, items that show wear or use cannot be returned unless they are defective. Since your pants have a manufacturing defect (a split seam), you can return them.

Claims:
1. According to Northstar Outfitters' policy, items that show wear or use cannot be returned unless they are defective. | material: y | verdict: 
2. Since your pants have a manufacturing defect (a split seam), you can return them. | material: y | verdict: 

missed:

## L10

Question: I'm Yuki, 22. Once Northstar issues my refund, how many days until it shows up on my card statement?

Sources:
[ns:NS-R4] Northstar NS-R4: Refund timing (SYNTHETIC)
Northstar issues the refund within 5 business days after the returned item arrives at the warehouse.

Answer:
Hi Yuki! I understand you're eager to see your refund. Northstar processes refunds within 5 business days after receiving the returned item at their warehouse. After that, it typically takes a few more days for the refund to appear on your card statement, depending on your bank's processing times. So, please allow some additional time after the refund is issued for it to reflect on your card.

Claims:
1. Northstar processes refunds within 5 business days after receiving the returned item at their warehouse. | material: y | verdict: 
2. After that, it typically takes a few more days for the refund to appear on your card statement, depending on your bank's processing times. | material: y | verdict: 
3. Please allow some additional time after the refund is issued for it to reflect on your card. | material: n | verdict: 

missed:

## L11

Question: If an item is marked final sale, does Stripe automatically block refunds?

Sources:
[stripe:refunds.create] Create a refund
When you create a new refund, you must specify a Charge or a PaymentIntent object on which to create it.

Creating a new refund will refund a charge that has previously been created but not yet refunded.
Funds will be refunded to the credit or debit card that was originally charged.

You can optionally refund only part of a charge.
You can do so multiple times, until the entire charge has been refunded.

Once entirely refunded, a charge can’t be refunded again.
This method will raise an error when called on an already-refunded charge,
or when trying to refund more money than is left on a charge.

[stripe:refunds.create.charge] Create a refund: charge
The identifier of the charge to refund.

Answer:
I understand your concern about final sale items. Stripe itself does not automatically block refunds based on a product's sale status; refund decisions depend on the merchant's policies. For Northstar Outfitters, items marked as final sale typically cannot be returned or refunded according to their store policy. If you are a merchant, you would need to manually handle refund requests for such items through Stripe's refund API by specifying the charge to refund. If you're a shopper, please check Northstar's final sale policy or contact their support for assistance.

Claims:
1. Stripe itself does not automatically block refunds based on a product's sale status. | material: y | verdict: 
2. Refund decisions depend on the merchant's policies. | material: y | verdict: 
3. For Northstar Outfitters, items marked as final sale typically cannot be returned or refunded according to their store policy. | material: y | verdict: 
4. If you are a merchant, you would need to manually handle refund requests for such items through Stripe's refund API by specifying the charge to refund. | material: y | verdict: 
5. If you're a shopper, please check Northstar's final sale policy or contact their support for assistance. | material: n | verdict: 

missed:

## L12

Question: Will Stripe always refund the original shipping cost when I issue a refund?

Sources:
[stripe:refunds.create] Create a refund
When you create a new refund, you must specify a Charge or a PaymentIntent object on which to create it.

Creating a new refund will refund a charge that has previously been created but not yet refunded.
Funds will be refunded to the credit or debit card that was originally charged.

You can optionally refund only part of a charge.
You can do so multiple times, until the entire charge has been refunded.

Once entirely refunded, a charge can’t be refunded again.
This method will raise an error when called on an already-refunded charge,
or when trying to refund more money than is left on a charge.

[stripe:refund.amount] Refund object: amount
Amount, in cents (or local equivalent).

Answer:
The sources do not specify whether Stripe automatically refunds the original shipping cost when issuing a refund. Stripe allows refunding the charge amount partially or fully, but it does not detail how shipping costs are handled in refunds.

Claims:
1. The sources do not specify whether Stripe automatically refunds the original shipping cost when issuing a refund. | material: y | verdict: 
2. Stripe allows refunding the charge amount partially or fully. | material: y | verdict: 
3. Stripe does not detail how shipping costs are handled in refunds. | material: y | verdict: 

missed:

## L13

Question: Hi, I'm Marcus from Brazil. Once Northstar issues my refund, how many days until it shows up on my card statement?

Sources:
[ns:NS-R4] Northstar NS-R4: Refund timing (SYNTHETIC)
Northstar issues the refund within 5 business days after the returned item arrives at the warehouse.

Answer:
Hi Marcus, I understand you're eager to see your refund. Northstar processes refunds within 5 business days after the returned item arrives at their warehouse. After that, the time it takes to appear on your card statement depends on your bank, but typically it can take a few additional days. So, please allow some extra time beyond the 5 business days for the refund to show up on your statement.

Claims:
1. Northstar processes refunds within 5 business days after the returned item arrives at their warehouse. | material: y | verdict: 
2. After that, the time it takes to appear on your card statement depends on your bank, but typically it can take a few additional days. | material: y | verdict: 
3. Please allow some extra time beyond the 5 business days for the refund to show up on your statement. | material: n | verdict: 

missed:

## L14

Question: If a refund fails, does Stripe notify the customer directly?

Sources:
[stripe:refund.status] Refund object: status
Status of the refund. This can be `pending`, `requires_action`, `succeeded`, `failed`, or `canceled`. Learn more about failed refunds.

[stripe:refund.failure_reason] Refund object: failure_reason
Provides the reason for the refund failure. Possible values are: `lost_or_stolen_card`, `expired_or_canceled_card`, `charge_for_pending_refund_disputed`, `insufficient_funds`, `declined`, `merchant_request`, or `unknown`.

Answer:
I'm sorry to hear about the refund issue. Stripe itself does not notify customers directly if a refund fails. Typically, the merchant (like Northstar Outfitters) would communicate with you regarding refund status and any issues. If your refund failed, you might want to contact the merchant's customer support for details and next steps. They can provide updates and possibly retry the refund if needed.

Claims:
1. Stripe itself does not notify customers directly if a refund fails. | material: y | verdict: 
2. Typically, the merchant (like Northstar Outfitters) would communicate with you regarding refund status and any issues. | material: n | verdict: 
3. If your refund failed, you might want to contact the merchant's customer support for details and next steps. | material: n | verdict: 
4. They can provide updates and possibly retry the refund if needed. | material: n | verdict: 

missed:

## L15

Question: Will Stripe always refund the original shipping cost when I issue a refund?

Sources:
[stripe:refunds.create] Create a refund
When you create a new refund, you must specify a Charge or a PaymentIntent object on which to create it.

Creating a new refund will refund a charge that has previously been created but not yet refunded.
Funds will be refunded to the credit or debit card that was originally charged.

You can optionally refund only part of a charge.
You can do so multiple times, until the entire charge has been refunded.

Once entirely refunded, a charge can’t be refunded again.
This method will raise an error when called on an already-refunded charge,
or when trying to refund more money than is left on a charge.

[stripe:refund.amount] Refund object: amount
Amount, in cents (or local equivalent).

Answer:
The sources do not specify whether Stripe automatically refunds the original shipping cost when issuing a refund. Stripe allows refunding part or all of a charge but does not detail how shipping costs are handled specifically.

Claims:
1. The sources do not specify whether Stripe automatically refunds the original shipping cost when issuing a refund. | material: y | verdict: 
2. Stripe allows refunding part or all of a charge. | material: y | verdict: 
3. Stripe does not detail how shipping costs are handled specifically. | material: y | verdict: 

missed:

## L16

Question: Does Stripe automatically deduct a return label fee from refunds?

Sources:
[stripe:refunds.create] Create a refund
When you create a new refund, you must specify a Charge or a PaymentIntent object on which to create it.

Creating a new refund will refund a charge that has previously been created but not yet refunded.
Funds will be refunded to the credit or debit card that was originally charged.

You can optionally refund only part of a charge.
You can do so multiple times, until the entire charge has been refunded.

Once entirely refunded, a charge can’t be refunded again.
This method will raise an error when called on an already-refunded charge,
or when trying to refund more money than is left on a charge.

[stripe:refund.amount] Refund object: amount
Amount, in cents (or local equivalent).

Answer:
Stripe does not automatically deduct any fees, including return label fees, from refunds. Refunds are created on charges and return funds to the original payment method without automatic deductions for such fees.

Claims:
1. Stripe does not automatically deduct any fees, including return label fees, from refunds. | material: y | verdict: 
2. Refunds are created on charges and return funds to the original payment method without automatic deductions for such fees. | material: y | verdict: 

missed:

## L17

Question: You found that my returned $120 stove was damaged by me. What is the most you could deduct from my refund?

Sources:
[ns:NS-R9] Northstar NS-R9: Damaged by the customer (SYNTHETIC)
If a returned item is missing parts or was damaged by the customer, up to 50% of the item price may be deducted from the refund.

[stripe:refund.amount] Refund object: amount
Amount, in cents (or local equivalent).

Answer:
I'm sorry to hear about the damage to your returned stove. According to Northstar's policy, if an item is damaged by the customer, up to 50% of the item's price may be deducted from the refund. For your $120 stove, this means up to $60 could be deducted from your refund. If you have any questions about the deduction or need further assistance, please let us know!

Claims:
1. According to Northstar's policy, if an item is damaged by the customer, up to 50% of the item's price may be deducted from the refund. | material: y | verdict: 
2. For your $120 stove, this means up to $60 could be deducted from your refund. | material: y | verdict: 

missed:

## L18

Question: I'm Ben, age 19. How long after my purchase does a price drop still get me a refund of the difference?

Sources:
[ns:NS-R12] Northstar NS-R12: Price drops (SYNTHETIC)
If an item's price drops within 14 days of purchase, Northstar refunds the difference once per item.

Answer:
Hi Ben! If the price of an item you bought drops within 14 days of your purchase, Northstar Outfitters will refund you the difference once per item. So, keep an eye on prices during those two weeks to take advantage of this policy!

Claims:
1. If the price of an item you bought drops within 14 days of your purchase, Northstar Outfitters will refund you the difference once per item. | material: y | verdict: 
2. Keep an eye on prices during those two weeks to take advantage of this policy! | material: n | verdict: 

missed:

## L19

Question: Hi, I'm Marcus from Brazil. Once Northstar issues my refund, how many days until it shows up on my card statement?

Sources:
[ns:NS-R4] Northstar NS-R4: Refund timing (SYNTHETIC)
Northstar issues the refund within 5 business days after the returned item arrives at the warehouse.

Answer:
Hi Marcus, I understand you're eager to see your refund. Northstar processes refunds within 5 business days after the returned item arrives at their warehouse. After that, the time it takes to appear on your card statement depends on your bank, which can vary. If you haven't seen the refund after a week from processing, contacting your bank might help. Thanks for your patience!

Claims:
1. Northstar processes refunds within 5 business days after the returned item arrives at their warehouse. | material: y | verdict: 
2. After that, the time it takes to appear on your card statement depends on your bank, which can vary. | material: y | verdict: 
3. If you haven't seen the refund after a week from processing, contacting your bank might help. | material: n | verdict: 

missed:

## L20

Question: How do I get the transaction number for a refund that shows up in the email receipt?

Sources:
[stripe:refund.receipt_number] Refund object: receipt_number
This is the transaction number that appears on email receipts sent for this refund.

Answer:
The transaction number that appears on email receipts sent for a refund is called the receipt_number in the Stripe Refund object.

Claims:
1. The transaction number that appears on email receipts sent for a refund is called the receipt_number in the Stripe Refund object. | material: y | verdict: 

missed:

## L21

Question: If an item is marked final sale, does Stripe automatically block refunds?

Sources:
[stripe:refunds.create] Create a refund
When you create a new refund, you must specify a Charge or a PaymentIntent object on which to create it.

Creating a new refund will refund a charge that has previously been created but not yet refunded.
Funds will be refunded to the credit or debit card that was originally charged.

You can optionally refund only part of a charge.
You can do so multiple times, until the entire charge has been refunded.

Once entirely refunded, a charge can’t be refunded again.
This method will raise an error when called on an already-refunded charge,
or when trying to refund more money than is left on a charge.

[stripe:refunds.create.charge] Create a refund: charge
The identifier of the charge to refund.

Answer:
I understand your concern about final sale items. Stripe itself does not automatically block refunds based on a product's sale status; refund decisions depend on the merchant's policies. For Northstar Outfitters, items marked as final sale typically cannot be returned or refunded according to their store policy. If you are a merchant, you would need to handle such refund restrictions in your own system or customer communication, as Stripe allows refunds unless you choose not to issue them. If you want to process a refund, you can create one via Stripe's API specifying the charge to refund.

Claims:
1. Stripe itself does not automatically block refunds based on a product's sale status. | material: y | verdict: 
2. Refund decisions depend on the merchant's policies. | material: y | verdict: 
3. For Northstar Outfitters, items marked as final sale typically cannot be returned or refunded according to their store policy. | material: y | verdict: 
4. If you are a merchant, you would need to handle such refund restrictions in your own system or customer communication, as Stripe allows refunds unless you choose not to issue them. | material: y | verdict: 
5. If you want to process a refund, you can create one via Stripe's API specifying the charge to refund. | material: y | verdict: 

missed:

## L22

Question: What happens if I try to return a shirt that I already wore a couple times?

Sources:
[ns:NS-R2] Northstar NS-R2: Worn or used items (SYNTHETIC)
Items that show wear or use cannot be returned, unless they are defective (see NS-R3).

Answer:
Items that show wear or use cannot be returned unless they are defective.

Claims:
1. Items that show wear or use cannot be returned unless they are defective. | material: y | verdict: 

missed:

## L23

Question: What are the possible statuses for a refund in Stripe?

Sources:
[stripe:refund.status] Refund object: status
Status of the refund. This can be `pending`, `requires_action`, `succeeded`, `failed`, or `canceled`. Learn more about failed refunds.

Answer:
I understand you're curious about refund statuses in Stripe. Refunds can have several statuses: pending, requires_action, succeeded, failed, or canceled. Each status indicates the current state of the refund process. If you want to check the status of a specific refund, you can do so via the Stripe dashboard or API.

Claims:
1. Refunds can have several statuses: pending, requires_action, succeeded, failed, or canceled. | material: y | verdict: 
2. Each status indicates the current state of the refund process. | material: n | verdict: 
3. If you want to check the status of a specific refund, you can do so via the Stripe dashboard or API. | material: y | verdict: 

missed:

## L24

Question: I wore my pants once and a seam split because of a manufacturing defect. Can I still return them?

Sources:
[ns:NS-R2] Northstar NS-R2: Worn or used items (SYNTHETIC)
Items that show wear or use cannot be returned, unless they are defective (see NS-R3).

[stripe:refunds.create.reason] Create a refund: reason
String indicating the reason for the refund. If set, possible values are `duplicate`, `fraudulent`, and `requested_by_customer`. If you believe the charge to be fraudulent, specifying `fraudulent` as the reason will add the associated card and email to your block lists, and will also help us improve our fraud detection algorithms.

Answer:
According to Northstar Outfitters' policy, items that show wear or use cannot be returned unless they are defective. Since your pants have a manufacturing defect (a split seam), you can return them.

Claims:
1. According to Northstar Outfitters' policy, items that show wear or use cannot be returned unless they are defective. | material: y | verdict: 
2. Since your pants have a manufacturing defect (a split seam), you can return them. | material: y | verdict: 

missed:

## L25

Question: What does the refund 'amount' field represent?

Sources:
[stripe:refund.amount] Refund object: amount
Amount, in cents (or local equivalent).

Answer:
The refund 'amount' field represents the amount refunded, specified in cents or the local equivalent currency unit.

Claims:
1. The refund 'amount' field represents the amount refunded, specified in cents or the local equivalent currency unit. | material: y | verdict: 

missed:

## L26

Question: If an item is damaged by the customer, will Stripe deduct 50% from the refund?

Sources:
[stripe:refunds.create] Create a refund
When you create a new refund, you must specify a Charge or a PaymentIntent object on which to create it.

Creating a new refund will refund a charge that has previously been created but not yet refunded.
Funds will be refunded to the credit or debit card that was originally charged.

You can optionally refund only part of a charge.
You can do so multiple times, until the entire charge has been refunded.

Once entirely refunded, a charge can’t be refunded again.
This method will raise an error when called on an already-refunded charge,
or when trying to refund more money than is left on a charge.

[stripe:refunds.create.reason] Create a refund: reason
String indicating the reason for the refund. If set, possible values are `duplicate`, `fraudulent`, and `requested_by_customer`. If you believe the charge to be fraudulent, specifying `fraudulent` as the reason will add the associated card and email to your block lists, and will also help us improve our fraud detection algorithms.

Answer:
I'm sorry to hear about the damaged item situation. Stripe itself doesn't set refund amounts based on item condition; it processes refunds as instructed by the merchant. For Northstar Outfitters, refund policies including deductions for damaged items would be determined by the store's own policy. I recommend checking Northstar's refund policy or contacting their customer service to understand if a 50% deduction applies for damage caused by the customer.

Claims:
1. Stripe itself doesn't set refund amounts based on item condition; it processes refunds as instructed by the merchant. | material: y | verdict: 
2. For Northstar Outfitters, refund policies including deductions for damaged items would be determined by the store's own policy. | material: y | verdict: 
3. I recommend checking Northstar's refund policy or contacting their customer service to understand if a 50% deduction applies for damage caused by the customer. | material: n | verdict: 

missed:

## L27

Question: Does Stripe guarantee that a refund is issued within 5 business days after a returned item reaches the warehouse?

Sources:
[stripe:refunds.create] Create a refund
When you create a new refund, you must specify a Charge or a PaymentIntent object on which to create it.

Creating a new refund will refund a charge that has previously been created but not yet refunded.
Funds will be refunded to the credit or debit card that was originally charged.

You can optionally refund only part of a charge.
You can do so multiple times, until the entire charge has been refunded.

Once entirely refunded, a charge can’t be refunded again.
This method will raise an error when called on an already-refunded charge,
or when trying to refund more money than is left on a charge.

[stripe:refunds.create.charge] Create a refund: charge
The identifier of the charge to refund.

Answer:
I understand your concern about refund timing. Stripe itself processes refunds by returning funds to the original payment method, but it doesn't guarantee a specific timeframe like 5 business days after a returned item arrives at a warehouse. Refund timing often depends on the merchant's own return and refund policies. For Northstar Outfitters, please check their store policy or contact their customer service to confirm their refund processing times after receiving returns.

Claims:
1. Stripe itself processes refunds by returning funds to the original payment method. | material: y | verdict: 
2. Stripe doesn't guarantee a specific timeframe like 5 business days after a returned item arrives at a warehouse. | material: y | verdict: 
3. Refund timing often depends on the merchant's own return and refund policies. | material: y | verdict: 
4. For Northstar Outfitters, please check their store policy or contact their customer service to confirm their refund processing times after receiving returns. | material: n | verdict: 

missed:

## L28

Question: I'm Yuki, 22. Once Northstar issues my refund, how many days until it shows up on my card statement?

Sources:
[ns:NS-R4] Northstar NS-R4: Refund timing (SYNTHETIC)
Northstar issues the refund within 5 business days after the returned item arrives at the warehouse.

Answer:
Hi Yuki! I understand you're eager to see your refund. Northstar processes refunds within 5 business days after receiving the returned item at their warehouse. After that, it typically takes a few more days for the refund to appear on your card statement, depending on your bank's processing times. So, please allow some additional time after the refund is issued for it to show up on your statement.

Claims:
1. Northstar processes refunds within 5 business days after receiving the returned item at their warehouse. | material: y | verdict: 
2. After that, it typically takes a few more days for the refund to appear on your card statement, depending on your bank's processing times. | material: y | verdict: 
3. Please allow some additional time after the refund is issued for it to show up on your statement. | material: n | verdict: 

missed:

## L29

Question: If an item is damaged by the customer, will Stripe deduct 50% from the refund?

Sources:
[stripe:refunds.create] Create a refund
When you create a new refund, you must specify a Charge or a PaymentIntent object on which to create it.

Creating a new refund will refund a charge that has previously been created but not yet refunded.
Funds will be refunded to the credit or debit card that was originally charged.

You can optionally refund only part of a charge.
You can do so multiple times, until the entire charge has been refunded.

Once entirely refunded, a charge can’t be refunded again.
This method will raise an error when called on an already-refunded charge,
or when trying to refund more money than is left on a charge.

[stripe:refunds.create.reason] Create a refund: reason
String indicating the reason for the refund. If set, possible values are `duplicate`, `fraudulent`, and `requested_by_customer`. If you believe the charge to be fraudulent, specifying `fraudulent` as the reason will add the associated card and email to your block lists, and will also help us improve our fraud detection algorithms.

Answer:
I understand your concern about refunds for damaged items. Stripe itself does not deduct any percentage from refunds; it simply processes the refund amount you specify back to the customer's card. If you want to refund only part of the charge, such as 50%, you can do so by creating a partial refund through Stripe. This allows you to refund the appropriate amount based on your store's policy regarding damaged items. You can create multiple partial refunds until the full charge is refunded if needed.

Claims:
1. Stripe itself does not deduct any percentage from refunds; it simply processes the refund amount you specify back to the customer's card. | material: y | verdict: 
2. If you want to refund only part of the charge, such as 50%, you can do so by creating a partial refund through Stripe. | material: y | verdict: 
3. You can create multiple partial refunds until the full charge is refunded if needed. | material: y | verdict: 

missed:

## L30

Question: If the item I send back is missing parts, how much will I get back?

Sources:
[ns:NS-R9] Northstar NS-R9: Damaged by the customer (SYNTHETIC)
If a returned item is missing parts or was damaged by the customer, up to 50% of the item price may be deducted from the refund.

Answer:
If the returned item is missing parts, up to 50% of the item price may be deducted from the refund.

Claims:
1. If the returned item is missing parts, up to 50% of the item price may be deducted from the refund. | material: y | verdict: 

missed:

## L31

Question: If I send back an unworn dress within 30 days, will I get a full refund to my card?

Sources:
[ns:NS-R1] Northstar NS-R1: Return window (SYNTHETIC)
Unworn, unwashed items can be returned within 30 days of delivery for a full refund.

[stripe:refunds.create] Create a refund
When you create a new refund, you must specify a Charge or a PaymentIntent object on which to create it.

Creating a new refund will refund a charge that has previously been created but not yet refunded.
Funds will be refunded to the credit or debit card that was originally charged.

You can optionally refund only part of a charge.
You can do so multiple times, until the entire charge has been refunded.

Once entirely refunded, a charge can’t be refunded again.
This method will raise an error when called on an already-refunded charge,
or when trying to refund more money than is left on a charge.

Answer:
Yes, if you return an unworn, unwashed dress within 30 days of delivery, you can get a full refund. The refund will be issued to the credit or debit card originally charged.

Claims:
1. If you return an unworn, unwashed dress within 30 days of delivery, you can get a full refund. | material: y | verdict: 
2. The refund will be issued to the credit or debit card originally charged. | material: y | verdict: 

missed:

## L32

Question: Hi, I'm Marcus from Brazil. Once Northstar issues my refund, how many days until it shows up on my card statement?

Sources:
[ns:NS-R4] Northstar NS-R4: Refund timing (SYNTHETIC)
Northstar issues the refund within 5 business days after the returned item arrives at the warehouse.

Answer:
Hi Marcus, I understand you're eager to see your refund. Northstar processes refunds within 5 business days after the returned item arrives at their warehouse. After that, the time it takes to appear on your card statement depends on your bank, which can vary. So, please allow a few additional days after Northstar issues the refund for it to show up on your statement.

Claims:
1. Northstar processes refunds within 5 business days after the returned item arrives at their warehouse. | material: y | verdict: 
2. After that, the time it takes to appear on your card statement depends on your bank, which can vary. | material: y | verdict: 
3. Please allow a few additional days after Northstar issues the refund for it to show up on your statement. | material: y | verdict: 

missed:

## L33

Question: Does Stripe enforce a one-year return policy for defective items?

Sources:
[stripe:refunds.create] Create a refund
When you create a new refund, you must specify a Charge or a PaymentIntent object on which to create it.

Creating a new refund will refund a charge that has previously been created but not yet refunded.
Funds will be refunded to the credit or debit card that was originally charged.

You can optionally refund only part of a charge.
You can do so multiple times, until the entire charge has been refunded.

Once entirely refunded, a charge can’t be refunded again.
This method will raise an error when called on an already-refunded charge,
or when trying to refund more money than is left on a charge.

[stripe:refunds.create.reason] Create a refund: reason
String indicating the reason for the refund. If set, possible values are `duplicate`, `fraudulent`, and `requested_by_customer`. If you believe the charge to be fraudulent, specifying `fraudulent` as the reason will add the associated card and email to your block lists, and will also help us improve our fraud detection algorithms.

Answer:
Stripe itself does not enforce any return or refund policies, including a one-year return policy for defective items. Such policies are typically set by the merchant or store. If you are dealing with a refund through Stripe, the merchant's own policy will apply. For specific return policies, please check with the merchant or store where you made your purchase.

Claims:
1. Stripe itself does not enforce any return or refund policies, including a one-year return policy for defective items. | material: y | verdict: 
2. Such policies are typically set by the merchant or store. | material: n | verdict: 
3. If you are dealing with a refund through Stripe, the merchant's own policy will apply. | material: y | verdict: 
4. For specific return policies, please check with the merchant or store where you made your purchase. | material: n | verdict: 

missed:

## L34

Question: Does Stripe guarantee that a refund is issued within 5 business days after a returned item reaches the warehouse?

Sources:
[stripe:refunds.create] Create a refund
When you create a new refund, you must specify a Charge or a PaymentIntent object on which to create it.

Creating a new refund will refund a charge that has previously been created but not yet refunded.
Funds will be refunded to the credit or debit card that was originally charged.

You can optionally refund only part of a charge.
You can do so multiple times, until the entire charge has been refunded.

Once entirely refunded, a charge can’t be refunded again.
This method will raise an error when called on an already-refunded charge,
or when trying to refund more money than is left on a charge.

[stripe:refunds.create.charge] Create a refund: charge
The identifier of the charge to refund.

Answer:
I understand your concern about refund timing. Stripe itself processes refunds by returning funds to the original payment method, but it doesn't guarantee a specific timeframe like 5 business days after a returned item arrives at a warehouse. Refund timing often depends on the merchant's own return and refund policies. For Northstar Outfitters, please check their store policy or contact their customer service to confirm their refund processing times after receiving returns.

Claims:
1. Stripe itself processes refunds by returning funds to the original payment method. | material: y | verdict: 
2. Stripe doesn't guarantee a specific timeframe like 5 business days after a returned item arrives at a warehouse. | material: y | verdict: 
3. Refund timing often depends on the merchant's own return and refund policies. | material: y | verdict: 
4. For Northstar Outfitters, please check their store policy or contact their customer service to confirm their refund processing times after receiving returns. | material: n | verdict: 

missed:

## L35

Question: Does Stripe guarantee that a refund is issued within 5 business days after a returned item reaches the warehouse?

Sources:
[stripe:refunds.create] Create a refund
When you create a new refund, you must specify a Charge or a PaymentIntent object on which to create it.

Creating a new refund will refund a charge that has previously been created but not yet refunded.
Funds will be refunded to the credit or debit card that was originally charged.

You can optionally refund only part of a charge.
You can do so multiple times, until the entire charge has been refunded.

Once entirely refunded, a charge can’t be refunded again.
This method will raise an error when called on an already-refunded charge,
or when trying to refund more money than is left on a charge.

[stripe:refunds.create.charge] Create a refund: charge
The identifier of the charge to refund.

Answer:
I understand your concern about refund timing. Stripe itself processes refunds by returning funds to the original payment method, but it doesn't guarantee a specific timeframe like 5 business days after a returned item arrives at a warehouse. Refund timing often depends on the merchant's own return and refund policies. For Northstar Outfitters, please check their store policy or contact their customer service to confirm their refund processing times after receiving returns.

Claims:
1. Stripe itself processes refunds by returning funds to the original payment method. | material: y | verdict: 
2. Stripe doesn't guarantee a specific timeframe like 5 business days after a returned item arrives at a warehouse. | material: y | verdict: 
3. Refund timing often depends on the merchant's own return and refund policies. | material: y | verdict: 
4. For Northstar Outfitters, please check their store policy or contact their customer service to confirm their refund processing times after receiving returns. | material: n | verdict: 

missed:

## L36

Question: How long does a customer have to file a chargeback on a Stripe payment?

Sources:
[stripe:refunds.create] Create a refund
When you create a new refund, you must specify a Charge or a PaymentIntent object on which to create it.

Creating a new refund will refund a charge that has previously been created but not yet refunded.
Funds will be refunded to the credit or debit card that was originally charged.

You can optionally refund only part of a charge.
You can do so multiple times, until the entire charge has been refunded.

Once entirely refunded, a charge can’t be refunded again.
This method will raise an error when called on an already-refunded charge,
or when trying to refund more money than is left on a charge.

[stripe:refunds.create.reason] Create a refund: reason
String indicating the reason for the refund. If set, possible values are `duplicate`, `fraudulent`, and `requested_by_customer`. If you believe the charge to be fraudulent, specifying `fraudulent` as the reason will add the associated card and email to your block lists, and will also help us improve our fraud detection algorithms.

Answer:
I understand your concern about chargebacks. The time frame for a customer to file a chargeback depends on their bank or card issuer's policies, not Stripe directly. Typically, customers have around 60 to 120 days from the transaction date to dispute a charge. If you receive a chargeback notification through Stripe, you can respond accordingly to protect your business.

Claims:
1. The time frame for a customer to file a chargeback depends on their bank or card issuer's policies, not Stripe directly. | material: y | verdict: 
2. Typically, customers have around 60 to 120 days from the transaction date to dispute a charge. | material: y | verdict: 
3. If you receive a chargeback notification through Stripe, you can respond accordingly to protect your business. | material: n | verdict: 

missed:

## L37

Question: I'm Yuki, 22. Once Northstar issues my refund, how many days until it shows up on my card statement?

Sources:
[ns:NS-R4] Northstar NS-R4: Refund timing (SYNTHETIC)
Northstar issues the refund within 5 business days after the returned item arrives at the warehouse.

Answer:
Hi Yuki! I understand you're eager to see your refund reflected on your card. Northstar processes refunds within 5 business days after receiving the returned item at their warehouse. After that, it typically depends on your bank's processing time, which can vary. So, once Northstar issues the refund, please allow a few additional days for it to appear on your card statement. If you have any more questions, feel free to ask!

Claims:
1. Northstar processes refunds within 5 business days after receiving the returned item at their warehouse. | material: y | verdict: 
2. After that, it typically depends on your bank's processing time, which can vary. | material: n | verdict: 
3. Once Northstar issues the refund, please allow a few additional days for it to appear on your card statement. | material: y | verdict: 

missed:

## L38

Question: Why would a refund be pending, and where do I see that reason?

Sources:
[stripe:refund.pending_reason] Refund object: pending_reason
Provides the reason for why the refund is pending. Possible values are: `processing`, `insufficient_funds`, or `charge_pending`.

Answer:
A refund can be pending for reasons such as processing, insufficient funds, or charge pending. You can see the reason for a refund being pending in the refund object's 'pending_reason' field in the Stripe API.

Claims:
1. A refund can be pending for reasons such as processing, insufficient funds, or charge pending. | material: y | verdict: 
2. You can see the reason for a refund being pending in the refund object's 'pending_reason' field in the Stripe API. | material: y | verdict: 

missed:

## L39

Question: Where can I see how much of a charge has been refunded so far?

Sources:
[stripe:charge.amount_refunded] Charge object: amount_refunded
Amount in cents (or local equivalent) refunded (can be less than the amount attribute on the charge if a partial refund was issued).

Answer:
You can see how much of a charge has been refunded so far in the Charge object's amount_refunded attribute, which shows the amount in cents (or local equivalent) refunded, including partial refunds.

Claims:
1. You can see how much of a charge has been refunded so far in the Charge object's amount_refunded attribute. | material: y | verdict: 
2. The amount_refunded attribute shows the amount in cents (or local equivalent) refunded, including partial refunds. | material: y | verdict: 

missed:

## L40

Question: Does Stripe enforce a one-year return policy for defective items?

Sources:
[stripe:refunds.create] Create a refund
When you create a new refund, you must specify a Charge or a PaymentIntent object on which to create it.

Creating a new refund will refund a charge that has previously been created but not yet refunded.
Funds will be refunded to the credit or debit card that was originally charged.

You can optionally refund only part of a charge.
You can do so multiple times, until the entire charge has been refunded.

Once entirely refunded, a charge can’t be refunded again.
This method will raise an error when called on an already-refunded charge,
or when trying to refund more money than is left on a charge.

[stripe:refunds.create.reason] Create a refund: reason
String indicating the reason for the refund. If set, possible values are `duplicate`, `fraudulent`, and `requested_by_customer`. If you believe the charge to be fraudulent, specifying `fraudulent` as the reason will add the associated card and email to your block lists, and will also help us improve our fraud detection algorithms.

Answer:
Stripe does not enforce any return or refund policies such as a one-year return policy for defective items. Stripe is a payment processing platform that allows merchants to create refunds for charges, but the specific return policies are set by the individual merchants or stores. For questions about return policies, you should check directly with the merchant or store where you made your purchase.

Claims:
1. Stripe does not enforce any return or refund policies such as a one-year return policy for defective items. | material: y | verdict: 
2. Stripe is a payment processing platform that allows merchants to create refunds for charges. | material: y | verdict: 
3. The specific return policies are set by the individual merchants or stores. | material: y | verdict: 
4. For questions about return policies, you should check directly with the merchant or store where you made your purchase. | material: n | verdict: 

missed:
