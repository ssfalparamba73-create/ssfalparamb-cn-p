import bcrypt from "bcryptjs";

export async function hashPinForPostgres(pin: string): Promise<string> {
  const hash = await bcrypt.hash(pin, 10);
  return hash.replace(/^\$2[by]\$/, "$2a$");
}
