export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const guardsPath = `${process.cwd()}/scripts/server-guards.js`;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require(guardsPath).setupBenignConnectionHandlers();
}
