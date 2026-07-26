export function ModelBadge({ model }: { model: string }) {
  return (
    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
      {model}
    </span>
  );
}
