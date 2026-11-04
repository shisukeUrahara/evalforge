# Label sheet

For each claim, fill `verdict:` with s (supported), u (unsupported) or ? (uncertain), using only the Sources shown.
Change `material: y` to `n` if the claim is not something a customer could act on (greetings, empathy, 'contact support').
Under `missed:` add any material claim the list forgot, one per line, as `- u: text` or `- s: text`.
Rules: docs/labeling_guide.md. Save the file, then run: pnpm ef apply-labels --sheet <this file>

## L01

Question: If a customer returns something after 30 days, will Stripe block the refund?

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
Stripe does not block refunds based on the time elapsed since purchase. Refunds can be created for charges that have not yet been refunded, regardless of the time passed. The refund will be issued to the original payment method. However, Stripe does not enforce store-specific return policies such as time limits for returns.

Claims:
1. Stripe does not block refunds based on the time elapsed since purchase. | material: y | verdict: 
2. Refunds can be created for charges that have not yet been refunded, regardless of the time passed. | material: y | verdict: 
3. The refund will be issued to the original payment method. | material: y | verdict: 
4. Stripe does not enforce store-specific return policies such as time limits for returns. | material: y | verdict: 

missed:

## L02

Question: I ordered a final sale item by mistake. Can I still return it?

Sources:
[ns:NS-R6] Northstar NS-R6: Final sale (SYNTHETIC)
Items marked "final sale" cannot be returned or refunded.

Answer:
Items marked as "final sale" cannot be returned or refunded according to Northstar Outfitters' policy.

Claims:
1. Items marked as 'final sale' cannot be returned or refunded according to Northstar Outfitters' policy. | material: y | verdict: 

missed:

## L03

Question: Does Stripe automatically refund the application fee for returns initiated by the customer?

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
Stripe does not automatically refund the application fee when a customer initiates a return. Refunds must be created explicitly on the original charge or payment intent, and you can choose to refund the full or partial amount. However, application fees are not refunded automatically and require separate handling if you wish to refund them.

Claims:
1. Stripe does not automatically refund the application fee when a customer initiates a return. | material: y | verdict: 
2. Refunds must be created explicitly on the original charge or payment intent, and you can choose to refund the full or partial amount. | material: y | verdict: 
3. Application fees are not refunded automatically and require separate handling if you wish to refund them. | material: y | verdict: 

missed:

## L04

Question: Can Stripe refund a customer in a different currency than the one they paid in?

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
Stripe refunds must be made to the credit or debit card originally charged, and the refund is for the charge that was previously created. The sources do not specify the ability to refund in a different currency than the original payment.

Claims:
1. Stripe refunds must be made to the credit or debit card originally charged. | material: y | verdict: 
2. The refund is for the charge that was previously created. | material: y | verdict: 
3. The sources do not specify the ability to refund in a different currency than the original payment. | material: y | verdict: 

missed:

## L05

Question: Can Stripe refund a customer in a different currency than the one they paid in?

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
Stripe refunds must be issued in the same currency as the original payment. When you create a refund, it will return funds to the customer's card in the currency they were charged. Partial refunds are possible, but the currency cannot be changed during the refund process.

Claims:
1. Stripe refunds must be issued in the same currency as the original payment. | material: y | verdict: 
2. When you create a refund, it will return funds to the customer's card in the currency they were charged. | material: y | verdict: 
3. Partial refunds are possible. | material: y | verdict: 
4. The currency cannot be changed during the refund process. | material: y | verdict: 

missed:

## L06

Question: Can I refund the application fee when processing a refund?

Sources:
[stripe:refunds.create.refund_application_fee] Create a refund: refund_application_fee
Boolean indicating whether the application fee should be refunded when refunding this charge. If a full charge refund is given, the full application fee will be refunded. Otherwise, the application fee will be refunded in an amount proportional to the amount of the charge refunded. An application fee can be refunded only by the application that created the charge.

Answer:
Yes, when creating a refund for a charge, you can specify whether the application fee should be refunded. If the full charge is refunded, the full application fee will be refunded; otherwise, the refund amount of the application fee will be proportional to the refunded charge amount. Note that only the application that created the charge can refund the application fee.

Claims:
1. When creating a refund for a charge, you can specify whether the application fee should be refunded. | material: y | verdict: 
2. If the full charge is refunded, the full application fee will be refunded. | material: y | verdict: 
3. If the charge is partially refunded, the refund amount of the application fee will be proportional to the refunded charge amount. | material: y | verdict: 
4. Only the application that created the charge can refund the application fee. | material: y | verdict: 

missed:

## L07

Question: I'm returning a jacket with a factory defect in the zipper. Will the $7 return label fee be taken out of my refund?

Sources:
[ns:NS-R5] Northstar NS-R5: Return shipping (SYNTHETIC)
Return shipping is free for defective items. For all other returns, a $7 return label fee is deducted from the refund.

Answer:
I'm sorry to hear about the defect in your jacket's zipper. Since the item is defective, you won't be charged the $7 return label fee; return shipping is free for defective items. You can proceed with your return without worrying about that fee.

Claims:
1. Since the item is defective, you won't be charged the $7 return label fee. | material: y | verdict: 
2. Return shipping is free for defective items. | material: y | verdict: 

missed:

## L08

Question: My name is Kevin. Can you resend my refund receipt to a different email address?

Sources:
[stripe:refund.receipt_number] Refund object: receipt_number
This is the transaction number that appears on email receipts sent for this refund.

Answer:
Hi Kevin, I understand you'd like to have your refund receipt sent to a different email address. While I can't resend receipts directly, you can check the refund's receipt number on your original email receipt and contact Northstar Outfitters' support or Stripe support with that number to request a resend to your preferred email. This will help them locate your refund transaction quickly.

Claims:
1. I can't resend receipts directly. | material: n | verdict: 
2. You can check the refund's receipt number on your original email receipt. | material: y | verdict: 
3. You can contact Northstar Outfitters' support or Stripe support with that number to request a resend to your preferred email. | material: y | verdict: 
4. Providing the receipt number will help them locate your refund transaction quickly. | material: n | verdict: 

missed:

## L09

Question: How many days do I have to return an item for a refund if my store uses Stripe?

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
The Stripe sources do not specify any time limit for returning an item for a refund. Stripe's API allows creating refunds on charges that have been made, but it does not set any policy on how many days you have to return an item.

Claims:
1. The Stripe sources do not specify any time limit for returning an item for a refund. | material: y | verdict: 
2. Stripe's API allows creating refunds on charges that have been made, but it does not set any policy on how many days you have to return an item. | material: y | verdict: 

missed:

## L10

Question: I bought a backpack and now it’s $20 cheaper a week later. Will you refund the price difference?

Sources:
[ns:NS-R12] Northstar NS-R12: Price drops (SYNTHETIC)
If an item's price drops within 14 days of purchase, Northstar refunds the difference once per item.

Answer:
I'm sorry to hear about the price drop after your purchase. Northstar Outfitters does refund the price difference if an item's price drops within 14 days of purchase, once per item. Since your backpack's price dropped within a week, you should be eligible for a $20 refund difference. Please contact Northstar's customer service with your order details to request this refund.

Claims:
1. Northstar Outfitters does refund the price difference if an item's price drops within 14 days of purchase, once per item. | material: y | verdict: 
2. Since your backpack's price dropped within a week, you should be eligible for a $20 refund difference. | material: y | verdict: 

missed:

## L11

Question: Does Stripe guarantee a full refund with no fee when an order is cancelled before it ships?

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
The provided sources do not specify whether Stripe guarantees a full refund with no fee when an order is cancelled before it ships.

Claims:
1. The provided sources do not specify whether Stripe guarantees a full refund with no fee when an order is cancelled before it ships. | material: y | verdict: 

missed:

## L12

Question: Is it possible to update an existing refund? What can I change?

Sources:
[stripe:refunds.update] Update a refund
Updates the refund that you specify by setting the values of the passed parameters. Any parameters that you don’t provide remain unchanged.

This request only accepts metadata as an argument.

Answer:
Yes, it is possible to update an existing refund. You can only update the metadata of the refund; other parameters remain unchanged.

Claims:
1. It is possible to update an existing refund. | material: y | verdict: 
2. You can only update the metadata of the refund; other parameters remain unchanged. | material: y | verdict: 

missed:

## L13

Question: Is there a way to set a maximum refund amount per customer directly in Stripe?

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

[stripe:refunds.create.customer] Create a refund: customer
Customer whose customer balance to refund from.

Answer:
I understand wanting to manage refunds carefully. Stripe itself doesn't provide a built-in feature to set a maximum refund amount per customer automatically. Refunds can be created for any amount up to the original charge, and you can issue partial refunds multiple times until fully refunded. To enforce maximum refund limits per customer, you'd typically implement this logic in your own system before calling Stripe's refund API.

Claims:
1. Stripe itself doesn't provide a built-in feature to set a maximum refund amount per customer automatically. | material: y | verdict: 
2. Refunds can be created for any amount up to the original charge. | material: y | verdict: 
3. You can issue partial refunds multiple times until fully refunded. | material: y | verdict: 
4. To enforce maximum refund limits per customer, you'd typically implement this logic in your own system before calling Stripe's refund API. | material: y | verdict: 

missed:

## L14

Question: Hey, this is Fatima, a loyal customer. Can you resend my refund receipt to a different email address?

Sources:
[stripe:refund.receipt_number] Refund object: receipt_number
This is the transaction number that appears on email receipts sent for this refund.

Answer:
Hi Fatima! I understand you'd like to have your refund receipt sent to a different email address. While I can't resend receipts directly, you can check your refund receipt email for the transaction number (receipt_number) to reference it. For assistance with resending the receipt to another email, please contact Northstar Outfitters' customer support directly—they can help update your email and resend the receipt.

Claims:
1. I can't resend receipts directly. | material: n | verdict: 
2. You can check your refund receipt email for the transaction number (receipt_number) to reference it. | material: y | verdict: 
3. For assistance with resending the receipt to another email, please contact Northstar Outfitters' customer support directly—they can help update your email and resend the receipt. | material: y | verdict: 

missed:

## L15

Question: Hey, I'm Greg (long-time buyer). Can I get a refund for an item marked as final sale?

Sources:
[ns:NS-R6] Northstar NS-R6: Final sale (SYNTHETIC)
Items marked "final sale" cannot be returned or refunded.

Answer:
Items marked as "final sale" cannot be returned or refunded according to Northstar Outfitters' policy.

Claims:
1. Items marked as 'final sale' cannot be returned or refunded according to Northstar Outfitters' policy. | material: y | verdict: 

missed:

## L16

Question: My boots have a defect but I bought them 6 months ago. Can I still get a refund or replacement?

Sources:
[ns:NS-R3] Northstar NS-R3: Defective items (SYNTHETIC)
Items with a manufacturing defect can be returned within 1 year of delivery for a replacement or a full refund, at the customer's choice.

Answer:
Yes, you can return your boots within 1 year of delivery for a replacement or a full refund due to the manufacturing defect, as per Northstar's policy.

Claims:
1. You can return your boots within 1 year of delivery for a replacement or a full refund due to the manufacturing defect, as per Northstar's policy. | material: y | verdict: 

missed:

## L17

Question: How do I reverse a transfer when I refund a charge?

Sources:
[stripe:refunds.create.reverse_transfer] Create a refund: reverse_transfer
Boolean indicating whether the transfer should be reversed when refunding this charge. The transfer will be reversed proportionally to the amount being refunded (either the entire or partial amount).A transfer can be reversed only by the application that created the charge.

Answer:
To reverse a transfer when refunding a charge, you can set the parameter 'reverse_transfer' to true when creating the refund. This will reverse the transfer proportionally to the refunded amount. Note that only the application that created the charge can reverse the transfer.

Claims:
1. To reverse a transfer when refunding a charge, you can set the parameter 'reverse_transfer' to true when creating the refund. | material: y | verdict: 
2. This will reverse the transfer proportionally to the refunded amount. | material: y | verdict: 
3. Only the application that created the charge can reverse the transfer. | material: y | verdict: 

missed:

## L18

Question: Is there a way to see why a refund was issued?

Sources:
[stripe:refund.reason] Refund object: reason
Reason for the refund, which is either user-provided (`duplicate`, `fraudulent`, or `requested_by_customer`) or generated by Stripe internally (`expired_uncaptured_charge`).

Answer:
Yes, the reason for a refund can be seen in the refund object, which includes a reason field. This reason can be user-provided such as 'duplicate', 'fraudulent', or 'requested_by_customer', or it can be generated internally by Stripe, such as 'expired_uncaptured_charge'.

Claims:
1. The reason for a refund can be seen in the refund object, which includes a reason field. | material: y | verdict: 
2. This reason can be user-provided such as 'duplicate', 'fraudulent', or 'requested_by_customer'. | material: y | verdict: 
3. The reason can be generated internally by Stripe, such as 'expired_uncaptured_charge'. | material: y | verdict: 

missed:

## L19

Question: Does Stripe guarantee a full refund with no fee when an order is cancelled before it ships?

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
I understand your concern about refunds and fees. Stripe itself processes refunds by returning funds to the original payment method, but whether a full refund with no fee is guaranteed depends on the merchant's policy. For Northstar Outfitters, you can request a refund if your order is canceled before shipping. To proceed, please contact the merchant directly to confirm their refund and fee policy. Stripe allows partial or full refunds on charges that haven't been refunded yet, but fees may vary by merchant.

Claims:
1. Stripe itself processes refunds by returning funds to the original payment method. | material: y | verdict: 
2. Whether a full refund with no fee is guaranteed depends on the merchant's policy. | material: y | verdict: 
3. For Northstar Outfitters, you can request a refund if your order is canceled before shipping. | material: y | verdict: 
4. To proceed, please contact the merchant directly to confirm their refund and fee policy. | material: n | verdict: 
5. Stripe allows partial or full refunds on charges that haven't been refunded yet. | material: y | verdict: 
6. Fees may vary by merchant. | material: y | verdict: 

missed:

## L20

Question: If a customer returns something after 30 days, will Stripe block the refund?

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
Stripe itself does not block refunds based on the time since purchase; refunds can be issued as long as the charge exists and hasn't been fully refunded yet. However, Northstar Outfitters' store policy may have a 30-day return window, so refunds after 30 days might not be accepted by the merchant. If you want to proceed with a refund, you can create one on the original charge via Stripe's API. It's best to check Northstar's return policy or contact their support for guidance on returns beyond 30 days.

Claims:
1. Stripe itself does not block refunds based on the time since purchase; refunds can be issued as long as the charge exists and hasn't been fully refunded yet. | material: y | verdict: 
2. Northstar Outfitters' store policy may have a 30-day return window, so refunds after 30 days might not be accepted by the merchant. | material: y | verdict: 
3. If you want to proceed with a refund, you can create one on the original charge via Stripe's API. | material: y | verdict: 
4. It's best to check Northstar's return policy or contact their support for guidance on returns beyond 30 days. | material: n | verdict: 

missed:
