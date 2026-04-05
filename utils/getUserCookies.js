import Cookies from "js-cookie";

export function getUserCookies() {
  const user = Cookies.get("oboor_admin")
    ? JSON.parse(Cookies.get("oboor_admin"))
    : { token: "", id: "", user_type: "", mobile: "", name: "" };
  return user;
}
