import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

const meta = {
  component: Table,
  argTypes: {
    numberOfRows: { table: { disable: true } },
  },
  parameters: {
    docs: {
      description: {
        component:
          "A flexible table component built with compound components. Use Table as the root, with TableHead, TableBody, TableRow, TableHeader, and TableCell subcomponents.",
      },
    },
  },
} satisfies Meta<typeof Table>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    numberOfRows: 5,
  },
  render: (args) => {
    const actions = {
      e: () => console.log("Edit action triggered"),
      d: () => console.log("Delete action triggered"),
    };

    return (
      <Table {...args}>
        <TableHead>
          <TableRow>
            <TableHeader>Name</TableHeader>
            <TableHeader>Email</TableHeader>
            <TableHeader>Role</TableHeader>
            <TableHeader>Status</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow rowIndex={0} actions={actions}>
            <TableCell>John Doe</TableCell>
            <TableCell>john@example.com</TableCell>
            <TableCell>Admin</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
          <TableRow rowIndex={1} actions={actions}>
            <TableCell>Jane Smith</TableCell>
            <TableCell>jane@example.com</TableCell>
            <TableCell>User</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
          <TableRow rowIndex={2} actions={actions}>
            <TableCell>Bob Johnson</TableCell>
            <TableCell>bob@example.com</TableCell>
            <TableCell>User</TableCell>
            <TableCell>Inactive</TableCell>
          </TableRow>
          <TableRow rowIndex={3} actions={actions}>
            <TableCell>Alice Brown</TableCell>
            <TableCell>alice@example.com</TableCell>
            <TableCell>Manager</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
          <TableRow rowIndex={4} actions={actions}>
            <TableCell>Charlie Wilson</TableCell>
            <TableCell>charlie@example.com</TableCell>
            <TableCell>Developer</TableCell>
            <TableCell>Inactive</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  },
};
