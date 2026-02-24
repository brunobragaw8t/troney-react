import { useBalanceVisibility } from "../../../contexts/balance-visibility-context";
import { currency } from "../../../lib/utils";

interface CurrencyProps {
  value: number;
}

export function Currency({ value }: CurrencyProps) {
  const { isHidden } = useBalanceVisibility();

  if (isHidden) {
    return <span>€••••••</span>;
  }

  return <span>{currency(value / 100)}</span>;
}
