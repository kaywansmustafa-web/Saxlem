import { PageHeader, StateView, StatusBadge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { listDocuments } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";
import { DocumentUpload } from "@/components/document-upload";
import { DocumentDelete } from "@/components/document-delete";
export default async function DocumentsPage() {
  const items = await listDocuments(await requireOwnerSession());
  return (
    <>
      <PageHeader
        title="Document Center"
        description="Authorized document metadata and lifecycle. Production object storage is required before deployment."
      />
      <DocumentUpload />
      {items.length ? (
        <DataTable
          headers={["Filename", "Category", "Type", "Size", "Status", "Action"]}
          rows={items.map((item) => [
            item.status === "available" ? (
              <a key="download" href={`/api/documents/${item.id}/download`}>
                {item.filename}
              </a>
            ) : (
              item.filename
            ),
            item.category,
            item.contentType,
            `${Math.ceil(item.sizeBytes / 1024)} KB`,
            <StatusBadge key="status" status={item.status} />,
            item.status === "available" ? (
              <DocumentDelete
                key="delete"
                id={item.id}
                filename={item.filename}
              />
            ) : (
              "Unavailable"
            ),
          ])}
        />
      ) : (
        <StateView
          title="No documents"
          description="No uploaded document records match this scope."
        />
      )}
    </>
  );
}
