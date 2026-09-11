export default function BrandLogo({ small = false, showText = true }) {
  return (
    <>
      <span
        className={"ph-logo-mark" + (small ? " small" : "")}
        aria-hidden="true"
      >
        <img src="/logo-128.png" alt="" width={128} height={128} />
      </span>
      {showText ? (
        <span className="ph-logo-stack">
          <span className="ph-logo-text">
            码上创
            <span className="ph-logo-text-en">vibe building</span>
          </span>
          <span className="ph-logo-sub">CSDN 开发者应用共创平台</span>
        </span>
      ) : null}
    </>
  );
}
