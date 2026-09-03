export default function BrandLogo({ small = false, showText = true }) {
  return (
    <>
      <span
        className={"ph-logo-mark" + (small ? " small" : "")}
        aria-hidden="true"
      >
        <img src="/logo-128.png" alt="" width={128} height={128} />
      </span>
      {showText ? <span className="ph-logo-text">Vibe Building</span> : null}
    </>
  );
}
