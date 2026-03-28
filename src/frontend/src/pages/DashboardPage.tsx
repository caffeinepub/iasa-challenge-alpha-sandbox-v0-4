import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  Archive,
  CheckCircle,
  Crown,
  FolderOpen,
  Loader2,
  LogOut,
  Plus,
  Shield,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { FINISH_TARGET, SingleCountdown } from "../components/Countdown";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useArchiveProject,
  useAssignUserRole,
  useConfirmProject,
  useCreateProject,
  useGetAllProjects,
  useGetMyInfo,
  useGetProjects,
  useIsCallerAdmin,
  useListAllUsers,
  usePromoteToAdmin2,
  useReverseUserRole,
  useRevokeAdmin2,
  useSetApproval,
  useUpdateReputation,
} from "../hooks/useQueries";
import { ApprovalStatus, EcosystemRole, ProjectStatus } from "../types";

interface DashboardPageProps {
  onBack: () => void;
}

const truncate = (p: string) => `${p.slice(0, 6)}…${p.slice(-4)}`;

function roleName(role: EcosystemRole): string {
  switch (role) {
    case EcosystemRole.mentor:
      return "Mentor";
    case EcosystemRole.journeyman:
      return "Journeyman";
    case EcosystemRole.apprentice:
      return "Apprentice";
    case EcosystemRole.invitedArtist:
      return "Invited Artist";
    case EcosystemRole.admin:
      return "Admin";
    default:
      return "None";
  }
}

function roleBadgeStyle(role: EcosystemRole): React.CSSProperties {
  switch (role) {
    case EcosystemRole.mentor:
      return {
        background: "oklch(0.35 0.12 295 / 0.25)",
        color: "oklch(0.75 0.14 295)",
        border: "1px solid oklch(0.35 0.12 295 / 0.4)",
      };
    case EcosystemRole.journeyman:
      return {
        background: "oklch(0.35 0.12 240 / 0.25)",
        color: "oklch(0.65 0.14 240)",
        border: "1px solid oklch(0.35 0.12 240 / 0.4)",
      };
    case EcosystemRole.apprentice:
      return {
        background: "oklch(0.40 0.14 50 / 0.25)",
        color: "oklch(0.72 0.15 50)",
        border: "1px solid oklch(0.40 0.14 50 / 0.4)",
      };
    case EcosystemRole.invitedArtist:
      return {
        background: "oklch(0.38 0.14 340 / 0.25)",
        color: "oklch(0.72 0.14 340)",
        border: "1px solid oklch(0.38 0.14 340 / 0.4)",
      };
    case EcosystemRole.admin:
      return {
        background: "oklch(0.50 0.14 80 / 0.25)",
        color: "oklch(0.78 0.16 80)",
        border: "1px solid oklch(0.50 0.14 80 / 0.4)",
      };
    default:
      return {
        background: "oklch(0.20 0.010 245 / 0.5)",
        color: "oklch(0.55 0.010 245)",
        border: "1px solid oklch(0.28 0.015 245 / 0.4)",
      };
  }
}

function statusBadgeStyle(status: ApprovalStatus): React.CSSProperties {
  switch (status) {
    case ApprovalStatus.approved:
      return {
        background: "oklch(0.30 0.12 145 / 0.25)",
        color: "oklch(0.72 0.19 145)",
        border: "1px solid oklch(0.30 0.12 145 / 0.4)",
      };
    case ApprovalStatus.pending:
      return {
        background: "oklch(0.40 0.14 75 / 0.25)",
        color: "oklch(0.78 0.16 75)",
        border: "1px solid oklch(0.40 0.14 75 / 0.4)",
      };
    default:
      return {
        background: "oklch(0.35 0.14 27 / 0.25)",
        color: "oklch(0.70 0.20 27)",
        border: "1px solid oklch(0.35 0.14 27 / 0.4)",
      };
  }
}

function projectStatusStyle(status: ProjectStatus): React.CSSProperties {
  switch (status) {
    case ProjectStatus.active:
      return {
        background: "oklch(0.30 0.12 240 / 0.25)",
        color: "oklch(0.65 0.14 240)",
        border: "1px solid oklch(0.30 0.12 240 / 0.4)",
      };
    case ProjectStatus.pending:
      return {
        background: "oklch(0.40 0.14 75 / 0.25)",
        color: "oklch(0.78 0.16 75)",
        border: "1px solid oklch(0.40 0.14 75 / 0.4)",
      };
    default:
      return {
        background: "oklch(0.20 0.010 245 / 0.5)",
        color: "oklch(0.55 0.010 245)",
        border: "1px solid oklch(0.28 0.015 245 / 0.4)",
      };
  }
}

function formatDate(nanos: bigint): string {
  const ms = Number(nanos / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isNearExpiry(registrationTime: [bigint] | []): boolean {
  if (registrationTime.length === 0) return false;
  const regMs = Number(registrationTime[0] / 1_000_000n);
  const deadline = regMs + 48 * 60 * 60 * 1000;
  const remaining = deadline - Date.now();
  return remaining > 0 && remaining < 2 * 60 * 60 * 1000;
}

// ─── Admin Sidebar ────────────────────────────────────────────────────────────

function AdminSidebar({ isAdmin1 }: { isAdmin1: boolean }) {
  const { data: allUsers, isLoading: usersLoading } = useListAllUsers();
  const { data: allProjects, isLoading: projectsLoading } = useGetAllProjects();
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toString();

  const assignRole = useAssignUserRole();
  const reverseRole = useReverseUserRole();
  const setRep = useUpdateReputation();
  const setApproval = useSetApproval();
  const promoteAdmin2 = usePromoteToAdmin2();
  const revokeAdmin2 = useRevokeAdmin2();
  const confirmProject = useConfirmProject();
  const archiveProject = useArchiveProject();

  const [roleSelections, setRoleSelections] = useState<
    Record<string, EcosystemRole>
  >({});
  const [repValues, setRepValues] = useState<Record<string, string>>({});
  const [showArchived, setShowArchived] = useState(false);

  const otherUsers =
    allUsers?.filter((u) => u.principal.toString() !== myPrincipal) ?? [];
  const visibleProjects =
    allProjects?.filter((p) =>
      showArchived ? true : p.status !== ProjectStatus.archived,
    ) ?? [];

  return (
    <aside
      className="w-80 flex-shrink-0 flex flex-col h-full"
      style={{
        background: "oklch(0.09 0.009 248)",
        borderRight: "1px solid oklch(0.22 0.016 245)",
      }}
      data-ocid="dashboard.admin.sidebar"
    >
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid oklch(0.22 0.016 245)" }}
      >
        <p
          className="text-[9px] uppercase tracking-[0.25em]"
          style={{ color: "oklch(0.50 0.060 240)" }}
        >
          Admin Panel
        </p>
      </div>

      <Tabs defaultValue="users" className="flex flex-col flex-1 min-h-0">
        <TabsList
          className="mx-3 mt-2 mb-0 h-8 flex-shrink-0 rounded"
          style={{ background: "oklch(0.12 0.010 247)" }}
        >
          <TabsTrigger
            value="users"
            className="text-[10px] h-6 flex-1"
            data-ocid="dashboard.users.tab"
          >
            <Users className="w-3 h-3 mr-1" />
            Users
          </TabsTrigger>
          <TabsTrigger
            value="projects"
            className="text-[10px] h-6 flex-1"
            data-ocid="dashboard.projects.tab"
          >
            <FolderOpen className="w-3 h-3 mr-1" />
            Projects
          </TabsTrigger>
          {isAdmin1 && (
            <TabsTrigger
              value="admin2"
              className="text-[10px] h-6 flex-1"
              data-ocid="dashboard.admin2.tab"
            >
              <Crown className="w-3 h-3 mr-1" />
              Admin2
            </TabsTrigger>
          )}
        </TabsList>

        {/* USERS TAB */}
        <TabsContent value="users" className="flex-1 min-h-0 mt-2">
          <ScrollArea className="h-full px-3 pb-3">
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2
                  className="w-4 h-4 animate-spin"
                  style={{ color: "oklch(0.41 0.10 240)" }}
                />
              </div>
            ) : otherUsers.length === 0 ? (
              <p
                className="text-[10px] px-2 py-4"
                style={{ color: "oklch(0.45 0.010 245)" }}
                data-ocid="dashboard.users.empty_state"
              >
                No other users.
              </p>
            ) : (
              <div className="space-y-2">
                {otherUsers.map((user, i) => {
                  const pid = user.principal.toString();
                  const nearExpiry =
                    user.status === ApprovalStatus.pending &&
                    isNearExpiry(user.registrationTime);
                  const selectedRole =
                    roleSelections[pid] ?? EcosystemRole.journeyman;
                  const repInput =
                    repValues[pid] ?? String(user.reputationPoints);

                  return (
                    <div
                      key={pid}
                      className="rounded-md p-2.5 space-y-2"
                      style={{
                        background: "oklch(0.12 0.010 247)",
                        border: nearExpiry
                          ? "1px solid oklch(0.577 0.245 27 / 0.5)"
                          : "1px solid oklch(0.22 0.016 245)",
                      }}
                      data-ocid={`dashboard.users.item.${i + 1}`}
                    >
                      {/* Principal + badges */}
                      <div className="flex items-start justify-between gap-1">
                        <span
                          className="font-mono text-[9px]"
                          style={{ color: "oklch(0.60 0.015 240)" }}
                        >
                          {truncate(pid)}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {user.adminLevel === 2n && (
                            <Crown
                              className="w-3 h-3"
                              style={{ color: "oklch(0.78 0.16 80)" }}
                            />
                          )}
                          {user.adminLevel === 1n && (
                            <Shield
                              className="w-3 h-3"
                              style={{ color: "oklch(0.65 0.14 240)" }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Status + Role badges */}
                      <div className="flex gap-1 flex-wrap">
                        <span
                          className="text-[8px] px-1.5 py-0.5 rounded-full font-medium"
                          style={statusBadgeStyle(user.status)}
                        >
                          {user.status}
                        </span>
                        <span
                          className="text-[8px] px-1.5 py-0.5 rounded-full font-medium"
                          style={roleBadgeStyle(user.role)}
                        >
                          {roleName(user.role)}
                        </span>
                        {nearExpiry && (
                          <span
                            className="flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{
                              background: "oklch(0.40 0.20 27 / 0.25)",
                              color: "oklch(0.72 0.20 27)",
                              border: "1px solid oklch(0.40 0.20 27 / 0.4)",
                            }}
                          >
                            <AlertTriangle className="w-2 h-2" /> Expiring
                          </span>
                        )}
                      </div>

                      {/* Assign Role */}
                      <div className="flex gap-1">
                        <Select
                          value={selectedRole}
                          onValueChange={(v) =>
                            setRoleSelections((prev) => ({
                              ...prev,
                              [pid]: v as EcosystemRole,
                            }))
                          }
                        >
                          <SelectTrigger
                            className="h-6 text-[9px] flex-1"
                            style={{
                              background: "oklch(0.10 0.008 248)",
                              border: "1px solid oklch(0.22 0.016 245)",
                            }}
                            data-ocid={`dashboard.role.select.${i + 1}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={EcosystemRole.mentor}>
                              Mentor (Judikativa)
                            </SelectItem>
                            <SelectItem value={EcosystemRole.journeyman}>
                              Journeyman
                            </SelectItem>
                            <SelectItem value={EcosystemRole.apprentice}>
                              Apprentice
                            </SelectItem>
                            <SelectItem value={EcosystemRole.invitedArtist}>
                              Invited Artist
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          className="h-6 text-[9px] px-2"
                          style={{
                            background: "oklch(0.35 0.10 240 / 0.4)",
                            color: "oklch(0.72 0.10 240)",
                            border: "1px solid oklch(0.35 0.10 240 / 0.5)",
                          }}
                          onClick={() => {
                            if (user.role === EcosystemRole.none) {
                              assignRole.mutate(
                                {
                                  principal: user.principal,
                                  role: selectedRole,
                                },
                                {
                                  onSuccess: () =>
                                    toast.success("Role assigned"),
                                  onError: () => toast.error("Failed"),
                                },
                              );
                            } else {
                              reverseRole.mutate(
                                {
                                  principal: user.principal,
                                  newRole: selectedRole,
                                },
                                {
                                  onSuccess: () =>
                                    toast.success("Role updated"),
                                  onError: () => toast.error("Failed"),
                                },
                              );
                            }
                          }}
                          disabled={
                            assignRole.isPending || reverseRole.isPending
                          }
                          data-ocid={`dashboard.assign_role.button.${i + 1}`}
                        >
                          {user.role === EcosystemRole.none
                            ? "Assign"
                            : "Change"}
                        </Button>
                      </div>

                      {/* Reputation */}
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          value={repInput}
                          onChange={(e) =>
                            setRepValues((prev) => ({
                              ...prev,
                              [pid]: e.target.value,
                            }))
                          }
                          className="h-6 text-[9px] flex-1"
                          style={{
                            background: "oklch(0.10 0.008 248)",
                            border: "1px solid oklch(0.22 0.016 245)",
                          }}
                          placeholder="Rep pts"
                          data-ocid={`dashboard.reputation.input.${i + 1}`}
                        />
                        <Button
                          size="sm"
                          className="h-6 text-[9px] px-2"
                          style={{
                            background: "oklch(0.35 0.12 295 / 0.3)",
                            color: "oklch(0.72 0.12 295)",
                            border: "1px solid oklch(0.35 0.12 295 / 0.4)",
                          }}
                          onClick={() =>
                            setRep.mutate(
                              {
                                principal: user.principal,
                                points: Number.parseFloat(repInput) || 0,
                              },
                              {
                                onSuccess: () =>
                                  toast.success("Reputation updated"),
                                onError: () => toast.error("Failed"),
                              },
                            )
                          }
                          disabled={setRep.isPending}
                          data-ocid={`dashboard.set_rep.button.${i + 1}`}
                        >
                          Set Rep
                        </Button>
                      </div>

                      {/* Block / Unblock */}
                      <div className="flex gap-1">
                        {user.status !== ApprovalStatus.rejected ? (
                          <Button
                            size="sm"
                            className="h-6 text-[9px] px-2 w-full"
                            style={{
                              background: "oklch(0.35 0.15 27 / 0.2)",
                              color: "oklch(0.70 0.20 27)",
                              border: "1px solid oklch(0.35 0.15 27 / 0.4)",
                            }}
                            onClick={() =>
                              setApproval.mutate(
                                {
                                  principal: user.principal,
                                  status: ApprovalStatus.rejected,
                                },
                                {
                                  onSuccess: () =>
                                    toast.success("User blocked"),
                                  onError: () => toast.error("Failed"),
                                },
                              )
                            }
                            disabled={setApproval.isPending}
                            data-ocid={`dashboard.block.button.${i + 1}`}
                          >
                            Block User
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="h-6 text-[9px] px-2 w-full"
                            style={{
                              background: "oklch(0.30 0.12 145 / 0.2)",
                              color: "oklch(0.72 0.19 145)",
                              border: "1px solid oklch(0.30 0.12 145 / 0.4)",
                            }}
                            onClick={() =>
                              setApproval.mutate(
                                {
                                  principal: user.principal,
                                  status: ApprovalStatus.approved,
                                },
                                {
                                  onSuccess: () =>
                                    toast.success("User unblocked"),
                                  onError: () => toast.error("Failed"),
                                },
                              )
                            }
                            disabled={setApproval.isPending}
                            data-ocid={`dashboard.unblock.button.${i + 1}`}
                          >
                            Unblock
                          </Button>
                        )}
                        {/* Admin1-only: Promote/Revoke Admin2 */}
                        {isAdmin1 && user.adminLevel === 0n && (
                          <Button
                            size="sm"
                            className="h-6 text-[9px] px-2"
                            style={{
                              background: "oklch(0.40 0.14 80 / 0.2)",
                              color: "oklch(0.78 0.16 80)",
                              border: "1px solid oklch(0.40 0.14 80 / 0.4)",
                            }}
                            onClick={() =>
                              promoteAdmin2.mutate(user.principal, {
                                onSuccess: () =>
                                  toast.success("Promoted to Admin2"),
                                onError: () => toast.error("Failed"),
                              })
                            }
                            disabled={promoteAdmin2.isPending}
                            data-ocid={`dashboard.promote_admin2.button.${i + 1}`}
                          >
                            <Crown className="w-2.5 h-2.5" />
                          </Button>
                        )}
                        {isAdmin1 && user.adminLevel === 1n && (
                          <Button
                            size="sm"
                            className="h-6 text-[9px] px-2"
                            style={{
                              background: "oklch(0.35 0.15 27 / 0.2)",
                              color: "oklch(0.70 0.18 27)",
                              border: "1px solid oklch(0.35 0.15 27 / 0.4)",
                            }}
                            onClick={() =>
                              revokeAdmin2.mutate(user.principal, {
                                onSuccess: () =>
                                  toast.success("Admin2 revoked"),
                                onError: () => toast.error("Failed"),
                              })
                            }
                            disabled={revokeAdmin2.isPending}
                            data-ocid={`dashboard.revoke_admin2.button.${i + 1}`}
                          >
                            <Shield className="w-2.5 h-2.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* PROJECTS TAB */}
        <TabsContent value="projects" className="flex-1 min-h-0 mt-2">
          <ScrollArea className="h-full px-3 pb-3">
            {projectsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2
                  className="w-4 h-4 animate-spin"
                  style={{ color: "oklch(0.41 0.10 240)" }}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <p
                    className="text-[9px] uppercase tracking-[0.2em]"
                    style={{ color: "oklch(0.50 0.060 240)" }}
                  >
                    All Projects
                  </p>
                  <button
                    type="button"
                    className="text-[8px] px-2 py-0.5 rounded"
                    style={{
                      background: showArchived
                        ? "oklch(0.30 0.10 240 / 0.3)"
                        : "oklch(0.18 0.010 247)",
                      color: "oklch(0.60 0.060 240)",
                      border: "1px solid oklch(0.22 0.016 245)",
                    }}
                    onClick={() => setShowArchived((v) => !v)}
                    data-ocid="dashboard.show_archived.toggle"
                  >
                    {showArchived ? "Hide Archived" : "Show Archived"}
                  </button>
                </div>

                {visibleProjects.length === 0 ? (
                  <p
                    className="text-[10px] py-4"
                    style={{ color: "oklch(0.45 0.010 245)" }}
                    data-ocid="dashboard.admin.projects.empty_state"
                  >
                    No projects.
                  </p>
                ) : (
                  visibleProjects.map((project, i) => (
                    <div
                      key={String(project.projectId)}
                      className="rounded-md p-2.5"
                      style={{
                        background: "oklch(0.12 0.010 247)",
                        border: "1px solid oklch(0.22 0.016 245)",
                      }}
                      data-ocid={`dashboard.admin.project.item.${i + 1}`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <div>
                          <span
                            className="text-[9px] font-semibold"
                            style={{ color: "oklch(0.80 0.015 240)" }}
                          >
                            #{Number(project.projectId)}
                          </span>
                          <span
                            className="text-[9px] ml-1.5"
                            style={{ color: "oklch(0.65 0.015 240)" }}
                          >
                            {project.title}
                          </span>
                        </div>
                        <span
                          className="text-[7px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                          style={projectStatusStyle(project.status)}
                        >
                          {project.status}
                        </span>
                      </div>
                      <p
                        className="font-mono text-[8px] mb-2"
                        style={{ color: "oklch(0.45 0.010 245)" }}
                      >
                        {truncate(project.creator.toString())}
                      </p>
                      <div className="flex gap-1">
                        {project.status === ProjectStatus.pending && (
                          <Button
                            size="sm"
                            className="h-5 text-[8px] px-2"
                            style={{
                              background: "oklch(0.30 0.12 145 / 0.2)",
                              color: "oklch(0.72 0.19 145)",
                              border: "1px solid oklch(0.30 0.12 145 / 0.4)",
                            }}
                            onClick={() =>
                              confirmProject.mutate(project.projectId, {
                                onSuccess: () =>
                                  toast.success("Project confirmed"),
                                onError: () => toast.error("Failed"),
                              })
                            }
                            disabled={confirmProject.isPending}
                            data-ocid={`dashboard.confirm_project.button.${i + 1}`}
                          >
                            <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                            Confirm
                          </Button>
                        )}
                        {project.status !== ProjectStatus.archived && (
                          <Button
                            size="sm"
                            className="h-5 text-[8px] px-2"
                            style={{
                              background: "oklch(0.20 0.010 247 / 0.5)",
                              color: "oklch(0.55 0.010 245)",
                              border: "1px solid oklch(0.22 0.016 245)",
                            }}
                            onClick={() =>
                              archiveProject.mutate(project.projectId, {
                                onSuccess: () =>
                                  toast.success("Project archived"),
                                onError: () => toast.error("Failed"),
                              })
                            }
                            disabled={archiveProject.isPending}
                            data-ocid={`dashboard.archive_project.button.${i + 1}`}
                          >
                            <Archive className="w-2.5 h-2.5 mr-0.5" />
                            Archive
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* ADMIN2 TAB (Admin1 only) */}
        {isAdmin1 && (
          <TabsContent value="admin2" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-full px-3 pb-3">
              <p
                className="text-[9px] mb-3"
                style={{ color: "oklch(0.55 0.015 240)" }}
              >
                Promote a user to Admin2. Admin2 has the same management powers,
                but you (Admin1) can revoke at any time.
              </p>
              <div className="space-y-2">
                {(
                  allUsers?.filter(
                    (u) => u.principal.toString() !== myPrincipal,
                  ) ?? []
                ).map((user, i) => (
                  <div
                    key={user.principal.toString()}
                    className="rounded-md p-2.5 flex items-center justify-between"
                    style={{
                      background: "oklch(0.12 0.010 247)",
                      border: "1px solid oklch(0.22 0.016 245)",
                    }}
                    data-ocid={`dashboard.admin2.item.${i + 1}`}
                  >
                    <div className="flex items-center gap-1.5">
                      {user.adminLevel === 1n && (
                        <Shield
                          className="w-3 h-3"
                          style={{ color: "oklch(0.65 0.14 240)" }}
                        />
                      )}
                      <span
                        className="font-mono text-[9px]"
                        style={{ color: "oklch(0.60 0.015 240)" }}
                      >
                        {truncate(user.principal.toString())}
                      </span>
                    </div>
                    {user.adminLevel === 0n ? (
                      <Button
                        size="sm"
                        className="h-6 text-[9px] px-2"
                        style={{
                          background: "oklch(0.40 0.14 80 / 0.2)",
                          color: "oklch(0.78 0.16 80)",
                          border: "1px solid oklch(0.40 0.14 80 / 0.4)",
                        }}
                        onClick={() =>
                          promoteAdmin2.mutate(user.principal, {
                            onSuccess: () =>
                              toast.success("Promoted to Admin2"),
                            onError: () => toast.error("Failed"),
                          })
                        }
                        disabled={promoteAdmin2.isPending}
                        data-ocid={`dashboard.admin2.promote.button.${i + 1}`}
                      >
                        <Crown className="w-2.5 h-2.5 mr-1" />
                        Promote
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="h-6 text-[9px] px-2"
                        style={{
                          background: "oklch(0.35 0.15 27 / 0.2)",
                          color: "oklch(0.70 0.18 27)",
                          border: "1px solid oklch(0.35 0.15 27 / 0.4)",
                        }}
                        onClick={() =>
                          revokeAdmin2.mutate(user.principal, {
                            onSuccess: () => toast.success("Admin2 revoked"),
                            onError: () => toast.error("Failed"),
                          })
                        }
                        disabled={revokeAdmin2.isPending}
                        data-ocid={`dashboard.admin2.revoke.button.${i + 1}`}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        )}
      </Tabs>
    </aside>
  );
}

// ─── Create Project Dialog ────────────────────────────────────────────────────

function CreateProjectDialog({ canCreate }: { canCreate: boolean }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const createProject = useCreateProject();

  function handleCreate() {
    if (!title.trim()) return;
    createProject.mutate(title.trim(), {
      onSuccess: (projectId) => {
        toast.success(
          `Project #${Number(projectId)} created — awaiting admin confirmation`,
        );
        setTitle("");
        setOpen(false);
      },
      onError: () => toast.error("Failed to create project"),
    });
  }

  if (!canCreate) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                size="sm"
                disabled
                className="gap-1.5"
                data-ocid="dashboard.create_project.button"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Project
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Role required to create projects</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="gap-1.5 btn-primary-blue"
          data-ocid="dashboard.create_project.button"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Project
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-sm"
        style={{
          background: "oklch(0.11 0.010 248)",
          border: "1px solid oklch(0.22 0.016 245)",
        }}
        data-ocid="dashboard.create_project.dialog"
      >
        <DialogHeader>
          <DialogTitle style={{ color: "oklch(0.92 0.008 240)" }}>
            New Project
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label
              className="text-xs mb-1.5 block"
              style={{ color: "oklch(0.65 0.015 240)" }}
            >
              Project Title
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter project title…"
              className="text-sm"
              style={{
                background: "oklch(0.09 0.008 248)",
                border: "1px solid oklch(0.22 0.016 245)",
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              data-ocid="dashboard.project_title.input"
            />
          </div>
          <p className="text-[10px]" style={{ color: "oklch(0.50 0.010 245)" }}>
            Your project will be submitted for admin review before becoming
            active.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            data-ocid="dashboard.create_project.cancel_button"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={!title.trim() || createProject.isPending}
            className="btn-primary-blue"
            data-ocid="dashboard.create_project.submit_button"
          >
            {createProject.isPending ? (
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
            ) : null}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────

function MainContent({
  myInfo,
}: { myInfo: ReturnType<typeof useGetMyInfo>["data"] }) {
  const { data: projects, isLoading } = useGetProjects();

  const isSpectator = !myInfo || myInfo.role === EcosystemRole.none;
  const isApprentice = myInfo?.role === EcosystemRole.apprentice;
  const canCreate = !!myInfo && !isSpectator && !isApprentice;

  return (
    <main
      className="flex-1 flex flex-col min-h-0 overflow-y-auto"
      data-ocid="dashboard.main"
    >
      <div className="px-6 py-5">
        {/* Spectator banner */}
        {isSpectator && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 px-4 py-2.5 rounded-md text-[11px]"
            style={{
              background: "oklch(0.35 0.10 75 / 0.12)",
              border: "1px solid oklch(0.35 0.10 75 / 0.35)",
              color: "oklch(0.72 0.12 75)",
            }}
            data-ocid="dashboard.spectator.panel"
          >
            You are a <strong>spectator</strong>. An admin must assign your role
            to participate in projects.
          </motion.div>
        )}

        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2
              className="text-xl font-bold tracking-tight"
              style={{ color: "oklch(0.92 0.008 240)" }}
            >
              Active Projects
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: "oklch(0.50 0.010 245)" }}
            >
              Live IASA Challenge governance projects
            </p>
          </div>
          <CreateProjectDialog canCreate={canCreate} />
        </div>

        {/* Projects grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2
              className="w-6 h-6 animate-spin"
              style={{ color: "oklch(0.41 0.10 240)" }}
            />
          </div>
        ) : projects && projects.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          >
            {projects.map((project, i) => (
              <motion.div
                key={String(project.projectId)}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0 },
                }}
                className="rounded-lg p-4 cursor-default transition-all hover:scale-[1.01]"
                style={{
                  background: "oklch(0.12 0.010 247)",
                  border: "1px solid oklch(0.22 0.016 245)",
                  boxShadow: "0 2px 16px oklch(0.05 0.006 250 / 0.5)",
                }}
                data-ocid={`dashboard.projects.item.${i + 1}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span
                    className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      background: "oklch(0.30 0.12 240 / 0.2)",
                      color: "oklch(0.55 0.12 240)",
                    }}
                  >
                    #{Number(project.projectId)}
                  </span>
                  <span
                    className="text-[8px] px-1.5 py-0.5 rounded-full font-medium"
                    style={projectStatusStyle(project.status)}
                  >
                    {project.status}
                  </span>
                </div>
                <h3
                  className="text-sm font-semibold mb-2"
                  style={{ color: "oklch(0.88 0.008 240)" }}
                >
                  {project.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span
                    className="font-mono text-[9px]"
                    style={{ color: "oklch(0.45 0.010 245)" }}
                  >
                    {truncate(project.creator.toString())}
                  </span>
                  <span
                    className="text-[9px]"
                    style={{ color: "oklch(0.42 0.010 245)" }}
                  >
                    {formatDate(project.creationTime)}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div
            className="flex flex-col items-center justify-center py-16 rounded-lg"
            style={{
              background: "oklch(0.10 0.008 248 / 0.5)",
              border: "1px dashed oklch(0.22 0.016 245)",
            }}
            data-ocid="dashboard.projects.empty_state"
          >
            <FolderOpen
              className="w-10 h-10 mb-3"
              style={{ color: "oklch(0.30 0.015 245)" }}
            />
            <p
              className="text-sm font-medium"
              style={{ color: "oklch(0.50 0.015 245)" }}
            >
              No active projects yet.
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "oklch(0.38 0.010 245)" }}
            >
              Create a project to get started.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export function DashboardPage({ onBack }: DashboardPageProps) {
  const { clear, identity } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: myInfo } = useGetMyInfo();

  const principal = identity?.getPrincipal().toString();
  const truncatePrincipal = (p: string) => `${p.slice(0, 10)}…${p.slice(-6)}`;
  const isAdmin1 = (myInfo?.adminLevel ?? 0n) === 2n;

  function handleSignOut() {
    clear();
    onBack();
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#000" }}>
      {/* Header */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-5 py-3 z-20"
        style={{
          background: "oklch(0.10 0.010 245 / 0.95)",
          borderBottom: "1px solid oklch(0.22 0.016 245)",
        }}
        data-ocid="dashboard.header"
      >
        <div className="flex items-center gap-3">
          <img
            src="https://grupoiasa.cl/wp-content/uploads/2024/05/GRUPO-IASA.png"
            alt="Grupo IASA"
            className="h-8 object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 text-center hidden sm:block">
          <p
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: "oklch(0.77 0.015 240 / 0.7)" }}
          >
            IASA Challenge Sandbox
          </p>
          {myInfo && myInfo.role !== EcosystemRole.none && (
            <p
              className="text-[9px] uppercase tracking-widest mt-0.5"
              style={{ color: "oklch(0.50 0.060 240)" }}
            >
              {roleName(myInfo.role)}
              {isAdmin1 && " · Admin1"}
              {!isAdmin1 && (myInfo?.adminLevel ?? 0n) === 1n && " · Admin2"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {principal && (
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p
                  className="text-[8px] uppercase tracking-widest"
                  style={{ color: "oklch(0.77 0.015 240 / 0.4)" }}
                >
                  ICP Principal
                </p>
                <p
                  className="font-mono text-[11px]"
                  style={{ color: "oklch(0.77 0.015 240 / 0.75)" }}
                >
                  {truncatePrincipal(principal)}
                </p>
              </div>
              <div
                className="w-px h-8"
                style={{ background: "oklch(0.22 0.016 245)" }}
              />
              <div className="text-right">
                <p
                  className="text-[8px] uppercase tracking-widest"
                  style={{ color: "oklch(0.72 0.19 145 / 0.6)" }}
                >
                  Finish Line
                </p>
                <p
                  className="font-mono text-[11px]"
                  style={{ color: "oklch(0.72 0.19 145 / 0.85)" }}
                >
                  <SingleCountdown
                    target={FINISH_TARGET}
                    doneText="DONE"
                    compact
                  />
                </p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded transition-colors"
            style={{
              color: "oklch(0.77 0.015 240 / 0.5)",
              border: "1px solid oklch(0.22 0.016 245)",
            }}
            data-ocid="dashboard.signout.button"
          >
            <LogOut className="w-3 h-3" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {isAdmin && <AdminSidebar isAdmin1={isAdmin1} />}
        <MainContent myInfo={myInfo} />
      </div>
    </div>
  );
}
