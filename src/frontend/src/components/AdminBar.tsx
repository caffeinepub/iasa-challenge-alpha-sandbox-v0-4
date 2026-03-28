import {
  Ban,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Shield,
  X,
} from "lucide-react";
import { useState } from "react";
import { ApprovalStatus } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useListApprovals, useSetApproval } from "../hooks/useQueries";

export function AdminBar() {
  const [expanded, setExpanded] = useState(true);
  const { data: approvals, isLoading } = useListApprovals();
  const setApproval = useSetApproval();
  const { identity } = useInternetIdentity();

  const myPrincipal = identity?.getPrincipal().toString();

  const pendingUsers =
    approvals?.filter((u) => u.status === ApprovalStatus.pending) ?? [];
  const approvedUsers =
    approvals?.filter(
      (u) =>
        u.status === ApprovalStatus.approved &&
        u.principal.toString() !== myPrincipal,
    ) ?? [];
  const blockedUsers =
    approvals?.filter((u) => u.status === ApprovalStatus.rejected) ?? [];

  const truncate = (p: string) => `${p.slice(0, 8)}…${p.slice(-4)}`;

  return (
    <div className="admin-bar w-full z-50" data-ocid="admin.panel">
      <div className="max-w-7xl mx-auto px-4">
        <button
          type="button"
          className="flex items-center gap-2 py-2.5 w-full text-left"
          onClick={() => setExpanded((v) => !v)}
          data-ocid="admin.toggle"
        >
          <Shield
            className="w-3.5 h-3.5"
            style={{ color: "oklch(0.45 0.10 210)" }}
          />
          <span
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: "oklch(0.45 0.10 210)" }}
          >
            Admin Panel
          </span>
          {pendingUsers.length > 0 && (
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-black text-black"
              style={{ background: "oklch(0.72 0.19 145)" }}
            >
              {pendingUsers.length}
            </span>
          )}
          <span
            className="ml-auto"
            style={{ color: "oklch(0.77 0.015 240 / 0.5)" }}
          >
            {expanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </span>
        </button>

        {expanded && (
          <div className="pb-3 space-y-3">
            {isLoading ? (
              <div
                className="flex items-center gap-2 text-xs"
                style={{ color: "oklch(0.77 0.015 240 / 0.6)" }}
                data-ocid="admin.loading_state"
              >
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading users...
              </div>
            ) : (
              <>
                {pendingUsers.length > 0 && (
                  <div>
                    <p
                      className="text-[9px] uppercase tracking-[0.2em] mb-2"
                      style={{ color: "oklch(0.77 0.015 240 / 0.5)" }}
                    >
                      Pending ({pendingUsers.length})
                    </p>
                    <div
                      className="flex flex-wrap gap-2"
                      data-ocid="admin.pending.list"
                    >
                      {pendingUsers.map((user, i) => (
                        <div
                          key={user.principal.toString()}
                          className="flex items-center gap-2 rounded px-3 py-1.5"
                          style={{
                            background: "oklch(0.14 0.013 245)",
                            border: "1px solid oklch(0.24 0.018 245)",
                          }}
                          data-ocid={`admin.pending.item.${i + 1}`}
                        >
                          <span
                            className="font-mono text-[11px]"
                            style={{ color: "oklch(0.77 0.015 240 / 0.8)" }}
                          >
                            {truncate(user.principal.toString())}
                          </span>
                          <button
                            type="button"
                            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-colors disabled:opacity-40"
                            style={{
                              border: "1px solid oklch(0.72 0.19 145 / 0.5)",
                              color: "oklch(0.72 0.19 145)",
                            }}
                            onClick={() =>
                              setApproval.mutate({
                                principal: user.principal,
                                status: ApprovalStatus.approved,
                              })
                            }
                            disabled={setApproval.isPending}
                            data-ocid={`admin.approve_button.${i + 1}`}
                          >
                            <Check className="w-2.5 h-2.5" /> Approve
                          </button>
                          <button
                            type="button"
                            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-colors disabled:opacity-40"
                            style={{
                              border:
                                "1px solid oklch(0.577 0.245 27.325 / 0.5)",
                              color: "oklch(0.577 0.245 27.325)",
                            }}
                            onClick={() =>
                              setApproval.mutate({
                                principal: user.principal,
                                status: ApprovalStatus.rejected,
                              })
                            }
                            disabled={setApproval.isPending}
                            data-ocid={`admin.reject_button.${i + 1}`}
                          >
                            <X className="w-2.5 h-2.5" /> Reject
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {approvedUsers.length > 0 && (
                  <div>
                    <p
                      className="text-[9px] uppercase tracking-[0.2em] mb-2"
                      style={{ color: "oklch(0.77 0.015 240 / 0.5)" }}
                    >
                      Approved ({approvedUsers.length})
                    </p>
                    <div
                      className="flex flex-wrap gap-2"
                      data-ocid="admin.approved.list"
                    >
                      {approvedUsers.map((user, i) => (
                        <div
                          key={user.principal.toString()}
                          className="flex items-center gap-2 rounded px-3 py-1.5"
                          style={{
                            background: "oklch(0.14 0.013 245)",
                            border: "1px solid oklch(0.24 0.018 245)",
                          }}
                          data-ocid={`admin.approved.item.${i + 1}`}
                        >
                          <span
                            className="font-mono text-[11px]"
                            style={{ color: "oklch(0.77 0.015 240 / 0.8)" }}
                          >
                            {truncate(user.principal.toString())}
                          </span>
                          <button
                            type="button"
                            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-colors disabled:opacity-40"
                            style={{
                              border: "1px solid oklch(0.7 0.18 50 / 0.5)",
                              color: "oklch(0.7 0.18 50)",
                            }}
                            onClick={() =>
                              setApproval.mutate({
                                principal: user.principal,
                                status: ApprovalStatus.rejected,
                              })
                            }
                            disabled={setApproval.isPending}
                            data-ocid={`admin.block_button.${i + 1}`}
                          >
                            <Ban className="w-2.5 h-2.5" /> Block
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {blockedUsers.length > 0 && (
                  <div>
                    <p
                      className="text-[9px] uppercase tracking-[0.2em] mb-2"
                      style={{ color: "oklch(0.77 0.015 240 / 0.5)" }}
                    >
                      Blocked ({blockedUsers.length})
                    </p>
                    <div
                      className="flex flex-wrap gap-2"
                      data-ocid="admin.blocked.list"
                    >
                      {blockedUsers.map((user, i) => (
                        <div
                          key={user.principal.toString()}
                          className="flex items-center gap-2 rounded px-3 py-1.5"
                          style={{
                            background: "oklch(0.14 0.013 245)",
                            border: "1px solid oklch(0.577 0.245 27.325 / 0.3)",
                          }}
                          data-ocid={`admin.blocked.item.${i + 1}`}
                        >
                          <span
                            className="font-mono text-[11px]"
                            style={{ color: "oklch(0.77 0.015 240 / 0.5)" }}
                          >
                            {truncate(user.principal.toString())}
                          </span>
                          <button
                            type="button"
                            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-colors disabled:opacity-40"
                            style={{
                              border: "1px solid oklch(0.45 0.10 210 / 0.5)",
                              color: "oklch(0.45 0.10 210)",
                            }}
                            onClick={() =>
                              setApproval.mutate({
                                principal: user.principal,
                                status: ApprovalStatus.approved,
                              })
                            }
                            disabled={setApproval.isPending}
                            data-ocid={`admin.unblock_button.${i + 1}`}
                          >
                            <Check className="w-2.5 h-2.5" /> Unblock
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pendingUsers.length === 0 &&
                  approvedUsers.length === 0 &&
                  blockedUsers.length === 0 && (
                    <p
                      className="text-xs"
                      style={{ color: "oklch(0.77 0.015 240 / 0.4)" }}
                      data-ocid="admin.empty_state"
                    >
                      No users to manage.
                    </p>
                  )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
