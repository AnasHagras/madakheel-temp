import React, { useEffect, useReducer, useState } from "react";
import dynamic from "next/dynamic";
import PageHeader from "../../../shared/layout-components/page-header/page-header";
import Seo from "../../../shared/layout-components/seo/seo";
import { Button, Form, Modal } from "react-bootstrap";
import Link from "next/link";
import { toast } from "react-toastify";
import { getUserCookies } from "../../../utils/getUserCookies";
import logout from "../../../utils/logout";

const Dashboardecommerce = dynamic(
  () => import("../../../shared/data/e-commerce/dashboard"),
  { ssr: false },
);

const Dashboard = () => {
  const user = getUserCookies();
  const [stats, setStats] = useState({});
  const [showReportModal, setShowReportModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [packages, setPackages] = useState([]);
  const [packageSummary, setPackageSummary] = useState([]);
  const [reportStart, setReportStart] = useState("");
  const [reportEnd, setReportEnd] = useState("");
  const [reportPackage, setReportPackage] = useState("all");
  const [reportIsSold, setReportIsSold] = useState("false");
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState([]);
  const [urgent, setUrgent] = useState([]);
  const [urgentCount, setUrgentCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isCanShowFiles, setIsCanShowFiles] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Default date values
  const defaultStart = new Date(new Date().setDate(new Date().getDate() - 30)).toLocaleDateString("en-CA");
  const defaultEnd = new Date().toLocaleDateString("en-CA");

  // Initialize state with defaults (will be updated from URL when router is ready)
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);

  const { token, id, user_type } = user;

  // Initialize dates from URL query params on mount/refresh - do this immediately
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      const params = new URLSearchParams(window.location.search);
      const urlStart = params.get('start');
      const urlEnd = params.get('end');

      // Set dates from URL or keep defaults
      if (urlStart && urlStart !== start) {
        setStart(urlStart);
      }
      if (urlEnd && urlEnd !== end) {
        setEnd(urlEnd);
      }

      setIsInitialized(true);
    }
  }, []);

  // Update URL without page refresh when dates change (only after initialization)
  useEffect(() => {
    if (typeof window === 'undefined' || !isInitialized) return;

    const params = new URLSearchParams(window.location.search);
    const currentStart = params.get('start');
    const currentEnd = params.get('end');

    // Only update URL if dates actually changed
    if (currentStart !== start || currentEnd !== end) {
      const nextQuery = {};
      if (start) nextQuery.start = start;
      if (end) nextQuery.end = end;
      const nextParams = new URLSearchParams(nextQuery).toString();
      const newUrl = nextParams ? `${window.location.pathname}?${nextParams}` : window.location.pathname;
      window.history.replaceState(null, '', newUrl);
    }
  }, [start, end, isInitialized]);

  useEffect(() => {
    if (user_type === "ACC") {

      const permissions = JSON.parse(localStorage.getItem("permissions"))
      const componentPermissions = permissions?.filter(
        (permission) => permission.group_name === 'الرئيسية'
      );


      const canShowFiles = componentPermissions?.some((permission) => permission.display_name === 'عرض');

      setIsCanShowFiles(canShowFiles);
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async (is_urgent) => {
      try {
        const res = await fetch(`${baseUrl}/api/v1/notifications/?is_urgent=${is_urgent}`, {
          headers: {
            Authorization: ` ${user.token}`,
          },
        });
        if (res.status == 401) {
          logout()
        }
        const data = await res.json();


        is_urgent ? setUrgent(data.notifications) : setNotification(data.notifications);
        is_urgent ? setUrgentCount(data.counter) : setNotificationCount(data.counter);
      } catch (error) {

      }
    };

    user_type === "ADM" && fetchData(true);
    user_type === "ADM" && fetchData(false);
  }, [user.token, update]);
  useEffect(() => {
    const fetchStats = async () => {
      if (!isInitialized) return;

      setLoading(true);
      try {
        const res = await fetch(`${baseUrl}/api/v1/dashboard_stats/?date_start=${start}&date_end=${end}`, {
          headers: {
            Authorization: `${user.token}`,
          },
        });

        if (res.status == 401) {
          logout();
          return;
        }

        const data = await res.json();
        if (data) {
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch as soon as initialization is complete
    if (isInitialized) {
      fetchStats();
    }
  }, [user.token, update, start, end, isInitialized]);

  const getRealTimeUsersCount = async () => {
    const res = await fetch(`${baseUrl}/api/v1/get_realtime_user/`, {
      headers: {
        Authorization: `${user.token}`,
      },
    });
    if (res.status == 401) {
      logout()
    }
    const result = await res.json();
    return result?.users_count;
  };

  const getPackages = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/v1/package_search/?admin_id=${id}&page_size=1000`, {
        headers: { Authorization: user.token },
      });
      if (res.status === 401) { logout(); return; }
      const result = await res.json();
      if (result?.results) setPackages(result.results);
    } catch (err) {
      console.error("Error fetching packages:", err);
    }
  };

  const handleOpenReportModal = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    setReportStart(thirtyDaysAgo.toISOString().split("T")[0]);
    setReportEnd(today.toISOString().split("T")[0]);
    setReportPackage("all");
    setReportIsSold("false");
    setShowReportModal(true);
    getPackages();
  };

  const handleFetchReport = async () => {
    setReportLoading(true);
    try {
      let url = `${baseUrl}/api/v1/excel_paid_purchases_receipts/?start_date=${reportStart}&end_date=${reportEnd}&is_sold=${reportIsSold}`;
      if (reportPackage && reportPackage !== "all") {
        url += `&package_id=${reportPackage}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: user.token },
      });
      if (res.status === 401) { logout(); return; }
      const data = await res.json();
      setShowReportModal(false);
      toast.success(data.message || "تم تنفيذ الطلب بنجاح");
      setPackageSummary(data.package_summary || []);
      setShowResultsModal(true);
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("حدث خطأ أثناء تنفيذ الطلب");
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <>
      <Seo title='لوحة التحكم' />

      <PageHeader
        title='لوحة التحكم'
        item='شركة وحيد'
        active_item='لوحة التحكم'
      />
      <div className="d-flex justify-content-end mb-3">
        <Button variant="primary" onClick={handleOpenReportModal}>
          حساب كميات البيع
        </Button>
      </div>
      {
        user_type === "ADM" || isCanShowFiles ? (
          loading ? (
            <section
              style={{ height: "85vh" }}
              className='d-flex justify-content-center align-items-center'
            >
              <div className='loader' />
            </section>
          ) : (
            <Dashboardecommerce
              user={user}
              stats={stats}
              getRealTimeUsersCount={getRealTimeUsersCount}
              urgent={urgent}
              urgentCount={urgentCount}
              notification={notification}
              notificationCount={notificationCount}
              forceUpdate={forceUpdate}
              setEnd={setEnd}
              setStart={setStart}
              start={start}
              end={end}
            />
          )
        ) : ''
      }

      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>حساب كميات البيع</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>تاريخ البداية</Form.Label>
              <Form.Control
                type="date"
                value={reportStart}
                onChange={(e) => setReportStart(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>تاريخ النهاية</Form.Label>
              <Form.Control
                type="date"
                value={reportEnd}
                onChange={(e) => setReportEnd(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>الباقة</Form.Label>
              <Form.Select
                value={reportPackage}
                style={{ paddingRight: "30px" }}
                onChange={(e) => setReportPackage(e.target.value)}
              >
                <option value="all">جميع الباقات</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.title}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>تم البيع</Form.Label>
              <Form.Select
                value={reportIsSold}
                style={{ paddingRight: "30px" }}
                onChange={(e) => setReportIsSold(e.target.value)}
              >
                <option value="false">لا</option>
                <option value="true">نعم</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReportModal(false)}>
            إلغاء
          </Button>
          <Button variant="primary" onClick={handleFetchReport} disabled={reportLoading}>
            {reportLoading ? "جاري التنفيذ..." : "تنفيذ"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showResultsModal} onHide={() => setShowResultsModal(false)} size="lg" centered backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>ملخص الباقات</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>رقم الباقة</th>
                  <th>اسم الباقة</th>
                  <th>الكمية</th>
                </tr>
              </thead>
              <tbody>
                {packageSummary.length > 0 ? packageSummary.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row["رقم الباقة"]}</td>
                    <td>
                      <Link
                        href={`/dashboard/pages/packages/${row["رقم الباقة"]}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary"
                      >
                        {row["اسم الباقة"]}
                      </Link>
                    </td>
                    <td>{row["الكمية"]}</td>
                  </tr>
                )) : <tr key="no-data">
                  <td colSpan={3} className="text-center">لا توجد بيانات</td>
                </tr>}
              </tbody>
            </table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResultsModal(false)}>
            إغلاق
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

Dashboard.layout = "Contentlayout";

export default Dashboard;
