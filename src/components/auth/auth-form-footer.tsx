interface Props {
  label?: string;
  buttonLabel: string;
  buttonAction: () => void;
}

export function AuthFormFooter({ label, buttonLabel, buttonAction }: Props) {
  return (
    <p className="text-center text-sm font-medium text-secondary-4">
      {label && <>{label} </>}

      <button
        type="button"
        className="rounded border border-transparent text-primary-1 outline-none hover:text-primary-2 focus:border-white"
        onClick={buttonAction}
      >
        {buttonLabel}
      </button>
    </p>
  );
}
