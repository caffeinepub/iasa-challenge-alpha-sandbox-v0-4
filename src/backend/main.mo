import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:base/Time";
import Buffer "mo:base/Buffer";
import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  let approvalState = UserApproval.initState(accessControlState);

  // ─── Ecosystem roles ───────────────────────────────────────────────
  type EcosystemRole = {
    #mentor;
    #journeyman;
    #apprentice;
    #invitedArtist;
    #admin;
    #none;
  };

  // ─── Admin levels: 0=regular, 1=Admin2, 2=Admin1 ──────────────────
  let userEcosystemRoles : Map.Map<Principal, EcosystemRole> = Map.empty();
  let userReputationPoints : Map.Map<Principal, Float> = Map.empty();
  let userAdminLevels : Map.Map<Principal, Nat> = Map.empty();
  let userRegistrationTimes : Map.Map<Principal, Int> = Map.empty();

  // ─── Projects ─────────────────────────────────────────────────────
  type ProjectStatus = { #pending; #active; #archived };

  type Project = {
    projectId : Nat;
    title : Text;
    creator : Principal;
    var status : ProjectStatus;
    creationTime : Int;
  };

  let projects : Map.Map<Nat, Project> = Map.empty();
  var nextProjectId : Nat = 1000000;

  // ─── Helpers ──────────────────────────────────────────────────────
  func isAdmin1(caller : Principal) : Bool {
    switch (userAdminLevels.get(caller)) {
      case (?2) { true };
      case (_) { false };
    };
  };

  func isAnyAdmin(caller : Principal) : Bool {
    switch (userAdminLevels.get(caller)) {
      case (?l) { l >= 1 };
      case (_) { false };
    };
  };

  func getEcosystemRole(p : Principal) : EcosystemRole {
    switch (userEcosystemRoles.get(p)) {
      case (?r) { r };
      case (null) { #none };
    };
  };

  func getAdminLevel(p : Principal) : Nat {
    switch (userAdminLevels.get(p)) {
      case (?l) { l };
      case (null) { 0 };
    };
  };

  func getReputation(p : Principal) : Float {
    switch (userReputationPoints.get(p)) {
      case (?r) { r };
      case (null) { 0.0 };
    };
  };

  // ─── 48-hour auto-block check ─────────────────────────────────────
  func autoBlockExpiredPending() {
    let now = Time.now();
    let fortyEightHours : Int = 48 * 60 * 60 * 1_000_000_000;
    for ((principal, regTime) in userRegistrationTimes.entries()) {
      switch (approvalState.approvalStatus.get(principal)) {
        case (?#pending) {
          if (now - regTime > fortyEightHours) {
            UserApproval.setApproval(approvalState, principal, #rejected);
          };
        };
        case (_) {};
      };
    };
  };

  system func heartbeat() : async () {
    autoBlockExpiredPending();
  };

  // ─── Preserved / updated access functions ─────────────────────────
  public query ({ caller }) func isCallerApproved() : async Bool {
    if (caller.isAnonymous()) { return false };
    if (isAnyAdmin(caller)) { return true };
    switch (approvalState.approvalStatus.get(caller)) {
      case (?#approved) { true };
      case (?#pending) { true }; // provisional access
      case (_) { false };
    };
  };

  public shared ({ caller }) func requestApproval() : async () {
    if (caller.isAnonymous()) { return };
    let now = Time.now();
    if (not accessControlState.adminAssigned) {
      // First caller becomes Admin1
      accessControlState.userRoles.add(caller, #admin);
      accessControlState.adminAssigned := true;
      UserApproval.setApproval(approvalState, caller, #approved);
      userAdminLevels.add(caller, 2);
      userEcosystemRoles.add(caller, #admin);
      userRegistrationTimes.add(caller, now);
    } else {
      if (userRegistrationTimes.get(caller) == null) {
        userRegistrationTimes.add(caller, now);
      };
      UserApproval.requestApproval(approvalState, caller);
    };
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not isAnyAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not isAnyAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  // ─── Extended user info ────────────────────────────────────────────
  public type ExtendedUserInfo = {
    principal : Principal;
    status : UserApproval.ApprovalStatus;
    role : EcosystemRole;
    reputationPoints : Float;
    adminLevel : Nat;
    registrationTime : ?Int;
  };

  public type ProjectInfo = {
    projectId : Nat;
    title : Text;
    creator : Principal;
    status : ProjectStatus;
    creationTime : Int;
  };

  public query ({ caller }) func listAllUsers() : async [ExtendedUserInfo] {
    if (not isAnyAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can call listAllUsers");
    };
    let buf = Buffer.Buffer<ExtendedUserInfo>(8);
    for (info in UserApproval.listApprovals(approvalState).vals()) {
      buf.add({
        principal = info.principal;
        status = info.status;
        role = getEcosystemRole(info.principal);
        reputationPoints = getReputation(info.principal);
        adminLevel = getAdminLevel(info.principal);
        registrationTime = userRegistrationTimes.get(info.principal);
      });
    };
    Buffer.toArray(buf);
  };

  public query ({ caller }) func getMyInfo() : async ExtendedUserInfo {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous callers have no user info");
    };
    let status = switch (approvalState.approvalStatus.get(caller)) {
      case (?s) { s };
      case (null) { #pending };
    };
    {
      principal = caller;
      status;
      role = getEcosystemRole(caller);
      reputationPoints = getReputation(caller);
      adminLevel = getAdminLevel(caller);
      registrationTime = userRegistrationTimes.get(caller);
    };
  };

  // ─── Role & reputation management ─────────────────────────────────
  public shared ({ caller }) func assignUserRole(user : Principal, role : EcosystemRole) : async () {
    if (not isAnyAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can assign roles");
    };
    userEcosystemRoles.add(user, role);
    UserApproval.setApproval(approvalState, user, #approved);
  };

  public shared ({ caller }) func reverseUserRole(user : Principal, newRole : EcosystemRole) : async () {
    if (not isAnyAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can change roles");
    };
    userEcosystemRoles.add(user, newRole);
  };

  public shared ({ caller }) func updateReputation(user : Principal, points : Float) : async () {
    if (not isAnyAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can update reputation");
    };
    userReputationPoints.add(user, points);
  };

  public shared ({ caller }) func promoteToAdmin2(user : Principal) : async () {
    if (not isAdmin1(caller)) {
      Runtime.trap("Unauthorized: Only Admin1 can promote users to Admin2");
    };
    userAdminLevels.add(user, 1);
    UserApproval.setApproval(approvalState, user, #approved);
  };

  public shared ({ caller }) func revokeAdmin2(user : Principal) : async () {
    if (not isAdmin1(caller)) {
      Runtime.trap("Unauthorized: Only Admin1 can revoke Admin2 status");
    };
    userAdminLevels.add(user, 0);
  };

  // ─── Project functions ─────────────────────────────────────────────
  public shared ({ caller }) func createProject(title : Text) : async Nat {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous callers cannot create projects");
    };
    switch (approvalState.approvalStatus.get(caller)) {
      case (?#approved) {};
      case (_) { Runtime.trap("Only approved users can create projects") };
    };
    switch (getEcosystemRole(caller)) {
      case (#apprentice) {
        Runtime.trap("Users with role Apprentice cannot create projects");
      };
      case (#none) {
        Runtime.trap("Users without an assigned role cannot create projects");
      };
      case (_) {};
    };
    let projectId = nextProjectId;
    nextProjectId += 1;
    projects.add(projectId, {
      projectId;
      title;
      creator = caller;
      var status : ProjectStatus = #pending;
      creationTime = Time.now();
    });
    projectId;
  };

  public shared ({ caller }) func confirmProject(projectId : Nat) : async () {
    if (not isAnyAdmin(caller)) {
      Runtime.trap("Only admins can confirm projects");
    };
    switch (projects.get(projectId)) {
      case (?project) { project.status := #active };
      case (null) { Runtime.trap("Project not found") };
    };
  };

  public shared ({ caller }) func archiveProject(projectId : Nat) : async () {
    if (not isAnyAdmin(caller)) {
      Runtime.trap("Only admins can archive projects");
    };
    switch (projects.get(projectId)) {
      case (?project) { project.status := #archived };
      case (null) { Runtime.trap("Project not found") };
    };
  };

  public query func getProjects() : async [ProjectInfo] {
    let buf = Buffer.Buffer<ProjectInfo>(8);
    for ((_, p) in projects.entries()) {
      if (p.status == #active) {
        buf.add({
          projectId = p.projectId;
          title = p.title;
          creator = p.creator;
          status = p.status;
          creationTime = p.creationTime;
        });
      };
    };
    Buffer.toArray(buf);
  };

  public query ({ caller }) func getAllProjects() : async [ProjectInfo] {
    if (not isAnyAdmin(caller)) {
      Runtime.trap("Only admins can get all projects");
    };
    let buf = Buffer.Buffer<ProjectInfo>(8);
    for ((_, p) in projects.entries()) {
      buf.add({
        projectId = p.projectId;
        title = p.title;
        creator = p.creator;
        status = p.status;
        creationTime = p.creationTime;
      });
    };
    Buffer.toArray(buf);
  };
};
