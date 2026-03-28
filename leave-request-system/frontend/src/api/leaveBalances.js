export function getBalances() {
  return fetch("/api/leave-balances", { credentials: "include" }).then(
    async (r) => {
      if (!r.ok) throw new Error("Failed to load balances");
      return r.json();
    },
  );
}
