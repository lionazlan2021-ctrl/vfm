/**
 * The sellers we search, drifting slowly sideways. Pure CSS (see .marquee in
 * globals.css): the list is rendered twice so the loop is seamless, the copy is
 * hidden from screen readers, and it stops for reduced motion or on hover.
 */
export default function Marquee({ items }: { items: string[] }) {
  const row = (hidden: boolean) => (
    <ul className="marquee-row" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <li key={item} className="display marquee-item">
          {item}
          <span className="marquee-dot" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="marquee" aria-label="Sellers we search">
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
