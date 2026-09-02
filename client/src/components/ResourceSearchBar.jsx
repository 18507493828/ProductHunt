import { Search } from "lucide-react";

export default function ResourceSearchBar({ value, onChange, onSubmit, placeholder }) {
  return (
    <form
      className="ph-search-bar"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <Search className="ph-search-icon" size={18} aria-hidden="true" />
      <input
        type="search"
        className="ph-search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "搜索资源名称、介绍、分类…"}
        aria-label="搜索资源"
      />
      {value && (
        <button
          type="button"
          className="ph-search-clear"
          onClick={() => onChange("")}
          aria-label="清除搜索"
        >
          ×
        </button>
      )}
      <button type="submit" className="ph-search-btn">
        搜索
      </button>
    </form>
  );
}
