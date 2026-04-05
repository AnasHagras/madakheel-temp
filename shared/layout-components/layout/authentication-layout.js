import React, { useEffect } from "react";


const Authenticationlayout = ({ children }) => {
  useEffect(() => {
    document
      .querySelector("body")
      .classList.add("rtl", "main-body", "leftmenu", "error-1");
  });
  return (
    <>
      <div suppressHydrationWarning={true}>{children}</div>
    </>
  );
};

export default Authenticationlayout;
