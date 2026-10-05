ALTER TABLE "DebtAccount"
  ADD CONSTRAINT "DebtAccount_originalAmount_positive_check" CHECK ("originalAmount" > 0),
  ADD CONSTRAINT "DebtAccount_balance_range_check" CHECK ("balance" >= 0 AND "balance" <= "originalAmount");

ALTER TABLE "DebtEntry"
  ADD CONSTRAINT "DebtEntry_amount_positive_check" CHECK ("amount" > 0);
