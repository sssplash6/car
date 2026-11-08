import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import { ShortcutKbd } from "@/app/_components/ShortcutKbd";

// A plain GET search form (DESIGN.md §4.5): every search is a shareable URL
// and needs no client JavaScript.
export function SearchField({
  action,
  name = "q",
  id = "site-search",
  label,
  defaultValue,
  placeholder,
  hidden,
  shortcutHint = false,
}: {
  action: string;
  name?: string;
  id?: string;
  label: string;
  defaultValue?: string;
  placeholder: string;
  /** Extra values the search keeps (e.g. the selected year). */
  hidden?: Record<string, string>;
  shortcutHint?: boolean;
}) {
  return (
    <form action={action} role="search" className="search-field">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <MagnifyingGlassIcon aria-hidden="true" />
      <input
        id={id}
        type="search"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
      />
      {hidden &&
        Object.entries(hidden).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
      {shortcutHint && <ShortcutKbd className="max-md:hidden" aria-hidden />}
    </form>
  );
}
