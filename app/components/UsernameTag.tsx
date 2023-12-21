import { Link } from "@remix-run/react";

export default function UsernameTag({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  return (
    <Link to={`/users/${id}`}>
      <p className="underline">{name}</p>
    </Link>
  );
}
