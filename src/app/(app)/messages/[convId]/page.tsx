
// This page now simply re-exports the main messages page component.
// This allows both /messages and /messages/[convId] to use the same logic,
// with the [convId] page passing its `params` to the shared component.

// Required for static export compatibility
export async function generateStaticParams() {
  return [];
}

export { default } from '../page';
