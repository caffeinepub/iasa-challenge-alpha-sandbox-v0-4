// Step 2 types — defined locally until backend bindings are regenerated
import type { Principal } from "@icp-sdk/core/principal";
import { ApprovalStatus } from "./backend";

export { ApprovalStatus };

export enum EcosystemRole {
  mentor = "mentor",
  journeyman = "journeyman",
  apprentice = "apprentice",
  invitedArtist = "invitedArtist",
  admin = "admin",
  none = "none",
}

export enum ProjectStatus {
  pending = "pending",
  active = "active",
  archived = "archived",
}

export interface ExtendedUserInfo {
  principal: Principal;
  status: ApprovalStatus;
  role: EcosystemRole;
  reputationPoints: number;
  adminLevel: bigint;
  registrationTime: [bigint] | [];
}

export interface ProjectInfo {
  projectId: bigint;
  title: string;
  creator: Principal;
  status: ProjectStatus;
  creationTime: bigint;
}
