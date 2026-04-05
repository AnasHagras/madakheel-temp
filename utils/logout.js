import Cookies from "js-cookie";

export default function logout() {
  Cookies.remove("oboor_admin");
  window.location.reload();
  return;
}
