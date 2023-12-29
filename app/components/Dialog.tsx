import type { ComponentPropsWithoutRef, ForwardedRef } from "react";
import React, { forwardRef, useEffect, useRef } from "react";

function Dialog(
  prop: ComponentPropsWithoutRef<"dialog">,
  ref: ForwardedRef<HTMLDialogElement>
): React.JSX.Element {
  const { children, ...dilaogProps } = prop;
  const mouseStartX = useRef(0);
  const mouseStartY = useRef(0);
  const hasDragged = useRef(false);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      mouseStartX.current = event.pageX;
      mouseStartY.current = event.pageY;
    };
    const handleMouseUp = (event: MouseEvent) => {
      const delX = Math.abs(event.pageX - mouseStartX.current);
      const delY = Math.abs(event.pageY - mouseStartY.current);
      hasDragged.current = delX > 5 || delY > 5;
    };
    const onClickOutside = (event: MouseEvent) => {
      if (
        event.target instanceof HTMLDialogElement &&
        typeof ref === "object" &&
        !hasDragged.current
      ) {
        ref?.current?.close();
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("click", onClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("click", onClickOutside);
    };
  }, []);

  return (
    <dialog ref={ref} {...dilaogProps}>
      {children}
    </dialog>
  );
}

export default forwardRef(Dialog);
