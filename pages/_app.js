import "../styles/globals.scss";
import Contentlayout from "../shared/layout-components/layout/content-layout";
import Switcherlayout from "../shared/layout-components/layout/switcher-layout";
import Authenticationlayout from "../shared/layout-components/layout/authentication-layout";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logout from "../utils/logout";
import { getUserCookies } from "../utils/getUserCookies";
const user = getUserCookies();
const layouts = {
  Contentlayout: Contentlayout,
  Switcherlayout: Switcherlayout,
  Authenticationlayout: Authenticationlayout,
};

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { token, id, user_type } = user;
  useEffect(() => {
    const handleStart = (url) => {
      if (url !== router.asPath) {
        setLoading(true);
      }
    };
    const handleComplete = () => setLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router.events]);

  const Layout = layouts[Component.layout] || ((pageProps) => <Component {...pageProps} />);

  const checkForInactivity = () => {
    const expireTime = localStorage.getItem("expireTime");
    if (expireTime < Date.now()) {
      logout();
    }
  };

  const updateExpireTime = () => {
    // Set auto logout to 1 hour (60 minutes) for all users
    const time = 1000 * 60 * 60; // 60 minutes = 1 hour
    const expireTime = Date.now() + time;
    localStorage.setItem("expireTime", expireTime);
  };

  useEffect(() => {
    const interval = setInterval(checkForInactivity, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    updateExpireTime();
    window.addEventListener("mousemove", updateExpireTime);
    window.addEventListener("keypress", updateExpireTime);
    window.addEventListener("scroll", updateExpireTime);
    window.addEventListener("click", updateExpireTime);

    return () => {
      window.removeEventListener("mousemove", updateExpireTime);
      window.removeEventListener("keypress", updateExpireTime);
      window.removeEventListener("scroll", updateExpireTime);
      window.removeEventListener("click", updateExpireTime);
    };
  }, []);
  useEffect(() => {
    if (user_type == "ACC") {

      fetch(`${baseUrl}/api/v1/get_accountant/${id}/?have_sales_permission=`, {
        headers: {

          Authorization: `${user.token}`,
        },

      })
        .then((res) => {
          if (res.status === 401) {
            logout();
            return;
          }
          return res.json();
        })
        .then((data) => {
          localStorage.setItem("permissions", JSON.stringify(data.permissions));
        })
        .catch((err) => console.log(err));
    }
  }, [id]);

  return (
    <Layout>
      {loading ? (
        <section
          style={{ height: "85vh" }}
          className='d-flex justify-content-center align-items-center'
        >
          <div className='loader' />
        </section>
      ) : (
        <Component {...pageProps} />
      )}
      <ToastContainer autoClose={3000} position='top-center' theme='dark' />
    </Layout>
  );
}

export default MyApp;
