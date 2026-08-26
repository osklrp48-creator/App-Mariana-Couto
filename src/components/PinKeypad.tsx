interface PinKeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
}

export function PinKeypad({ onDigit, onBackspace }: PinKeypadProps) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];
  return (
    <div className="pin-keypad">
      {keys.map((k, i) => {
        if (k === "") return <div key={i} />;
        if (k === "back") {
          return (
            <button key={i} className="pin-key ghost" onClick={onBackspace} aria-label="Apagar">
              ⌫
            </button>
          );
        }
        return (
          <button key={i} className="pin-key" onClick={() => onDigit(k)}>
            {k}
          </button>
        );
      })}
    </div>
  );
}
