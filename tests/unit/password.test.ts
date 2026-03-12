import { comparePassword, hashPassword } from "@/features/auth/password";

test("hashes and verifies passwords", async () => {
  const hash = await hashPassword("top-secret");

  await expect(comparePassword("top-secret", hash)).resolves.toBe(true);
});
