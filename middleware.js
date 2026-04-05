import { NextResponse } from "next/server";

export default function middleware(req) {
  const user = req.cookies.get("oboor_admin");

  let userData = {};
  if (user) userData = JSON.parse(user?.value);

  const url = req.url;
  if (!user && !url.includes("dashboard/pages/login") && !url.includes("dashboard/pages/verifyOtp") && !url.includes("dashboard/pages/forgot-password")  && !url.includes("dashboard/pages/verifyResetPassword")  && !url.includes("dashboard/pages/createNewPassword") ) {
    return NextResponse.redirect(new URL("/dashboard/pages/login", url));
  }
  if (user && url.includes("dashboard/pages/login")) {
    return NextResponse.redirect(new URL("/dashboard/pages/dashboard", url));
  }
  if (
    userData.user_type == "SALE" &&
    (url.includes("/dashboard/pages/dashboard") )
  ) {
    return NextResponse.redirect(new URL("/dashboard/pages/users", url));
  }
  if (
    userData.user_type === "SALE" &&
    (url.includes("/wallets") || url.includes("/packages"))
  ) {
    return NextResponse.redirect(new URL("/dashboard/pages/dashboard", url));
  }
}

export const config = {
  matcher: ["/dashboard/:slug*"],
};
