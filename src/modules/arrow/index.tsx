import * as React from "react";

export type PopoverArrowProps = {
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
};

export const PopoverArrow = React.forwardRef<SVGSVGElement, PopoverArrowProps>(
  function PopoverArrow(props, ref) {
    const { width = 10, height = 5, className, style } = props;
    return (
      <svg
        ref={ref}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        data-df-popover-arrow=""
        className={className}
        style={style}
        aria-hidden="true"
      >
        <polygon points={`0,0 ${width},0 ${width / 2},${height}`} />
      </svg>
    );
  },
);
