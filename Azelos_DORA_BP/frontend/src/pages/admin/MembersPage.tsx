import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { inviteMember } from "../../api/dora";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

export function MembersPage({ embedded = false }: { embedded?: boolean }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("USER");
  const [lastToken, setLastToken] = useState<string | null>(null);
  const inviteM = useMutation({
    mutationFn: () => inviteMember(email, role),
    onSuccess: (data) => setLastToken(data.invite_token),
  });

  return (
    <div>
      {embedded ? (
        <p className="mb-4 text-sm text-gray-600">
          Manage who can access this tenant and their RBAC role. Invitations are organization-scoped.
        </p>
      ) : (
        <PageHeader title="Team members" subtitle="Invite colleagues to this organization." />
      )}
      <Card title="Send invitation">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            inviteM.mutate();
          }}
        >
          <input
            type="email"
            required
            className="rounded border px-2 py-1"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select className="rounded border px-2 py-1" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="USER">User</option>
            <option value="RISK_MANAGER">Risk manager</option>
            <option value="SECURITY_MANAGER">Security manager</option>
            <option value="ORG_ADMIN">Org admin</option>
          </select>
          <Button type="submit" disabled={inviteM.isPending}>
            Invite
          </Button>
        </form>
        {inviteM.error ? <p className="mt-2 text-sm text-red-600">{(inviteM.error as Error).message}</p> : null}
        {lastToken ? (
          <p className="mt-3 text-sm text-gray-700">
            Send this link to your colleague:{" "}
            <a
              className="break-all font-mono text-primary underline"
              href={`/accept-invite?token=${encodeURIComponent(lastToken)}`}
            >
              Accept invitation
            </a>
            <span className="mt-2 block break-all text-xs text-gray-500">Token: {lastToken}</span>
          </p>
        ) : null}
      </Card>
    </div>
  );
}
