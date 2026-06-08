/**
 * Database seed. Step 1 is a no-op placeholder; Step 2 seeds School #29, the
 * Appendix A taxonomy (levels, age groups, topic tree) and one admin user.
 */
async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('[seed] placeholder — full seed (School #29, taxonomy, admin) lands in Step 2');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
