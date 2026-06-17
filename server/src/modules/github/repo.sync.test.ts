import { describe, it, expect } from "vitest";
import { toPermissionEnum, toRoleEnum, toVisibilityEnum } from "./repo.sync.js";

describe("repo.sync enum mappers", () => {
  it("maps DTO permission strings to Prisma enums", () => {
    expect(toPermissionEnum("admin")).toBe("ADMIN");
    expect(toPermissionEnum("write")).toBe("WRITE");
    expect(toPermissionEnum("read")).toBe("READ");
  });
  it("maps DTO repo roles to Prisma enums", () => {
    expect(toRoleEnum("owner")).toBe("OWNER");
    expect(toRoleEnum("maintainer")).toBe("MAINTAINER");
    expect(toRoleEnum("collaborator")).toBe("COLLABORATOR");
  });
  it("maps visibility to Prisma enum", () => {
    expect(toVisibilityEnum("public")).toBe("PUBLIC");
    expect(toVisibilityEnum("private")).toBe("PRIVATE");
  });
});
