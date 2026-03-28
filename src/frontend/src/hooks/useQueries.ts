import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApprovalStatus } from "../backend";
import type { EcosystemRole, ExtendedUserInfo, ProjectInfo } from "../types";
import { useActor } from "./useActor";

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerApproved() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isCallerApproved"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerApproved();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListApprovals() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["listApprovals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApprovals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRequestApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.requestApproval();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isCallerApproved"] });
      queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
    },
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      principal,
      status,
    }: {
      principal: Principal;
      status: ApprovalStatus;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.setApproval(principal, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listApprovals"] });
      queryClient.invalidateQueries({ queryKey: ["listAllUsers"] });
    },
  });
}

// ─── Step 2: Extended user management (actor cast as any — awaiting bindings regen) ────

export function useListAllUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<ExtendedUserInfo[]>({
    queryKey: ["listAllUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).listAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMyInfo() {
  const { actor, isFetching } = useActor();
  return useQuery<ExtendedUserInfo | null>({
    queryKey: ["myInfo"],
    queryFn: async () => {
      if (!actor) return null;
      return (actor as any).getMyInfo();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAssignUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      principal,
      role,
    }: { principal: Principal; role: EcosystemRole }) => {
      if (!actor) throw new Error("No actor");
      return (actor as any).assignUserRole(principal, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listAllUsers"] });
    },
  });
}

export function useReverseUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      principal,
      newRole,
    }: { principal: Principal; newRole: EcosystemRole }) => {
      if (!actor) throw new Error("No actor");
      return (actor as any).reverseUserRole(principal, newRole);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listAllUsers"] });
    },
  });
}

export function useUpdateReputation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      principal,
      points,
    }: { principal: Principal; points: number }) => {
      if (!actor) throw new Error("No actor");
      return (actor as any).updateReputation(principal, points);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listAllUsers"] });
    },
  });
}

export function usePromoteToAdmin2() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) throw new Error("No actor");
      return (actor as any).promoteToAdmin2(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listAllUsers"] });
    },
  });
}

export function useRevokeAdmin2() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) throw new Error("No actor");
      return (actor as any).revokeAdmin2(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listAllUsers"] });
    },
  });
}

// ─── Step 2: Projects ─────────────────────────────────────────────────────────

export function useGetProjects() {
  const { actor, isFetching } = useActor();
  return useQuery<ProjectInfo[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getProjects();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllProjects() {
  const { actor, isFetching } = useActor();
  return useQuery<ProjectInfo[]>({
    queryKey: ["allProjects"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllProjects();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateProject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (title: string): Promise<bigint> => {
      if (!actor) throw new Error("No actor");
      return (actor as any).createProject(title);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["allProjects"] });
    },
  });
}

export function useConfirmProject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: bigint) => {
      if (!actor) throw new Error("No actor");
      return (actor as any).confirmProject(projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allProjects"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useArchiveProject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: bigint) => {
      if (!actor) throw new Error("No actor");
      return (actor as any).archiveProject(projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allProjects"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export { ApprovalStatus };
