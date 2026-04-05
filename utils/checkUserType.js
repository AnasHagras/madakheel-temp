import Cookies from "js-cookie";

export default function checkUserType() {
  let userType = "";
  if (typeof window !== "undefined") {
    userType = JSON.parse(Cookies.get("oboor_admin")).user_type;
  }
  console.log(userType);
  if (userType === "ADM") {
    return true;
  } else {
    if (userType === "SALE") {
      return "sale";
    }
    return false;
  }
}
