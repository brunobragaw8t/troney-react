import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/categories/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/categories/create"!</div>
}
