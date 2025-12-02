-- Fix RLS policies: Change from 'public' role to 'authenticated' role for defense in depth

-- analytical_allocations
DROP POLICY IF EXISTS "Authenticated users can view analytical allocations" ON analytical_allocations;
CREATE POLICY "Authenticated users can view analytical allocations" ON analytical_allocations FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- asset_categories
DROP POLICY IF EXISTS "Authenticated users can view asset categories" ON asset_categories;
CREATE POLICY "Authenticated users can view asset categories" ON asset_categories FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- asset_depreciations
DROP POLICY IF EXISTS "Authenticated users can view asset depreciations" ON asset_depreciations;
CREATE POLICY "Authenticated users can view asset depreciations" ON asset_depreciations FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- asset_disposals
DROP POLICY IF EXISTS "Authenticated users can view asset disposals" ON asset_disposals;
CREATE POLICY "Authenticated users can view asset disposals" ON asset_disposals FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- asset_movements
DROP POLICY IF EXISTS "Authenticated users can view asset movements" ON asset_movements;
CREATE POLICY "Authenticated users can view asset movements" ON asset_movements FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- asset_reconciliations
DROP POLICY IF EXISTS "Authenticated users can view asset reconciliations" ON asset_reconciliations;
CREATE POLICY "Authenticated users can view asset reconciliations" ON asset_reconciliations FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- assets
DROP POLICY IF EXISTS "Authenticated users can view assets" ON assets;
CREATE POLICY "Authenticated users can view assets" ON assets FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- bailleurs
DROP POLICY IF EXISTS "Authenticated users can view bailleurs" ON bailleurs;
CREATE POLICY "Authenticated users can view bailleurs" ON bailleurs FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- budget_alerts
DROP POLICY IF EXISTS "Authenticated users can view budget alerts" ON budget_alerts;
CREATE POLICY "Authenticated users can view budget alerts" ON budget_alerts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- budget_lines
DROP POLICY IF EXISTS "Authenticated users can view budget lines" ON budget_lines;
CREATE POLICY "Authenticated users can view budget lines" ON budget_lines FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- budget_movements
DROP POLICY IF EXISTS "Authenticated users can view budget movements" ON budget_movements;
CREATE POLICY "Authenticated users can view budget movements" ON budget_movements FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- budgets
DROP POLICY IF EXISTS "Authenticated users can view budgets" ON budgets;
CREATE POLICY "Authenticated users can view budgets" ON budgets FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- contract_decomptes
DROP POLICY IF EXISTS "Authenticated users can view decomptes" ON contract_decomptes;
CREATE POLICY "Authenticated users can view decomptes" ON contract_decomptes FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- contract_engagements
DROP POLICY IF EXISTS "Authenticated users can view engagements" ON contract_engagements;
CREATE POLICY "Authenticated users can view engagements" ON contract_engagements FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- contract_guarantees
DROP POLICY IF EXISTS "Authenticated users can view guarantees" ON contract_guarantees;
CREATE POLICY "Authenticated users can view guarantees" ON contract_guarantees FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- contract_payments
DROP POLICY IF EXISTS "Authenticated users can view contract payments" ON contract_payments;
CREATE POLICY "Authenticated users can view contract payments" ON contract_payments FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- contracts
DROP POLICY IF EXISTS "Authenticated users can view contracts" ON contracts;
CREATE POLICY "Authenticated users can view contracts" ON contracts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- convention_categories
DROP POLICY IF EXISTS "Authenticated users can view convention categories" ON convention_categories;
CREATE POLICY "Authenticated users can view convention categories" ON convention_categories FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- conventions
DROP POLICY IF EXISTS "Authenticated users can view conventions" ON conventions;
CREATE POLICY "Authenticated users can view conventions" ON conventions FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- cost_centers
DROP POLICY IF EXISTS "Authenticated users can view cost centers" ON cost_centers;
CREATE POLICY "Authenticated users can view cost centers" ON cost_centers FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- countries
DROP POLICY IF EXISTS "Authenticated users can view countries" ON countries;
CREATE POLICY "Authenticated users can view countries" ON countries FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- currencies
DROP POLICY IF EXISTS "Authenticated users can view currencies" ON currencies;
CREATE POLICY "Authenticated users can view currencies" ON currencies FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- direct_payments
DROP POLICY IF EXISTS "Authenticated users can view direct payments" ON direct_payments;
CREATE POLICY "Authenticated users can view direct payments" ON direct_payments FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- distribution_rule_lines
DROP POLICY IF EXISTS "Authenticated users can view distribution rule lines" ON distribution_rule_lines;
CREATE POLICY "Authenticated users can view distribution rule lines" ON distribution_rule_lines FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- distribution_rules
DROP POLICY IF EXISTS "Authenticated users can view distribution rules" ON distribution_rules;
CREATE POLICY "Authenticated users can view distribution rules" ON distribution_rules FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- expense_categories
DROP POLICY IF EXISTS "Authenticated users can view expense categories" ON expense_categories;
CREATE POLICY "Authenticated users can view expense categories" ON expense_categories FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- financial_report_lines
DROP POLICY IF EXISTS "Authenticated users can view financial report lines" ON financial_report_lines;
CREATE POLICY "Authenticated users can view financial report lines" ON financial_report_lines FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- financial_reports
DROP POLICY IF EXISTS "Authenticated users can view financial reports" ON financial_reports;
CREATE POLICY "Authenticated users can view financial reports" ON financial_reports FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- fiscal_years
DROP POLICY IF EXISTS "Authenticated users can view fiscal years" ON fiscal_years;
CREATE POLICY "Authenticated users can view fiscal years" ON fiscal_years FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- journal_entries
DROP POLICY IF EXISTS "Authenticated users can view journal entries" ON journal_entries;
CREATE POLICY "Authenticated users can view journal entries" ON journal_entries FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- journal_entry_lines
DROP POLICY IF EXISTS "Authenticated users can view journal entry lines" ON journal_entry_lines;
CREATE POLICY "Authenticated users can view journal entry lines" ON journal_entry_lines FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- journals
DROP POLICY IF EXISTS "Authenticated users can view journals" ON journals;
CREATE POLICY "Authenticated users can view journals" ON journals FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- locations
DROP POLICY IF EXISTS "Authenticated users can view locations" ON locations;
CREATE POLICY "Authenticated users can view locations" ON locations FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- organization_settings
DROP POLICY IF EXISTS "Authenticated users can view organization settings" ON organization_settings;
CREATE POLICY "Authenticated users can view organization settings" ON organization_settings FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- plan_accounts
DROP POLICY IF EXISTS "Authenticated users can view plan accounts" ON plan_accounts;
CREATE POLICY "Authenticated users can view plan accounts" ON plan_accounts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- replenishments
DROP POLICY IF EXISTS "Authenticated users can view replenishments" ON replenishments;
CREATE POLICY "Authenticated users can view replenishments" ON replenishments FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- sites
DROP POLICY IF EXISTS "Authenticated users can view sites" ON sites;
CREATE POLICY "Authenticated users can view sites" ON sites FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- third_parties
DROP POLICY IF EXISTS "Authenticated users can view third parties" ON third_parties;
CREATE POLICY "Authenticated users can view third parties" ON third_parties FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- tracking_axes
DROP POLICY IF EXISTS "Authenticated users can view tracking axes" ON tracking_axes;
CREATE POLICY "Authenticated users can view tracking axes" ON tracking_axes FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- work_units
DROP POLICY IF EXISTS "Authenticated users can view work units" ON work_units;
CREATE POLICY "Authenticated users can view work units" ON work_units FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);