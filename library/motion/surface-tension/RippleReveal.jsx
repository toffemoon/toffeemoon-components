import { forwardRef } from "react";

// Visible ripple rings only. The reveal (alpha mask) is driven separately on the
// preloader root via --reveal-radius, so rings never act as a mask.
export const RippleReveal = forwardRef(function RippleReveal(_props, ref) {
  return (
    <div className="ripple-reveal" ref={ref} aria-hidden="true">
      <span className="ripple-reveal__surface" />
      <span className="ripple-reveal__line ripple-reveal__line--primary" />
      <span className="ripple-reveal__line ripple-reveal__line--secondary" />
      <span className="ripple-reveal__line ripple-reveal__line--tertiary" />
      <span className="ripple-reveal__impact" />
    </div>
  );
});
