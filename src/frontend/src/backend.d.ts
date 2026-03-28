import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum EcosystemRole {
    mentor = "mentor",
    journeyman = "journeyman",
    apprentice = "apprentice",
    invitedArtist = "invitedArtist",
    admin = "admin",
    none = "none"
}
export enum ProjectStatus {
    pending = "pending",
    active = "active",
    archived = "archived"
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
export interface backendInterface {
    // Auth & access (existing)
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserRole(): Promise<UserRole>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    requestApproval(): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    // Extended user management
    listAllUsers(): Promise<Array<ExtendedUserInfo>>;
    getMyInfo(): Promise<ExtendedUserInfo>;
    assignUserRole(user: Principal, role: EcosystemRole): Promise<void>;
    reverseUserRole(user: Principal, newRole: EcosystemRole): Promise<void>;
    updateReputation(user: Principal, points: number): Promise<void>;
    promoteToAdmin2(user: Principal): Promise<void>;
    revokeAdmin2(user: Principal): Promise<void>;
    // Projects
    createProject(title: string): Promise<bigint>;
    confirmProject(projectId: bigint): Promise<void>;
    archiveProject(projectId: bigint): Promise<void>;
    getProjects(): Promise<Array<ProjectInfo>>;
    getAllProjects(): Promise<Array<ProjectInfo>>;
}
