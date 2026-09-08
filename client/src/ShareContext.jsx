import { createContext, useCallback, useContext, useMemo, useState } from "react";
import ShareModal from "./components/ShareModal";

const ShareContext = createContext(null);

export function ShareProvider({ children }) {
  const [product, setProduct] = useState(null);

  const openShare = useCallback((nextProduct) => {
    if (!nextProduct?.id) return;
    setProduct(nextProduct);
  }, []);

  const closeShare = useCallback(() => {
    setProduct(null);
  }, []);

  const value = useMemo(
    () => ({
      openShare,
      closeShare,
      sharingProduct: product,
    }),
    [openShare, closeShare, product],
  );

  return (
    <ShareContext.Provider value={value}>
      {children}
      <ShareModal product={product} open={!!product} onClose={closeShare} />
    </ShareContext.Provider>
  );
}

export function useShare() {
  const ctx = useContext(ShareContext);
  if (!ctx) {
    throw new Error("useShare must be used within ShareProvider");
  }
  return ctx;
}
