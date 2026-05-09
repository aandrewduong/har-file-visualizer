import { useDragX } from "../hooks/useDragX";
import { LAYOUT } from "../lib/layout";

interface Props {
  onDrag: (clientX: number) => void;
  ariaLabel: string;
}

export function Splitter({ onDrag, ariaLabel }: Props) {
  const { isDragging, startDrag } = useDragX(onDrag);
  const tone = isDragging ? "bg-accent" : "bg-border hover:bg-accent";
  const { splitterBarWidthPx, splitterHitExtraPx } = LAYOUT.resize;

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={ariaLabel}
      onMouseDown={startDrag}
      style={{ width: `${splitterBarWidthPx}px` }}
      className={`relative shrink-0 cursor-col-resize transition-colors ${tone}`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0"
        style={{
          left: `-${splitterHitExtraPx}px`,
          right: `-${splitterHitExtraPx}px`,
        }}
      />
    </div>
  );
}
