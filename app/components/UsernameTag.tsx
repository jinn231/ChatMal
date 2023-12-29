import { Link } from "@remix-run/react";
import React from "react";

export default function UsernameTag({
  id,
  name
}: {
  id: string;
  name: string;
}): React.JSX.Element {
  return (
    <Link to={`/users/${id}`}>
      <p className="underline">{name}</p>
    </Link>
  );
}
