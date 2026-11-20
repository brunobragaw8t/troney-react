import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useCallback, useMemo, useState } from "react";
import { LuCheck, LuCopy, LuKeyRound, LuTag, LuTrash } from "react-icons/lu";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Alert, type AlertProps } from "../ui/alert/alert";
import { Button } from "../ui/button/button";
import { ConfirmationModal } from "../ui/confirmation-modal/confirmation-modal";
import { Input } from "../ui/input/input";
import { Keymap } from "../ui/keymap/keymap";
import { Spinner } from "../ui/spinner/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type TableRowActions,
} from "../ui/table/table";

type McpTokenId = Id<"mcpTokens">;

export function McpTokensSection() {
  const [alert, setAlert] = useState<AlertProps>({
    type: "error",
    message: "",
  });

  const tokens = useQuery(api.mcp_tokens.getTokens);

  // Creation
  const createToken = useMutation(api.mcp_tokens.createToken);

  const [name, setName] = useState("");
  function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
  }

  const [isCreating, setIsCreating] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  async function handleCreate(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsCreating(true);
    setAlert({ type: "error", message: "" });

    try {
      const { token } = await createToken({ name });
      setCreatedToken(token);
      setCopied(false);
      setName("");
    } catch (error) {
      const message =
        error instanceof ConvexError
          ? (error.data as string)
          : "Failed to create token. Please try again.";
      setAlert({ type: "error", message });
    }

    setIsCreating(false);
  }

  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    if (!createdToken) return;

    await navigator.clipboard.writeText(createdToken);
    setCopied(true);
  }

  // Revocation
  const deleteToken = useMutation(api.mcp_tokens.deleteToken);

  const [deletionModalOpen, setDeletionModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<{
    id: McpTokenId;
    name: string;
  } | null>(null);

  function handleCancelDelete() {
    setDeletionModalOpen(false);
    setTokenToDelete(null);
  }

  async function handleConfirmDelete() {
    if (!tokenToDelete) return;

    setIsDeleting(true);
    setAlert({ type: "error", message: "" });

    try {
      await deleteToken({ id: tokenToDelete.id });
      setDeletionModalOpen(false);
      setTokenToDelete(null);
    } catch (error) {
      const message =
        error instanceof ConvexError
          ? (error.data as string)
          : "Failed to delete token. Please try again.";
      setAlert({ type: "error", message });
      setDeletionModalOpen(false);
      setTokenToDelete(null);
    }

    setIsDeleting(false);
  }

  const handleRevoke = useCallback(
    (index: number) => {
      // The token name input shares this page; don't trigger row actions
      // while the user is typing in it.
      if (document.activeElement instanceof HTMLInputElement) return;

      if (!tokens) return;

      const token = tokens[index];
      setTokenToDelete({ id: token._id, name: token.name });
      setDeletionModalOpen(true);
    },
    [tokens],
  );

  const actions: TableRowActions = useMemo(
    () => ({
      d: handleRevoke,
    }),
    [handleRevoke],
  );

  return (
    <section>
      <h2 className="mb-2 text-xl font-bold text-white">MCP access tokens</h2>
      <p className="mb-4 max-w-2xl text-sm text-secondary-4">
        Tokens let your AI agents (via MCP) register expenses and earnings and
        read your data on your behalf. A token is shown once, right after
        creation. Store it in your agent's configuration. Tokens are valid until
        revoked.
      </p>

      {alert.message && (
        <div className="mb-4">
          <Alert type={alert.type} message={alert.message} />
        </div>
      )}

      {createdToken && (
        <div className="mb-4 max-w-2xl rounded-lg border border-primary-1 bg-primary-1/10 p-4">
          <p className="mb-2 text-sm font-bold text-primary-1">
            New token created — copy it now, it won't be shown again
          </p>

          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg bg-secondary-3 px-3 py-2 font-mono text-sm text-white">
              {createdToken}
            </code>

            <Button
              type="button"
              label={copied ? "Copied" : "Copy"}
              icon={copied ? LuCheck : LuCopy}
              iconPosition="left"
              onClick={handleCopy}
              size="sm"
              variant="primary-ghost"
            />
          </div>
        </div>
      )}

      <form
        onSubmit={handleCreate}
        className="mb-6 flex max-w-2xl items-end gap-2"
      >
        <div className="flex-1">
          <Input
            label="Token name"
            icon={LuTag}
            type="text"
            name="name"
            value={name}
            onChange={handleNameChange}
            placeholder="e.g. Claude"
          />
        </div>

        <Button
          type="submit"
          label="Create token"
          icon={LuKeyRound}
          iconPosition="left"
          loading={isCreating}
        />
      </form>

      {!tokens ? (
        <Spinner message="Loading your tokens" />
      ) : tokens.length === 0 ? (
        <p className="text-secondary-4">
          No tokens yet. Create one to connect an agent.
        </p>
      ) : (
        <div className="max-w-2xl">
          <Table numberOfRows={tokens.length}>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Created</TableHeader>
                <TableHeader>Last used</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>

            <TableBody>
              {tokens.map((token, index) => (
                <TableRow key={token._id} rowIndex={index} actions={actions}>
                  <TableHeader>{token.name}</TableHeader>
                  <TableCell>
                    {new Date(token.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {token.lastUsedAt
                      ? new Date(token.lastUsedAt).toLocaleString()
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      icon={LuTrash}
                      iconPosition="left"
                      onClick={() => handleRevoke(index)}
                      size="sm"
                      variant="danger-ghost"
                      label="Revoke"
                      tooltip={
                        <>
                          Revoke <Keymap text="d" className="ml-1" />
                        </>
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmationModal
        isOpen={deletionModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Revoke token"
        message={`Are you sure you want to revoke "${tokenToDelete?.name}"? Agents using it will immediately lose access. This action cannot be undone.`}
        confirmText="Revoke"
        variant="danger-ghost"
        loading={isDeleting}
      />
    </section>
  );
}
