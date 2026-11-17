export function OrganizationFilter({
  organizations,
  selected,
  action,
  allowAll = false,
}: {
  organizations: readonly { id: string; name: string }[];
  selected?: string;
  action: string;
  /** Offer "All organizations" instead of forcing a choice. */
  allowAll?: boolean;
}) {
  return (
    <form
      className="card"
      style={{
        padding: 16,
        display: "flex",
        gap: 12,
        alignItems: "end",
        marginBottom: 18,
      }}
      method="get"
      action={action}
    >
      <div className="field" style={{ margin: 0, flex: 1 }}>
        <label htmlFor="organizationId">Organization</label>
        <select
          id="organizationId"
          name="organizationId"
          required={!allowAll}
          defaultValue={selected ?? ""}
        >
          <option value="" disabled={!allowAll}>
            {allowAll ? "All organizations" : "Choose an organization"}
          </option>
          {organizations.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <button className="button button-primary">Show</button>
    </form>
  );
}
