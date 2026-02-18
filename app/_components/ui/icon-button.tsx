import * as React from "react";
import { Button, ButtonProps } from "./button";

export function IconButton(props: ButtonProps) {
  return <Button size="icon" variant="outline" {...props} />;
}
