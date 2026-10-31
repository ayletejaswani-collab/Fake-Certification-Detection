/** Renders a word with selected letters in the lime accent. */
export default function AccentText({ text, accent = "vowels", className = "" }) {
  const vowels = new Set(["A", "E", "I", "O", "U", "a", "e", "i", "o", "u"]);
  return (
    <span className={className}>
      {[...text].map((ch, i) => {
        const hit =
          accent === "vowels"
            ? vowels.has(ch)
            : Array.isArray(accent)
              ? accent.includes(i)
              : false;
        return (
          <span key={`${ch}-${i}`} className={hit ? "letter-accent" : undefined}>
            {ch}
          </span>
        );
      })}
    </span>
  );
}
